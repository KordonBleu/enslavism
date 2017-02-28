/*
To drop 10% of packets (as root):
iptables -A OUTPUT -m statistic --mode random --probability 0.1 -j DROP

That should be enough to make packet come unordered.

To revert the command (as root):
iptables -D OUTPUT -m statistic --mode random --probability 0.1 -j DROP
*/

document.cookie = 'username=getkey';

let masterCon = new MasterConnection('ws://localhost:8081');

masterCon.addEventListener('slaveadded', slaveCo => {
	console.log('new slave', slaveCo);

	slaveCo.createDataChannel('test', {
		ordered: false
	}).then(dc => {
		dc.addEventListener('message', msg => {
			console.log(msg);
		});
		for (let i = 1; i != 100; ++i) dc.send('Orderedness test #' + i);
	});

	slaveCo.addEventListener('rejected', () => {
		console.log('The slave has rejected the connection :-(');
	});
});
