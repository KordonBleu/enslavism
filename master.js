'use strict';

const http = require('http'),
	fs = require('fs'),
	WebSocketServer = require('ws').Server,
	message = require('./message.js'),
	MAX_UINT32 = Math.pow(2, 32) - 1;

let clientSourceCode = fs.readFileSync('./client.js', 'utf8').replace('\'include message.js\';', fs.readFileSync('./message.js', 'utf8'));

class Master {
	constructor(server) {
		function bufferToArrayBuffer(buf) {
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		}
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


		this._slavesSocket = new WebSocketServer({server: this._httpServer, path: '/enslavism/slaves'});
		this._slavesSocket.currentId = 0;
		this._slavesSocket.wrapMode = false;
		this._clientsSocket = new WebSocketServer({server: this._httpServer, path: '/enslavism/clients'});
		this._clientsSocket.currentId = 0;
		this._clientsSocket.wrapMode = false;

		this._slavesSocket.on('connection', ws => {
			ws.id = this.giveId(this._slavesSocket);

			ws.on('message', msg => {
				msg = bufferToArrayBuffer(msg);

				switch (new Uint8Array(msg)[0]) {
					case message.register.type:
						ws.slaveUserData = message.register.deserialize(msg);
						let newSlaveBuf = message.addSlaves.serialize([ws]);
						this._clientsSocket.clients.forEach(client => {
							client.send(newSlaveBuf);
						});
						break;
					case message.answerToClient.type:
						console.log('got an answer from slave');
						let {id, sdp} = message.answerToClient.deserialize(msg),
							receiver = this.findClient(id);
						if (receiver !== undefined) receiver.send(message.answerFromSlave.serialize(ws.id, sdp));
						break;
					case message.iceCandidateToClient.type:
						console.log('got an ice candidate from a slave');
						console.log(message.iceCandidateToClient.deserialize(msg));
						break;

				}
			});
			ws.on('close', () => {
				let removeSlaveBuf = message.removeSlaves.serialize([ws.id]);
				this._clientsSocket.clients.forEach(client => {
					client.send(removeSlaveBuf);
				});
			});
		});

		this._clientsSocket.on('connection', ws => {
			ws.id = this.giveId(this._clientsSocket);

			console.log('client connected');
			ws.send(message.addSlaves.serialize(this._slavesSocket.clients));

			ws.on('message', msg => {
				msg = bufferToArrayBuffer(msg);

				switch (new Uint8Array(msg)[0]) {
					case message.offerToSlave.type:
						console.log('got an offerToSlave from a client');
						let {id, sdp} = message.offerToSlave.deserialize(msg),
							receiver = this.findSlave(id);
						if (receiver !== undefined) receiver.send(message.offerFromClient.serialize(ws.id, sdp));
						break;
					case message.iceCandidateToSlave.type:
						console.log('got an ice candidate from a client');
						console.log(message.iceCandidateToSlave.deserialize(msg));
						break;
				}
			});
		});
	}
	findSlave(id) { // get slave corresponding to this id
		return this._slavesSocket.clients.find(slave => {
			return slave.id === id;
		})
	}
	findClient(id) { // get client corresponding to this id
		return this._clientsSocket.clients.find(client => {
			return client.id === id;
		})
	}
	giveId(wss) {
		if (wss.currentId > MAX_UINT32) {
			wss.currentId = 0;
			wss.wrapMode = true;
		}
		if (wss.wrapMode) {
			// since the maximum size of an array is 2^32 - 1
			// that means that if the server has be able to add an object to wss.clients, there is at least an id available for it
			while (wss.currentId <= MAX_UINT32 && wss.clients.find((client) => {
				return client.id === wss.currentId;
			}) !== undefined) ++wss.currentId;
		}
		return wss.currentId++;
	}
}

module.exports = Master;
