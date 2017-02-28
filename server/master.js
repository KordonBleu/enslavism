import * as proto from '../shared/proto.js';
import * as convert from './convert.js';
import SocketList from './socket_list.js';

const EventEmitter = require('events'),
	http = require('http'),
	url = require('url'),
	WebSocketServer = require('ws').Server,
	cookie = require('cookie'),
	rollup = require('rollup'),
	alias = require('rollup-plugin-alias');

let clientSource = null;
function generateClientSource() {
	if (clientSource !== null && process.env.NODE_ENV === 'production') return Promise.resolve(clientSource);
	else {
		let plugins = [
			alias({
				'<@convert@>': './../client/convert.js'
			})
		];
		if (process.env.NODE_ENV !== 'production') {
			const eslint = require('rollup-plugin-eslint');
			plugins.push(eslint());
		}
		return new Promise((resolve, reject) => {
			rollup.rollup({
				entry: __dirname + '/client/master_connection.js',
				plugins
			}).then(bundle => {
				clientSource = bundle.generate({
					format: 'iife',
					moduleName: 'MasterConnection'
				});
				resolve(clientSource);
			}).catch(reject);
		});
	}
}

export default class Master extends EventEmitter {
	constructor(server) {
		super();

		this._slaves = new SocketList();
		this._clients = new SocketList();

		function sendSource(res) {
			res.writeHead(200, {'Content-Type': 'application/javascript'});
			generateClientSource().then(source => {
				res.end(source.code);
			}).catch(console.error);
		}

		// fat arrow function needed for lexical scoping
		const wsSrvFactory = type => {
			let wsSrv = new WebSocketServer({
				noServer: true,
				verifyClient: (info, cb) => {
					let accept = true,
						reason,
						authData = info.req.headers.cookie === undefined ? {} : cookie.parse(info.req.headers.cookie);
					this.emit(type + 'auth', authData, (rejectionReason) => {
						reason = rejectionReason;
						accept = false;
					});

					if (accept === true) cb(true);
					else cb(false, 401, reason);
				}
			});

			wsSrv.currentId = 0;
			wsSrv.wrapMode = false;
			wsSrv.on('error', err => {
				this.emit('error', err);
			});
			wsSrv.on('connection', ws => {
				this.emit(type + 'connection', ws);
			});

			return wsSrv;
		};


		if (typeof server === 'number') {
			this._httpServer = http.createServer((req, res) => {
				if (req.url === '/enslavism/client.js') sendSource(res);
				else {
					res.writeHead(404);
					res.end('404\nNot found');
				}
			});

			this._httpServer.listen(server);
		} else {
			let userDefReqListeners = server.listeners('request');

			server.removeAllListeners('request');

			server.on('request', (req, res) => {
				if (req.url === '/enslavism/client.js') sendSource(res);
				else {
					for (let listener of userDefReqListeners) {
						listener.call(server, req, res);
					}
				}
			});

			this._httpServer = server;
		}


		this._slavesSocket = wsSrvFactory('slave');
		this._clientsSocket = wsSrvFactory('client');

		this._httpServer.on('upgrade', (request, socket, head) => {
			// see https://github.com/websockets/ws/pull/885
			const pathname = url.parse(request.url).pathname;

			if (pathname === '/enslavism/slaves') {
				this._slavesSocket.handleUpgrade(request, socket, head, ws => {
					this._slavesSocket.emit('connection', ws);
				});
			} else if (pathname === '/enslavism/clients') {
				this._clientsSocket.handleUpgrade(request, socket, head, ws => {
					this._clientsSocket.emit('connection', ws);
				});
			} else {
				socket.destroy();
			}
		});

		this._slavesSocket.on('connection', ws => {
			let id = this._slaves.add(ws);

			ws.on('message', msg => {
				msg = convert.bufferToArrayBuffer(msg);

				switch (proto.getSerializator(msg)) {
					case proto.register: {
						ws.userData = proto.register.deserialize(msg);
						let newSlaveBuf = proto.addSlaves.serialize({
							// duck-typing to mock a SocketList
							values: function*() {
								yield ws;
							},
							keys: function*() {
								yield id;
							}
						});
						for (let client of this._clients.values()) {
							client.send(newSlaveBuf);
						}
						break;
					}
					case proto.answerToClient: {
						let receiver = this.findClient(proto.answerToClient.getDestId(msg));
						if (receiver !== undefined) {
							proto.answerFromSlave.setDestId(msg, id);
							receiver.send(msg);
						}
						break;
					}
					case proto.iceCandidateToClient: {
						let receiver = this.findClient(proto.iceCandidateToClient.getDestId(msg));
						if (receiver !== undefined) {
							proto.iceCandidateFromSlave.setDestId(msg, id);
							receiver.send(msg);
						}
						break;
					}
					case proto.rejectToClient: {
						let receiver = this.findClient(proto.rejectToClient.deserialize(msg));
						if (receiver !== undefined) {
							receiver.send(proto.rejectFromSlave.serialize(id));
						}
						break;
					}

				}
			});
			ws.on('close', () => {
				let removeSlaveBuf = proto.removeSlaves.serialize([id]);
				for (let client of this._clients.values()) {
					client.send(removeSlaveBuf);
				}
				this._slaves.delete(id);
			});
		});

		this._clientsSocket.on('connection', ws => {
			let id = this._clients.add(ws);

			ws.send(proto.addSlaves.serialize(this._slaves));

			ws.on('message', msg => {
				msg = convert.bufferToArrayBuffer(msg);

				switch (proto.getSerializator(msg)) {
					case proto.offerToSlave: {
						let receiver = this.findSlave(proto.offerFromClient.getDestId(msg));
						if (receiver !== undefined) {
							proto.offerFromClient.setDestId(msg, id);
							receiver.send(msg);
						}
						break;
					}
					case proto.iceCandidateToSlave: {
						let receiver = this.findSlave(proto.iceCandidateToSlave.getDestId(msg));
						if (receiver !== undefined) {
							proto.iceCandidateFromClient.setDestId(msg, id);
							receiver.send(msg);
						}
						break;
					}
				}
			});
			ws.on('close', () => {
				this._clients.delete(id);
			});
		});
	}
	findSlave(id) { // get slave corresponding to this id
		return this._slaves.find(id);
	}
	findClient(id) { // get client corresponding to this id
		return this._clients.find(id);
	}
}
