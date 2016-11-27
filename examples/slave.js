const enslavism = require('..');

let slave = new enslavism.Slave('ws://localhost:8081', {
	name: 'Test slave server',
	connectedAmount: 16
});

slave.on('newclco', clCo => {
	clCo.on('newdc', dc => {
		console.log('new dataChannel');
		dc.addEventListener('open', (ev) => {
			console.log('data channel open', ev);
			dc.send('hallo welt');
		});
		dc.addEventListener('message', msg => {
			console.log(msg);
		});
	});
});
