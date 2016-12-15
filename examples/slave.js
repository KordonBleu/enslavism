const enslavism = require('..');

let connectedClients = 0;

new enslavism.Slave('ws://localhost:8081', {
	name: 'Test slave server', // this data is visible
	connectedAmount: 16 // by all clients
}, {
	username: 'getkey', // this argument is optional
	password: 'secret',
	whateverStringYouWant: 'yay!'
}).then(slave => {
	slave.on('offer', reject => { // this prevent more than one client to be connected
		if (connectedClients > 0) reject(); // this is an example of what you can do of course, I don't know why you would want to do this
		else connectedClients += 1;
	});

	slave.on('connection', clCo => {
		clCo.on('datachannel', dc => {
			console.log('new dataChannel');
			dc.addEventListener('open', ev => {
				console.log('data channel open', ev);
				dc.send('hallo welt');
			});
			dc.addEventListener('message', msg => {
				console.log('Received message:', msg.data);
			});
		});
	});
}).catch(err => {
	console.error(err);
});
