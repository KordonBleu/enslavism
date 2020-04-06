const http = require('http');
const fs = require('fs');
const enslavism = require('..');

new enslavism.Master(8080); // port

const httpServer = http.createServer((req, res) => {
	const path = req.url === '/' ? '/index.html' : req.url;
	fs.readFile(__dirname + path, (err, data) => {
		if (err) console.error(err);
		res.writeHead(200);
		res.end(data);
	});
});
httpServer.listen(8081);
const masterServer2 = new enslavism.Master(httpServer);

masterServer2.on('slaveauth', (authData, reject) => {
	if (authData.username !== 'getkey' || authData.password !== 'secret') reject('Invalid credentials!');
});
masterServer2.on('clientauth', (authData) => {
	if (authData.username !== undefined) console.log(authData.username + ' wants to connect!');
});

masterServer2.on('slaveconnection', (ws) => {
	console.log('Slave connected @', ws._socket.remoteAddress);
});

masterServer2.on('clientconnection', (ws) => {
	console.log('Client connected @', ws._socket.remoteAddress);
});
