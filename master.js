'use strict';

const http = require('http'),
	fs = require('fs'),
	webrtc = require('wrtc'),
	WebSocketServer = require('ws').Server;

var server = http.createServer((req, res) => {
	if (req.url === '/enslavism/client.js') {
		fs.readFile('./client.js', (err, data) => {
			if (err) throw err;

			res.writeHead(200, {'Content-Type': 'application/javascript'});
			res.end(data);
		});
	} else {
		res.writeHead(404);
		res.end('404\nNot found');
	}
}),
	slavesSocket = new WebSocketServer({server: server, path: '/enslavism/slaves'}),
	clientsSocket = new WebSocketServer({server: server, path: '/enslavism/clients'});
server.listen(8080);

slaves = [];
slavesSocket.on('connection', ws => {
	slaves.push(ws);

	ws.on('close', () => {
		slaves.forEach((slave, i) => {
			if (slave === ws) slaves.splice(i, 1);
		});
	});
});
