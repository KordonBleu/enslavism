const isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

const message = (() => {
	'use strict';

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

	let addSlavesSerializator = new Serializator(1);
	addSlavesSerializator.serialize = function(slaves) { // fat arrow functions do not bind `this` to  `addSlavesSerializator`
		let userDataBufs = [],
			userDataBufsLength = 0;

		slaves.forEach(slave => {
			let buf = stringToBuffer(JSON.stringify(slave.slaveUserData));
			userDataBufsLength += buf.byteLength;
			userDataBufs.push(buf);
		});

		let aView = new Uint8Array(1 + userDataBufsLength + userDataBufs.length*6),
			dView = new DataView(aView.buffer),
			offset = 1;

		dView.setUint8(0, this.type);
		userDataBufs.forEach((userDataBuf, i) => {
			dView.setUint32(offset, slaves[i].slaveId);
			dView.setUint16(offset + 4, userDataBuf.byteLength);
			aView.set(new Uint8Array(userDataBuf), offset + 6);

			offset += 6 + userDataBuf.length;
		});

		return aView.buffer;
	}
	addSlavesSerializator.deserialize = function(buf) {
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
	};

	class SessionDescriptionSerializator extends Serializator {
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

	return {
		register: new Serializator(0),
		addSlaves: addSlavesSerializator,
		removeSlaves: new Serializator(2),
		offerToSlave: new SessionDescriptionSerializator(3),
		offerFromClient: new SessionDescriptionSerializator(4),
		answerToClient: new SessionDescriptionSerializator(5),
		answerFromSlave: new SessionDescriptionSerializator(6),
		iceCandidate: new SessionDescriptionSerializator(7)
	};
})();

if (isNode) {
	module.exports = message;
}
