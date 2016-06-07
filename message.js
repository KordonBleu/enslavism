'use strict';

const ipaddr = require('ipaddr.js');

const isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

function stringToBuffer(string) {
	if (isNode) {
		let buf = new Buffer(string, 'utf8');
		return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	} else {
		let encoder = new TextEncoder('utf8');
		return encoder.encode(string);
	}
}
function bufferToString(arrayBuffer) {
	if (isNode) {
		let StringDecoder = require('string_decoder').StringDecoder,
			decoder = new StringDecoder('utf8'),
			tmpBuf = new Buffer(arrayBuffer);
		return decoder.write(tmpBuf);
	} else {
		let decoder = new TextDecoder('utf8');
		return decoder.decode(arrayBuffer);
	}
}

// the protocol is binary BUT is JSON-based
// however the user will free to override it at some point
class Serializator {
	constructor(type) {
		this.type = type;
	}
	serialize(userData) {
		let view = new Uint8Array(1 + userData.byteLength);
		view[0] = this.type;
		view.set(new Uint8Array(stringToBuffer(JSON.stringify(userData))), 1);

		return view.buffer;
	}
	deserialize(buffer) {
		return JSON.parse(bufferToString(buffer.slice(1)));
	}
}

module.exports = {
	register: new Serializator(0),
	addSlaves: new Serializator(1),
	removeSlaves: new Serializator(2),
};
