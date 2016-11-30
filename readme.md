# Enslavism

A framework to manage distributed WebRTC servers that communicate with browser clients.

It has been created to be used by [JumpSuit](https://github.com/KordonBleu/jumpsuit). It is generally great for web-based games, but I am sure you will find other uses.

Basically, you have:

* **a** master server (Node.js)
    * knows all slaves and all clients
    * synchronises the slave list across all clients
* slaves (Node.js)
    * where you handle the business logic of your application (ex: game server)
    * you may accept WebRTC connections from clients
* clients (browser)
    * you may request a WebRTC connection to a slave in the slave list


## The point

* transmiting encrypted data without having to register a SSL certificate (unlike secure WebSockets)
* configurable reliability (unreliable is fast!)
* configurable delivery ordering (unordered is fast!)
* an architecture that allows browser clients to choose which independent server to connect to (useful for games)

## API

## Client

You need to include `/enslavism/client.js` in your HTML document like so:

```HTML
<script src="/enslavism/client.js"></script>
```

Then you can create a connection to a master server:

```JavaScript
let masterCon = new MasterConnection('ws://localhost:8081');
```

```JavaScript
masterCon.onSlave = slave => { // triggered when a new slave is received
	console.log('new slave', slave);
	slave.connect(); // it is possible to connect to a slave
	slave.createDataChannel('test') // do NOT creat datachannels if not connected!
	.then(dc => {
		dc.addEventListener('message', msg => {
			console.log(msg);
		});
		dc.send('What have I wrought!');
	});
};
```

### Master

You can create a master, specifying on which port you want it to run:

```JavaScript
const Master = require('enslavism').Master;

let myMaster = new Master(8080); // creates master listening on port 8080
```

Or you can force it to use an existing `http.Server`:

```JavaScript
const Master = require('enslavism').Master,
	http = require('http');

let myServer = http.createServer((req, res) => {
	res.end('Hello world');
});
myServer.listen(8081);

let myMaster = new Master(myServer);
```

### Slave

#### Creation

```JavaScript
let slave = new enslavism.Slave('ws://localhost:8081', { // address of the master
	name: 'my slave server', // this data will be available to all clients
	connectedAmount: 16
});
```

#### Events

```
slave.on('newclco', clCo => { // triggered each time a client connects
	clCo.on('newdc', dc => { // triggered each time a client creates a datachannel
		console.log('new dataChannel');
		dc.addEventListener('open', (ev) => { // triggered once the datachannel is open
			console.log('data channel open', ev);
			dc.send('hallo welt');
		});
		dc.addEventListener('message', msg => { // triggered when receiving a message from a client
			console.log(msg);
		});
	});
});
```


## Try the example!

```sh
$ npm install
$ node example/master.js
$ node example/slave.js # in a different terminal
```

Now open your browser at `http://localhost:8081/`.


If you modify server code, you have to run `node bundler.js` to bundle your changes.
If you modify client code, the master takes care of re-bundling for you in development environment. In production (i.e. `$NODE_ENV` is set to `production`) you have to restart the master.
