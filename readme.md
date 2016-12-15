# Enslavism

[![npm version](https://badge.fury.io/js/enslavism.svg)](https://www.npmjs.com/package/enslavism)

A framework to manage distributed WebRTC servers that communicate with browser clients.

It has been created to be used by [JumpSuit](https://github.com/KordonBleu/jumpsuit). It is generally great for web-based games, but I am sure you will find other uses.

Basically, you have:

* a master server (Node.js)
    * knows all slaves and all clients
    * synchronises the slave list across all clients
* slaves (Node.js)
    * where you handle the business logic of your application (ex: game server)
    * gets WebRTC connection requests from client
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

```html
<script src="/enslavism/client.js"></script>
```

### Class: MasterConnection

#### new MasterConnection(masterWsUrl)

```javascript
let masterCon = new MasterConnection('ws://localhost:8081');
```

#### masterConnection.slaves

An array of received slaves.

#### Event: 'slaveadded'

* `slaveCo`: SlaveConnection

Triggered when a new slave is received. The slave will be available in the [slave list](#masterconnectionslaves).

```javascript
masterCon.addEventListener('slaveadded', slaveCo => {
	console.log('new slave', slaveCo);
});
```

#### Event: 'slaveremoved'

* `slaveCo`: SlaveConnection

Triggered when a slave is removed from the slave list. Calling any of `slaveCo`'s methods won't work.

```javascript
masterCon.addEventListener('slaveremoved', slaveCo => {
	console.log('slave has been removed', slaveCo);
	console.log('here was its id', slaveCo.id);
	console.log('here was its userData', slaveCo.userData);
});
```

### Class: SlaveConnection

#### Event: 'rejected'

Triggered when a slave the client attempted to connect to rejected the connection.

```javascript
slaveCo.addEventListener('rejected', () => {
	console.log('The slave has rejected the connection :-(');
});
```

#### slaveConnection.connect()

Connect to a slave.

#### slaveConnection.createDataChannel(dataChannelName, [dcOptions])

Create a new data channel. Returns a Promise that resolves with the data channel.
Will connect the client if it isn't yet. As connecting takes time, if you are able to anticipate a connection but not which data channel to open, you can call [`slaveConnection.connect()`](#slaveconnectionconnect) before.

```javascript
slaveCo.createDataChannel('test').then(dc => {
	dc.addEventListener('message', msg => {
		console.log(msg);
	});
	dc.send('What have I wrought!');
});
```

`dcOptions` is an `Object` which can contain the [following properties](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel#RTCDataChannelInit_dictionary).
The `ordered` property is known to work. You might want to check out [this upstream issue](https://github.com/js-platform/node-webrtc/issues/273) regarding the other properties.

## Node.js API

### Class: enslavism.Master

#### new enslavism.Master(port | httpServer)

Create an Enslavism master.

```javascript
const Master = require('enslavism').Master;

let myMaster = new Master(8080); // creates master listening on port 8080
```

```javascript
const Master = require('enslavism').Master,
	http = require('http');

let myServer = http.createServer((req, res) => {
	res.end('Hello world');
});
myServer.listen(8081);

let myMaster = new Master(myServer);
```

#### Event: 'slaveauth'

* `authData`: Object
* `reject`: Function

Triggered when a slave wants to connect.
By default, the connection is accepted. If `reject` is called, the connection will be rejected. `reject` accepts a string as an optional argument which is the reason the connection was rejected.

`authData` is the data provided in the [slave constructor](#new-enslavismslavemasterwsurl-userdata-authdata).

```javascript
myMaster.on('slaveauth', (authData, reject) => {
	if (authData.username !== 'getkey' || authData.password !== 'secret') reject('Invalid credentials!');
});
```

#### Event: 'clientauth'

* `authData`: Object
* `reject`: Function

Triggered when a client wants to connect.
By default, the connection is accepted. If `reject` is called, the connection will be rejected. `reject` accepts a string as an optional argument which is the reason the connection was rejected.

`authData` is an object containing the cookies set by the client.

```javascript
myServer.on('clientauth', (authData, reject) => {
	if (authData.username !== undefined) console.log(authData.username + " wants to connect!");
});
```


#### Event: 'error'

* `err`: Error

Triggered when an error occurs on the underlying server.

```javascript
myServer.on('error', err => {
	console.log(err);
});
```


### Class: enslavism.Slave

#### new enslavism.Slave(masterWsUrl, userData, [authData])

Returns a **promise** that resolves with an [`enslavism.Slave`](#class-enslavismslave).

`userData` will be available to all clients and can contain any JavaScript value.
The optional argument `authData` in an object containing strings. It may be used to [authenticate slaves](#event-slaveauth).

```javascript
new enslavism.Slave('ws://localhost:8081', {
	name: 'my slave server',
	connectedAmount: 16
}).then(slave => {
	console.log('Succesfully connected to the master:', slave);
}).catch(err => {
	console.log('Couldn\'t connect to the master:', err);
});
```

#### Event: 'offer'

* `reject`: Function

Triggered each time a client wants to connect.
If `reject` is called, the connection will be rejected.

```javascript
slave.on('offer', reject => {
	if (connectedClientAmount > 10) reject();
});
```

#### Event: 'connection'

* `clientCo`: enslavism.ClientConnection

Triggered each time a client connects.

```javascript
slave.on('connection', clientCo => { 
	console.log(clientCo);
});
```

### Class: enslavism.ClientConnection

#### Event: 'datachannel'

* `dc`: DataChannel

Triggered each time a client creates a datachannel.

```javascript
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
