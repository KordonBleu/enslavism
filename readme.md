# Enslavism

A framework to manage distributed WebRTC servers that communicate with browser clients.

It has been created to be used by [JumpSuit](https://github.com/KordonBleu/jumpsuit). It is generally great for web-based games, but I am sure you will find other uses.

Basically, you have:

* a master server (Node.js)
    * knows all slaves and all clients
    * synchronises the slave list across all clients
* slaves (Node.js)
    * where you handle the business logic of your application (ex: game server)
    * gets WebRTC connction requests from client (that you can reject)
* clients (browser)
    * may request a WebRTC connection to a slave in the slave list


## The point

* transmiting encrypted data without having to register a SSL certificate (unlike secure WebSockets)
* configurable reliability (unreliable is fast!)
* configurable delivery ordering (unordered is fast!)
* an architecture that allows browser clients to choose which independent server to connect to (useful for games)


## Examples

```sh
$ npm install
$ node example/master.js
$ node example/slave.js # in a different terminal
```

Now open your browser at `http://localhost:8081/`.


## Contributing

If you modify server code, you have to run `node bundler.js` to bundle your changes.
If you modify client code, the master takes care of re-bundling for you in development environment. In production (i.e. `$NODE_ENV` is set to `production`) you have to restart the master.


## Browser API

You need to include `/enslavism/client.js` in your HTML document like so:

```HTML
<script src="/enslavism/client.js"></script>
```

### Class: MasterConnection

#### new MasterConnection(masterWsUrl)

```JS
let masterCon = new MasterConnection('ws://localhost:8081');
```

#### masterConnection.slaves

An array of received slaves.

#### Event: 'slave'

* `slaveCo`: SlaveConnection

Triggered when a new slave is received.

```JS
masterCon.addEventListener('slave', slaveCo => { // triggered when a new slave is received
	console.log('new slave', slaveCo);
});
```

### Class: SlaveConnection

#### Event: 'rejected'

Triggered when a slave the client attempted to connect to rejected the connection.

```JS
slaveCo.addEventListener('rejected', () => {
	console.log('The slave has rejected the connection :-(');
});
```

#### slaveConnection.connect()

Connect to a slave.

#### slaveConnection.createDataChannel(dataChannelName)

Create a new data channel. Returns a Promise that resolves with the data channel.
If the `slaveConnection.connect()` has not been run, it will automatically be, but connecting in advance can speed up the process.

```JS
slaveCo.createDataChannel('test').then(dc => {
	dc.addEventListener('message', msg => {
		console.log(msg);
	});
	dc.send('What have I wrought!');
});
```

## Node.js API

### Class: enslavism.Master

#### new enslavism.Master(port | httpServer)

Create an Enslavism master.

```JS
const Master = require('enslavism').Master;

let myMaster = new Master(8080); // creates master listening on port 8080
```

```JS
const Master = require('enslavism').Master,
	http = require('http');

let myServer = http.createServer((req, res) => {
	res.end('Hello world');
});
myServer.listen(8081);

let myMaster = new Master(myServer);
```

### Class: enslavism.Slave

#### new enslavism.Slave(masterWsUrl, userData)

`userData` will be available to all clients.

```JS
let slave = new enslavism.Slave('ws://localhost:8081', {
	name: 'my slave server',
	connectedAmount: 16
});
```

#### Event: 'offer'

* `reject`: Function

Triggered each time a client wants to connect.
If `reject` is called, the connection will be rejected.

```JS
slave.on('offer', reject => {
	if (connectedClientAmount > 10) reject();
});
```

#### Event: 'connection'

* `clientCo`: enslavism.ClientConnection

Triggered each time a client connects.

```JS
slave.on('connection', clientCo => { 
	console.log(clientCo);
});
```

### Class: enslavism.ClientConnection

#### Event: 'datachannel'

* `dc`: DataChannel

Triggered each time a client creates a datachannel.

```JS
clientCo.on('datachannel', dc => {
	console.log('new dataChannel', dc);

	dc.addEventListener('open', ev => { // triggered once the datachannel is open
		console.log('data channel open', ev);
		dc.send('hallo welt');
	});
	dc.addEventListener('message', msg => { // triggered when receiving a message from a client
		console.log(msg);
	});
});
```
