let masterCon = new MasterConnection('ws://localhost:8081');

masterCon.addEventListener('slave', slaveCo => {
	console.log('new slave', slave);
	slave.connect();
	slave.createDataChannel('test')
	.then(dc => {
		dc.addEventListener('message', msg => {
			console.log(msg);
		});
		dc.send('What have I wrought!');
	});
});
