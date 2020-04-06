import * as convert from '<@convert@>';

const serializators = [];

class Serializator {
	constructor(type) {
		this.type = type;
		serializators[type] = this;
	}
}

class JsonSerializator extends Serializator {
	constructor(type) {
		super(type);
	}
	serialize(userData) {
		const userDataBuf = convert.stringToBuffer(JSON.stringify(userData));
		const view = new Uint8Array(1 + userDataBuf.byteLength);

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
	serialize(slaveIter) {
		let userDataBufsLength = 0;
		const userDataBufs = new Map();

		for (const [id, slave] of slaveIter) {
			const buf = convert.stringToBuffer(JSON.stringify(slave.userData));
			userDataBufsLength += buf.byteLength;
			userDataBufs.set(id, buf);
		}

		const aView = new Uint8Array(1 + userDataBufsLength + userDataBufs.size*6);
		const dView = new DataView(aView.buffer);
		let offset = 1;

		dView.setUint8(0, this.type);

		for (const [id, userDataBuf] of userDataBufs.entries()) {
			dView.setUint32(offset, id);
			dView.setUint16(offset + 4, userDataBuf.byteLength);
			aView.set(new Uint8Array(userDataBuf), offset + 6);

			offset += 6 + userDataBuf.byteLength;
		}

		return aView.buffer;
	}
	* deserialize(buf) {
		let offset = 1;
		const dView = new DataView(buf);

		while (offset !== buf.byteLength) {
			const userDataLength = dView.getUint16(offset + 4);
			yield [
				dView.getUint32(offset), // id
				{ // slave
					userData: JSON.parse(convert.bufferToString(buf.slice(offset + 6, offset + 6 + userDataLength))),
				},
			];
			offset += 6 + userDataLength;
		}
	}
}


class RoutableMessageSerializator extends Serializator {
	constructor(type) {
		super(type);
	}
	setDestId(buf, newId) { // used for rerouting for example `offerToSlave` to `offerFromClient` by the master
		const dView = new DataView(buf);
		dView.setUint8(0, this.type);
		dView.setUint32(1, newId);
	}
	getDestId(buf) {
		const dView = new DataView(buf);
		return dView.getUint32(1);
	}
}

class SessionDescriptionSerializator extends RoutableMessageSerializator {
	constructor(type) {
		super(type);
	}
	serialize(id, sdp) {
		const sdpBuf = convert.stringToBuffer(sdp);
		const aView = new Uint8Array(5 + sdpBuf.byteLength);
		const dView = new DataView(aView.buffer);

		aView[0] = this.type;
		dView.setUint32(1, id);
		aView.set(new Uint8Array(sdpBuf), 5);

		return aView.buffer;
	}
	deserialize(buf) {
		const dView = new DataView(buf);

		return {
			id: dView.getUint32(1),
			sdp: convert.bufferToString(buf.slice(5)),
		};
	}
}

class IceCandidateSerializator extends RoutableMessageSerializator {
	constructor(type) {
		super(type);
	}
	serialize(id, candidate) {
		if (candidate === null) {
			const aView = new Uint8Array(6);
			const dView = new DataView(aView.buffer);

			aView[0] = this.type;
			dView.setUint32(1, id);
			// sdpMid length (6th byte) is set to 0 indicating a null candidate

			return aView.buffer;
		} else {
			const sdpMidBuf = convert.stringToBuffer(candidate.sdpMid);
			const candidateBuf = convert.stringToBuffer(candidate.candidate);
			const aView = new Uint8Array(8 + candidateBuf.byteLength + sdpMidBuf.byteLength);
			const dView = new DataView(aView.buffer);

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
		const dView = new DataView(buf);
		const sdpMidBufLength = dView.getUint8(5);

		if (sdpMidBufLength === 0) {
			return {
				id: dView.getUint32(1),
				candidate: null,
			};
		} else {
			return {
				id: dView.getUint32(1),
				sdpMid: convert.bufferToString(buf.slice(6, 6 + sdpMidBufLength)),
				sdpMLineIndex: dView.getUint16(6 + sdpMidBufLength),
				candidate: convert.bufferToString(buf.slice(8 + sdpMidBufLength)),
			};
		}
	}
}

class RejectionSerializator extends Serializator {
	constructor(type) {
		super(type);
	}
	serialize(id) {
		const buf = new ArrayBuffer(5);
		const dView = new DataView(buf);

		dView.setUint8(0, this.type);
		dView.setUint32(1, id);

		return buf;
	}
	deserialize(buf) {
		const dView = new DataView(buf);

		return dView.getUint32(1);
	}
}

export const register = new JsonSerializator(0);
export const addSlaves = new AddSlavesSerializator(1);
export const removeSlaves = new JsonSerializator(2);
export const offerToSlave = new SessionDescriptionSerializator(3);
export const offerFromClient = new SessionDescriptionSerializator(4);
export const answerToClient = new SessionDescriptionSerializator(5);
export const answerFromSlave = new SessionDescriptionSerializator(6);
export const iceCandidateToSlave = new IceCandidateSerializator(7);
export const iceCandidateFromClient = new IceCandidateSerializator(8);
export const iceCandidateToClient = new IceCandidateSerializator(9);
export const iceCandidateFromSlave = new IceCandidateSerializator(10);
export const rejectToClient = new RejectionSerializator(11);
export const rejectFromSlave = new RejectionSerializator(12);

export function getSerializator(buffer) {
	const enumVal = new Uint8Array(buffer)[0];

	return serializators[enumVal];
}
