document.cookie = 'username=getkey';

let masterCon = new MasterConnection('ws://localhost:8081');

masterCon.addEventListener('slave', slaveCo => {
	console.log('new slave', slaveCo);

	// this is optional, but connecting takes time so you should do it as soon as possible, before opening data channels if you can
	// slaveCo.connect();
	// in this example doing it won't make things faster

	slaveCo.createDataChannel('test') // if you are not connected this will do it automatically
	.then(dc => {
		dc.addEventListener('message', msg => {
			console.log(msg);
		});
		dc.send('What have I wrought!');
	});

	slaveCo.addEventListener('rejected', () => {
		console.log('The slave has rejected the connection :-(');
	});
});
