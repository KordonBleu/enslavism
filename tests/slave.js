const enslavism = require('..');

let slave = new enslavism.Slave('ws://localhost:8081', {
	name: "Test slave server",
	connectedAmount: 16
});
