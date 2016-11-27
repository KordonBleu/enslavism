const http = require('http'),
	fs = require('fs'),
	enslavism = require('..');

var masterServer1 = new enslavism.Master(8080);

var httpServer = http.createServer((req, res) => {
	let path = req.url === '/' ? '/index.html' : req.url;
	fs.readFile(__dirname + path, (err, data) => {
		if (err) console.log(err);
		res.writeHead(200);
		res.end(data);
	});
});
httpServer.listen(8081);
var masterServer2 = new enslavism.Master(httpServer);
