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

let addSlavesSerializator = new Serializator(1);
addSlavesSerializator.serialize = slaves => {
	let userDataBufs = [],
		userDataBufsLength = 0;

	slaves.forEach(slave => {
		let buf = stringToBuffer(JSON.stringify(slave.slaveUserData));
		userDataBufsLength += buf.byteLength;
		userDataBuf.push(buf);
	});

	let aView = new Uint8Array(1 + userDataBufsLength + userDataBufs.length*6),
		dView = new DataView(aView.buffer),
		offset = 1;

	dView.setUint8(0, this.type);
	userDataBufs.forEach((userDataBuf, i) => {
		dView.setUint32(offset, slaves[i].slaveId);
		dView.setUint16(offset + 4, userDataBuf.byteLength);
		aView.set(new Uint8Array(userDataBuf), 6);

		offset += 6 + userDataBuf.length;
	});
}
addSlavesSerializator.deserialize = buf => {
	let slaves = [],
		offset = 1,
		dView = new DataView(buf);

	while (offset !== buf.byteLength) {
		slaves.push({
			id: dView.getUint32(offset),
			userData: bufferToString(buf.splice(offset + 6, offset + 6 + dView.getUint16(offset + 4)))
		});
	}
};

module.exports = {
	register: new Serializator(0),
	addSlaves: addSlavesSerializator,
	removeSlaves: new Serializator(2),
};
