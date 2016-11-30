import * as convert from './convert.js';

class Serializator {
	constructor(type) {
		this.type = type;
	}
	serialize(userData) {
		let userDataBuf = convert.stringToBuffer(JSON.stringify(userData)),
			view = new Uint8Array(1 + userDataBuf.byteLength);

		view[0] = this.type;
		view.set(new Uint8Array(userDataBuf), 1);

		return view.buffer;
	}
	deserialize(buffer) {
		return JSON.parse(convert.bufferToString(buffer.slice(1)));
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
			let buf = convert.stringToBuffer(JSON.stringify(slave.userData));
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
				userData: JSON.parse(convert.bufferToString(buf.slice(offset + 6, offset + 6 + userDataLength)))
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
		let sdpBuf = convert.stringToBuffer(sdp),
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
			sdp: convert.bufferToString(buf.slice(5))
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
			let sdpMidBuf = convert.stringToBuffer(candidate.sdpMid),
				candidateBuf = convert.stringToBuffer(candidate.candidate),
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
				sdpMid: convert.bufferToString(buf.slice(6, 6 + sdpMidBufLength)),
				sdpMLineIndex: dView.getUint16(6 + sdpMidBufLength),
				candidate: convert.bufferToString(buf.slice(8 + sdpMidBufLength))
			};
		}
	}
}

export let register = new Serializator(0),
	addSlaves = new AddSlavesSerializator(1),
	removeSlaves = new Serializator(2),
	offerToSlave = new SessionDescriptionSerializator(3),
	offerFromClient = new SessionDescriptionSerializator(4),
	answerToClient = new SessionDescriptionSerializator(5),
	answerFromSlave = new SessionDescriptionSerializator(6),
	iceCandidateToSlave = new IceCandidateSerializator(7),
	iceCandidateFromClient = new IceCandidateSerializator(8),
	iceCandidateToClient = new IceCandidateSerializator(9),
	iceCandidateFromSlave = new IceCandidateSerializator(10)
