'use strict';

const http = require('http'),
	fs = require('fs'),
	WebSocketServer = require('ws').Server,
	message = require('./message.js'),
	MAX_UINT32 = Math.pow(2, 32) - 1;

let clientSourceCode = fs.readFileSync('./client.js', 'utf8').replace('\'include message.js\';', fs.readFileSync('./message.js', 'utf8'));

class Master {
	constructor(server) {
		let slaveId = 0,
			wrapMode = false;

		if (typeof server === 'number') {
			this._httpServer = http.createServer((req, res) => {
				if (req.url === '/enslavism/client.js') {
					res.writeHead(200, {'Content-Type': 'application/javascript'});
					res.end(clientSourceCode);
				} else {
					res.writeHead(404);
					res.end('404\nNot found');
				}
			});
			this._httpServer.listen(server);
		} else {
			let userDefReqListeners = server.listeners('request');

			server.removeAllListeners('request');
			server.on('request', (req, res) => {
				if (req.url === '/enslavism/client.js') {
					res.writeHead(200, {'Content-Type': 'application/javascript'});
					res.end(clientSourceCode);
				} else {
					userDefReqListeners.forEach(listener => {
						listener.call(server, req, res);
					});
				}
			});

			this._httpServer = server;
		}


		this._slavesSocket = new WebSocketServer({server: this._httpServer, path: '/enslavism/slaves'}),
		this._clientsSocket = new WebSocketServer({server: this._httpServer, path: '/enslavism/clients'});

		this._slavesSocket.on('connection', ws => {
			if (slaveId > MAX_UINT32) {
				slaveId = 0;
				wrapMode = true;
			}
			if (wrapMode) {
				if (this._slavesSocket.clients.length < MAX_UINT32) ws.close();
				else while (slaveId <= MAX_UINT32 && this._slavesSocket.clients.find((slave) => {
					return slave.slaveId === slaveId;
				}) !== undefined) ++slaveId;
			}
			ws.slaveId = slaveId++;

			ws.on('message', msg => {
				switch (new Uint8Array(msg)[0]) {
					case message.register.type:
						ws.slaveUserData = message.register.deserialize(msg);
						let newSlaveBuf = message.addSlaves.serialize([ws]);
						this._clientsSocket.clients.forEach(client => {
							client.send(newSlaveBuf);
						});
				}
			});
			ws.on('close', () => {
				let removeSlaveBuf = message.removeSlaves.serialize([ws.slaveId]);
				this._clientsSocket.clients.forEach(client => {
					client.send(removeSlaveBuf);
				});
			});
		});
		this._clientsSocket.on('connection', ws => {
			console.log('client connected');
			ws.send(message.addSlaves.serialize(this._slavesSocket.clients));

			ws.on('message', msg => {
				switch (new Uint8Array(msg)[0]) {
					case message.offer.type:
						console.log('got an offer from a client');
				}
			});
		});
	}
}

module.exports = Master;
