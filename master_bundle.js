'use strict';

function stringToBuffer(string) {
	let buf = new Buffer(string, 'utf8');
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function bufferToString(arrayBuffer) {
	let StringDecoder = require('string_decoder').StringDecoder,
		decoder = new StringDecoder('utf8'),
		tmpBuf = new Buffer(arrayBuffer);
	return decoder.write(tmpBuf);
}

class Serializator {
	constructor(type) {
		this.type = type;
	}
	serialize(userData) {
		let userDataBuf = stringToBuffer(JSON.stringify(userData)),
			view = new Uint8Array(1 + userDataBuf.byteLength);

		view[0] = this.type;
		view.set(new Uint8Array(userDataBuf), 1);

		return view.buffer;
	}
	deserialize(buffer) {
		return JSON.parse(bufferToString(buffer.slice(1)));
	}
}

class AddSlavesSerializator extends Serializator {
	constructor(type) {
		super(type);
	}
	serialize(slaves) {
		let userDataBufs = [],
			userDataBufsLength = 0;

		for (let slave of slaves) {
			let buf = stringToBuffer(JSON.stringify(slave.userData));
			userDataBufsLength += buf.byteLength;
			userDataBufs.push(buf);
		}

		let aView = new Uint8Array(1 + userDataBufsLength + userDataBufs.length*6),
			dView = new DataView(aView.buffer),
			offset = 1;

		dView.setUint8(0, this.type);
		for (let [i, userDataBuf] of userDataBufs.entries()) {
			dView.setUint32(offset, slaves[i].id);
			dView.setUint16(offset + 4, userDataBuf.byteLength);
			aView.set(new Uint8Array(userDataBuf), offset + 6);

			offset += 6 + userDataBuf.byteLength;
		}

		return aView.buffer;
	}
	deserialize(buf) {
		let slaves = [],
			offset = 1,
			dView = new DataView(buf);

		while (offset !== buf.byteLength) {
			let userDataLength = dView.getUint16(offset + 4);
			slaves.push({
				id: dView.getUint32(offset),
				userData: JSON.parse(bufferToString(buf.slice(offset + 6, offset + 6 + userDataLength)))
			});
			offset += 6 + userDataLength;
		}

		return slaves;
	}
}


class RoutableMessageSerializator extends Serializator {
	constructor(type) {
		super(type);
	}
	setDestId(buf, newId) { // used for rerouting for example `offerToSlave` to `offerFromClient` by the master
		let dView = new DataView(buf);
		dView.setUint8(0, this.type);
		dView.setUint32(1, newId);
	}
	getDestId(buf) {
		let dView = new DataView(buf);
		return dView.getUint32(1);
	}
}

class SessionDescriptionSerializator extends RoutableMessageSerializator {
	constructor(type) {
		super(type);
	}
	serialize(id, sdp) {
		let sdpBuf = stringToBuffer(sdp),
			aView = new Uint8Array(5 + sdpBuf.byteLength),
			dView = new DataView(aView.buffer);

		aView[0] = this.type;
		dView.setUint32(1, id);
		aView.set(new Uint8Array(sdpBuf), 5);

		return aView.buffer;
	}
	deserialize(buf) {
		let dView = new DataView(buf);

		return {
			id: dView.getUint32(1),
			sdp: bufferToString(buf.slice(5))
		};
	}
}

class IceCandidateSerializator extends RoutableMessageSerializator {
	constructor(type) {
		super(type);
	}
	serialize(id, candidate) {
		if (candidate === null) {
			let aView = new Uint8Array(6),
				dView = new DataView(aView.buffer);

			aView[0] = this.type;
			dView.setUint32(1, id);
			// sdpMid length (6th byte) is set to 0 indicating a null candidate

			return aView.buffer;
		} else {
			let sdpMidBuf = stringToBuffer(candidate.sdpMid),
				candidateBuf = stringToBuffer(candidate.candidate),
				aView = new Uint8Array(8 + candidateBuf.byteLength + sdpMidBuf.byteLength),
				dView = new DataView(aView.buffer);

			aView[0] = this.type;
			dView.setUint32(1, id);
			aView[5] = sdpMidBuf.byteLength;
			aView.set(new Uint8Array(sdpMidBuf), 6);
			dView.setUint16(6 + sdpMidBuf.byteLength, candidate.sdpMLineIndex);
			aView.set(new Uint8Array(candidateBuf), 8 + sdpMidBuf.byteLength);

			return aView.buffer;
		}
	}
	deserialize(buf) {
		let dView = new DataView(buf),
			sdpMidBufLength = dView.getUint8(5);

		if (sdpMidBufLength === 0) {
			return {
				id: dView.getUint32(1),
				candidate: null
			};
		} else {
			return {
				id: dView.getUint32(1),
				sdpMid: bufferToString(buf.slice(6, 6 + sdpMidBufLength)),
				sdpMLineIndex: dView.getUint16(6 + sdpMidBufLength),
				candidate: bufferToString(buf.slice(8 + sdpMidBufLength))
			};
		}
	}
}

let register = new Serializator(0);
let addSlaves = new AddSlavesSerializator(1);
let removeSlaves = new Serializator(2);
let offerToSlave = new SessionDescriptionSerializator(3);
let offerFromClient = new SessionDescriptionSerializator(4);
let answerToClient = new SessionDescriptionSerializator(5);
let answerFromSlave = new SessionDescriptionSerializator(6);
let iceCandidateToSlave = new IceCandidateSerializator(7);
let iceCandidateFromClient = new IceCandidateSerializator(8);
let iceCandidateToClient = new IceCandidateSerializator(9);
let iceCandidateFromSlave = new IceCandidateSerializator(10);

const http = require('http');
const fs = require('fs');
const WebSocketServer = require('ws').Server;
const rollup = require('rollup');
const alias = require('rollup-plugin-alias');
const MAX_UINT32 = Math.pow(2, 32) - 1;

function generateClientSource() {
	return new Promise((resolve, reject) => {
		rollup.rollup({
			entry: 'client/client.js',
			plugins: [
				alias({
					'<@convert@>': './../client/convert.js'
				})
			]
		}).then(bundle => {
			console.log('bundle generated');
			resolve(bundle.generate({
				format: 'iife',
				moduleName: 'MasterConnection'
			}));
		}).catch(reject);
	});
}

class Master {
	constructor(server) {
		function bufferToArrayBuffer(buf) {
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		}
		if (typeof server === 'number') {
			this._httpServer = http.createServer((req, res) => {
				if (req.url === '/enslavism/client.js') {
					res.writeHead(200, {'Content-Type': 'application/javascript'});
					generateClientSource().then(source => {
						res.end(source.code);
					});
				} else {
					res.writeHead(404);
					res.end('404\nNot found');
				}
			});
			this._httpServer.listen(server);
		} else {
			let userDefReqListeners = server.listeners('request');

			server.removeAllListeners('request');
			server.on('request', (req, res) => {
				if (req.url === '/enslavism/client.js') {
					res.writeHead(200, {'Content-Type': 'application/javascript'});
					generateClientSource().then(source => {
						res.end(source.code);
					});
				} else {
					for (let listener of userDefReqListeners) {
						listener.call(server, req, res);
					}
				}
			});

			this._httpServer = server;
		}


		this._slavesSocket = new WebSocketServer({server: this._httpServer, path: '/enslavism/slaves'});
		this._slavesSocket.currentId = 0;
		this._slavesSocket.wrapMode = false;
		this._clientsSocket = new WebSocketServer({server: this._httpServer, path: '/enslavism/clients'});
		this._clientsSocket.currentId = 0;
		this._clientsSocket.wrapMode = false;

		this._slavesSocket.on('connection', ws => {
			console.log('new slave');
			ws.id = this.giveId(this._slavesSocket);

			ws.on('message', msg => {
				msg = bufferToArrayBuffer(msg);

				switch (new Uint8Array(msg)[0]) {
					case register.type: {
						ws.userData = register.deserialize(msg);
						let newSlaveBuf = addSlaves.serialize([ws]);
						for (let client of this._clientsSocket.clients) {
							client.send(newSlaveBuf);
						}
						break;
					}
					case answerToClient.type: {
						console.log('got an answer from slave');
						let receiver = this.findClient(answerToClient.getDestId(msg));
						if (receiver !== undefined) {
							answerFromSlave.setDestId(msg, ws.id);
							receiver.send(msg);
						}
						break;
					}
					case iceCandidateToClient.type: {
						console.log('got an ice candidate from a slave');
						console.log(iceCandidateToClient.deserialize(msg));
						let receiver = this.findClient(iceCandidateToClient.getDestId(msg));
						if (receiver !== undefined) {
							iceCandidateFromSlave.setDestId(msg, ws.id);
							receiver.send(msg);
						}
						break;
					}

				}
			});
			ws.on('close', () => {
				let removeSlaveBuf = removeSlaves.serialize([ws.id]);
				for (let client of this._clientsSocket.clients) {
					client.send(removeSlaveBuf);
				}
			});
		});

		this._clientsSocket.on('connection', ws => {
			ws.id = this.giveId(this._clientsSocket);

			console.log('client connected');
			ws.send(addSlaves.serialize(this._slavesSocket.clients));

			ws.on('message', msg => {
				msg = bufferToArrayBuffer(msg);

				switch (new Uint8Array(msg)[0]) {
					case offerToSlave.type: {
						console.log('got an offerToSlave from a client');
						let receiver = this.findSlave(offerFromClient.getDestId(msg));
						if (receiver !== undefined) {
							offerFromClient.setDestId(msg, ws.id);
							receiver.send(msg);
						}
						break;
					}
					case iceCandidateToSlave.type: {
						console.log('got an ice candidate from a client');
						console.log(iceCandidateToSlave.deserialize(msg));
						let receiver = this.findSlave(iceCandidateToSlave.getDestId(msg));
						if (receiver !== undefined) {
							iceCandidateFromClient.setDestId(msg, ws.id);
							receiver.send(msg);
						}
						break;
					}
				}
			});
		});
	}
	findSlave(id) { // get slave corresponding to this id
		return this._slavesSocket.clients.find(slave => {
			return slave.id === id;
		});
	}
	findClient(id) { // get client corresponding to this id
		return this._clientsSocket.clients.find(client => {
			return client.id === id;
		});
	}
	giveId(wss) {
		if (wss.currentId > MAX_UINT32) {
			wss.currentId = 0;
			wss.wrapMode = true;
		}
		if (wss.wrapMode) {
			// since the maximum size of an array is 2^32 - 1
			// that means that if the server has be able to add an object to wss.clients, there is at least an id available for it
			while (wss.currentId <= MAX_UINT32 && wss.clients.find((client) => {
				return client.id === wss.currentId;
			}) !== undefined) ++wss.currentId;
		}
		return wss.currentId++;
	}
}

module.exports = Master;
