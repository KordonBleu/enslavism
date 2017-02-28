document.cookie = 'username=getkey';

let masterCon = new MasterConnection('ws://localhost:8081');

masterCon.addEventListener('slaveadded', slaveCo => {
	console.log('new slave', slaveCo);

	// this is optional, but connecting takes time so you should do it as soon as possible, before opening data channels if you can
	// slaveCo.connect();
	// in this example doing it won't make things faster

	// if you are not connected this will connect to the slave before creating the data channel
	slaveCo.createDataChannel('test').then(dc => {
		dc.addEventListener('message', msg => {
			console.log(msg);
		});
		dc.send('What have I wrought!');
	});

	slaveCo.addEventListener('rejected', () => {
		console.log('The slave has rejected the connection :-(');
	});
});

masterCon.addEventListener('slaveremoved', slaveCo => {
	console.log('slave has been removed', slaveCo);
	console.log('here was its id', slaveCo.id);
	console.log('here was its userData', slaveCo.userData);
});
