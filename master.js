'use strict';

const http = require('http'),
	fs = require('fs'),
	WebSocketServer = require('ws').Server,
	message = require('./message.js');

var clientSourceCode = fs.readFileSync('./client-bundle.js', 'utf8');

class Master {
	constructor(server) {
		//this._slaves = [];
		this._slaves = new Map();

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
			var userDefReqListeners = server.listeners('request');

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
			this._slaves.push(ws);

			ws.on('message', msg => {
				switch (new Uint8Array(msg)[0]) {
					case message.register.type:
						this._slaves.set(ws, message.register.deserialize(msg));
						break;
				}
			});

			ws.on('close', () => {
				for (let slaveWs of this._slaves.keys()) {
					if (slaveWs === ws) this._slaves.delete(slaveWs);
				}
			});
		});
		this._clientsSocket.on('connection', ws => {
			ws.send(message.addSlaves([...myMap.values()]));
		});
	}
}

module.exports = Master;
