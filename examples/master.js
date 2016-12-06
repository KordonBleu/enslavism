const http = require('http'),
	fs = require('fs'),
	enslavism = require('..');

var masterServer1 = new enslavism.Master(8080); // port

var httpServer = http.createServer((req, res) => {
	let path = req.url === '/' ? '/index.html' : req.url;
	fs.readFile(__dirname + path, (err, data) => {
		if (err) console.error(err);
		res.writeHead(200);
		res.end(data);
	});
});
httpServer.listen(8081);
var masterServer2 = new enslavism.Master(httpServer);
masterServer2.on('slaveauth', (authData, reject) => {
	if (authData.username !== 'getkey' || authData.password !== 'secret') reject('Invalid credentials!');
});
masterServer2.on('clientauth', (authData, reject) => {
	reject();
	if (authData.username !== undefined) console.log(authData.username + ' wants to connect!');
});
