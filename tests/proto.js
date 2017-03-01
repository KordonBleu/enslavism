import test from 'ava';
import * as proto from '../shared/proto.js';

test('register', t => {
	let userData = {
			qwf: 'This is',
			luu: 'abritrary data',
			lol: true,
			integer: 8988798,
			float: 80.3
		},
		buf = proto.register.serialize(userData),
		res = proto.register.deserialize(buf);

	t.deepEqual(userData, res);

	t.is(proto.getSerializator(buf), proto.register);
});

test('addSlaves', t => {
	let slaves = new Map();
	slaves.set(666, {
		userData: {
			stuff: 'sfharnehsarne',
			more: 432
		}
	});
	slaves.set(42, {
		userData: {
			welp: 'arst',
			more: null,
			less: true
		}
	});

	let buf = proto.addSlaves.serialize(slaves.entries()),
		res = proto.addSlaves.deserialize(buf);

	let slaveIter = slaves.entries();
	for (let [id, slave] of res) {
		let [originalId, originalSlave] = slaveIter.next().value;
		
		t.is(originalId, id);
		t.deepEqual(originalSlave, slave);
	}

	t.is(proto.getSerializator(buf), proto.addSlaves);
});

test('removeSlaves', t => {
	let slaveIds = [12, 367, 666, 42, 9892, 2147483647, 0],
		buf = proto.removeSlaves.serialize(slaveIds),
		res = proto.removeSlaves.deserialize(buf);

	t.deepEqual(slaveIds, res);

	t.is(proto.getSerializator(buf), proto.removeSlaves);
});


let sdp = `v=0
o=mozilla...THIS_IS_SDPARTA-50.0.2 2216985128585860715 0 IN IP4 0.0.0.0
s=-
t=0 0
a=fingerprint:sha-256 D1:56:02:AD:4B:0C:E5:DE:03:DE:66:B9:48:FF:2C:89:99:4C:E7:83:FA:1B:CB:3A:1C:30:FF:A5:3D:20:4F:38
a=ice-options:trickle
a=msid-semantic:WMS *
m=application 9 DTLS/SCTP 5000
c=IN IP4 0.0.0.0
a=sendrecv
a=ice-pwd:31fbcb74d9a82304ed0f09d792140bb7
a=ice-ufrag:6562eea9
a=mid:sdparta_0
a=sctpmap:5000 webrtc-datachannel 256
a=setup:actpass
a=ssrc:2503778014 cname:{b231cbd5-e93d-4501-94b7-f1cc8e87a0b7}`;

test('offerToSlave', t => {
	let id = 2147483647,
		buf = proto.offerToSlave.serialize(id, sdp),
		res = proto.offerToSlave.deserialize(buf);

	t.is(res.id, id);
	t.is(res.sdp, sdp);

	t.is(proto.getSerializator(buf), proto.offerToSlave);
});

test('offerFromClient', t => {
	let id = 0,
		buf = proto.offerFromClient.serialize(id, sdp),
		res = proto.offerFromClient.deserialize(buf);

	t.is(res.id, id);
	t.is(res.sdp, sdp);

	t.is(proto.getSerializator(buf), proto.offerFromClient);
});

test('answerToClient', t => {
	let id = 1,
		buf = proto.answerToClient.serialize(id, sdp),
		res = proto.answerToClient.deserialize(buf);

	t.is(res.id, id);
	t.is(res.sdp, sdp);

	t.is(proto.getSerializator(buf), proto.answerToClient);
});

test('answerFromSlave', t => {
	let id = 67,
		buf = proto.answerFromSlave.serialize(id, sdp),
		res = proto.answerFromSlave.deserialize(buf);

	t.is(res.id, id);
	t.is(res.sdp, sdp);

	t.is(proto.getSerializator(buf), proto.answerFromSlave);
});


let candidate = {
	candidate: 'candidate:0 1 UDP 2122252543 192.168.0.22 52840 typ host',
	sdpMLineIndex: 0,
	sdpMid: 'sdparta_0'
};

test('iceCandidateToSlave', t => {
	let id = 0,
		buf1 = proto.iceCandidateToSlave.serialize(id, candidate),
		res1 = proto.iceCandidateToSlave.deserialize(buf1),
		buf2 = proto.iceCandidateToSlave.serialize(id, null),
		res2 = proto.iceCandidateToSlave.deserialize(buf2);

	t.is(id, res1.id);
	t.is(candidate.candidate, res1.candidate);
	t.is(candidate.sdpMid, res1.sdpMid);
	t.is(candidate.sdpMLineIndex, res1.sdpMLineIndex);

	t.is(id, res2.id);
	t.is(null, res2.candidate);

	t.is(proto.getSerializator(buf1), proto.iceCandidateToSlave);
});

test('iceCandidateFromClient', t => {
	let id = 2147483647,
		buf1 = proto.iceCandidateFromClient.serialize(id, candidate),
		res1 = proto.iceCandidateFromClient.deserialize(buf1),
		buf2 = proto.iceCandidateFromClient.serialize(id, null),
		res2 = proto.iceCandidateFromClient.deserialize(buf2);

	t.is(id, res1.id);
	t.is(candidate.candidate, res1.candidate);
	t.is(candidate.sdpMid, res1.sdpMid);
	t.is(candidate.sdpMLineIndex, res1.sdpMLineIndex);

	t.is(id, res2.id);
	t.is(null, res2.candidate);

	t.is(proto.getSerializator(buf1), proto.iceCandidateFromClient);
});

test('iceCandidateToClient', t => {
	let id = 8789,
		buf1 = proto.iceCandidateToClient.serialize(id, candidate),
		res1 = proto.iceCandidateToClient.deserialize(buf1),
		buf2 = proto.iceCandidateToClient.serialize(id, null),
		res2 = proto.iceCandidateToClient.deserialize(buf2);

	t.is(id, res1.id);
	t.is(candidate.candidate, res1.candidate);
	t.is(candidate.sdpMid, res1.sdpMid);
	t.is(candidate.sdpMLineIndex, res1.sdpMLineIndex);

	t.is(id, res2.id);
	t.is(null, res2.candidate);

	t.is(proto.getSerializator(buf1), proto.iceCandidateToClient);
});

test('iceCandidateFromSlave', t => {
	let id = 123,
		buf1 = proto.iceCandidateFromSlave.serialize(id, candidate),
		res1 = proto.iceCandidateFromSlave.deserialize(buf1),
		buf2 = proto.iceCandidateFromSlave.serialize(id, null),
		res2 = proto.iceCandidateFromSlave.deserialize(buf2);

	t.is(id, res1.id);
	t.is(candidate.candidate, res1.candidate);
	t.is(candidate.sdpMid, res1.sdpMid);
	t.is(candidate.sdpMLineIndex, res1.sdpMLineIndex);

	t.is(id, res2.id);
	t.is(null, res2.candidate);

	t.is(proto.getSerializator(buf1), proto.iceCandidateFromSlave);
});

test('rejectToClient', t => {
	let buf = proto.rejectToClient.serialize(8998),
		res = proto.rejectToClient.deserialize(buf);

	t.is(res, 8998);

	t.is(proto.getSerializator(buf), proto.rejectToClient);
});


test('rejectFromSlave', t => {
	let buf = proto.rejectFromSlave.serialize(100),
		res = proto.rejectFromSlave.deserialize(buf);

	t.is(res, 100);

	t.is(proto.getSerializator(buf), proto.rejectFromSlave);
});
