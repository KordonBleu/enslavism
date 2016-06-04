const http = require('http'),
	enslavism = require('..');

var masterServer1 = new enslavism.Master(8080);

var httpServer = http.createServer((req, res) => {
	res.writeHead(200);
	res.end("Hey there, this is a demo page.")
});
httpServer.listen(8081);
var masterServer1 = new enslavism.Master(httpServer);
