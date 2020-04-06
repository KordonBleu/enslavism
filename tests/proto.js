import test from 'ava';
import * as proto from '../shared/proto.js';

test('register', (t) => {
	const userData = {
		qwf: 'This is',
		luu: 'abritrary data',
		lol: true,
		integer: 8988798,
		float: 80.3,
	};
	const buf = proto.register.serialize(userData);
	const res = proto.register.deserialize(buf);

	t.deepEqual(userData, res);

	t.is(proto.getSerializator(buf), proto.register);
});

test('addSlaves', (t) => {
	const slaves = new Map();
	slaves.set(666, {
		userData: {
			stuff: 'sfharnehsarne',
			more: 432,
		},
	});
	slaves.set(42, {
		userData: {
			welp: 'arst',
			more: null,
			less: true,
		},
	});

	const buf = proto.addSlaves.serialize(slaves.entries());
	const res = proto.addSlaves.deserialize(buf);

	const slaveIter = slaves.entries();
	for (const [id, slave] of res) {
		const [originalId, originalSlave] = slaveIter.next().value;

		t.is(originalId, id);
		t.deepEqual(originalSlave, slave);
	}

	t.is(proto.getSerializator(buf), proto.addSlaves);
});

test('removeSlaves', (t) => {
	const slaveIds = [12, 367, 666, 42, 9892, 2147483647, 0];
	const buf = proto.removeSlaves.serialize(slaveIds);
	const res = proto.removeSlaves.deserialize(buf);

	t.deepEqual(slaveIds, res);

	t.is(proto.getSerializator(buf), proto.removeSlaves);
});


const sdp = `v=0
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

test('offerToSlave', (t) => {
	const id = 2147483647;
	const buf = proto.offerToSlave.serialize(id, sdp);
	const res = proto.offerToSlave.deserialize(buf);

	t.is(res.id, id);
	t.is(res.sdp, sdp);

	t.is(proto.getSerializator(buf), proto.offerToSlave);
});

test('offerFromClient', (t) => {
	const id = 0;
	const buf = proto.offerFromClient.serialize(id, sdp);
	const res = proto.offerFromClient.deserialize(buf);

	t.is(res.id, id);
	t.is(res.sdp, sdp);

	t.is(proto.getSerializator(buf), proto.offerFromClient);
});

test('answerToClient', (t) => {
	const id = 1;
	const buf = proto.answerToClient.serialize(id, sdp);
	const res = proto.answerToClient.deserialize(buf);

	t.is(res.id, id);
	t.is(res.sdp, sdp);

	t.is(proto.getSerializator(buf), proto.answerToClient);
});

test('answerFromSlave', (t) => {
	const id = 67;
	const buf = proto.answerFromSlave.serialize(id, sdp);
	const res = proto.answerFromSlave.deserialize(buf);

	t.is(res.id, id);
	t.is(res.sdp, sdp);

	t.is(proto.getSerializator(buf), proto.answerFromSlave);
});


const candidate = {
	candidate: 'candidate:0 1 UDP 2122252543 192.168.0.22 52840 typ host',
	sdpMLineIndex: 0,
	sdpMid: 'sdparta_0',
};

test('iceCandidateToSlave', (t) => {
	const id = 0;
	const buf1 = proto.iceCandidateToSlave.serialize(id, candidate);
	const res1 = proto.iceCandidateToSlave.deserialize(buf1);
	const buf2 = proto.iceCandidateToSlave.serialize(id, null);
	const res2 = proto.iceCandidateToSlave.deserialize(buf2);

	t.is(id, res1.id);
	t.is(candidate.candidate, res1.candidate);
	t.is(candidate.sdpMid, res1.sdpMid);
	t.is(candidate.sdpMLineIndex, res1.sdpMLineIndex);

	t.is(id, res2.id);
	t.is(null, res2.candidate);

	t.is(proto.getSerializator(buf1), proto.iceCandidateToSlave);
});

test('iceCandidateFromClient', (t) => {
	const id = 2147483647;
	const buf1 = proto.iceCandidateFromClient.serialize(id, candidate);
	const res1 = proto.iceCandidateFromClient.deserialize(buf1);
	const buf2 = proto.iceCandidateFromClient.serialize(id, null);
	const res2 = proto.iceCandidateFromClient.deserialize(buf2);

	t.is(id, res1.id);
	t.is(candidate.candidate, res1.candidate);
	t.is(candidate.sdpMid, res1.sdpMid);
	t.is(candidate.sdpMLineIndex, res1.sdpMLineIndex);

	t.is(id, res2.id);
	t.is(null, res2.candidate);

	t.is(proto.getSerializator(buf1), proto.iceCandidateFromClient);
});

test('iceCandidateToClient', (t) => {
	const id = 8789;
	const buf1 = proto.iceCandidateToClient.serialize(id, candidate);
	const res1 = proto.iceCandidateToClient.deserialize(buf1);
	const buf2 = proto.iceCandidateToClient.serialize(id, null);
	const res2 = proto.iceCandidateToClient.deserialize(buf2);

	t.is(id, res1.id);
	t.is(candidate.candidate, res1.candidate);
	t.is(candidate.sdpMid, res1.sdpMid);
	t.is(candidate.sdpMLineIndex, res1.sdpMLineIndex);

	t.is(id, res2.id);
	t.is(null, res2.candidate);

	t.is(proto.getSerializator(buf1), proto.iceCandidateToClient);
});

test('iceCandidateFromSlave', (t) => {
	const id = 123;
	const buf1 = proto.iceCandidateFromSlave.serialize(id, candidate);
	const res1 = proto.iceCandidateFromSlave.deserialize(buf1);
	const buf2 = proto.iceCandidateFromSlave.serialize(id, null);
	const res2 = proto.iceCandidateFromSlave.deserialize(buf2);

	t.is(id, res1.id);
	t.is(candidate.candidate, res1.candidate);
	t.is(candidate.sdpMid, res1.sdpMid);
	t.is(candidate.sdpMLineIndex, res1.sdpMLineIndex);

	t.is(id, res2.id);
	t.is(null, res2.candidate);

	t.is(proto.getSerializator(buf1), proto.iceCandidateFromSlave);
});

test('rejectToClient', (t) => {
	const buf = proto.rejectToClient.serialize(8998);
	const res = proto.rejectToClient.deserialize(buf);

	t.is(res, 8998);

	t.is(proto.getSerializator(buf), proto.rejectToClient);
});


test('rejectFromSlave', (t) => {
	const buf = proto.rejectFromSlave.serialize(100);
	const res = proto.rejectFromSlave.deserialize(buf);

	t.is(res, 100);

	t.is(proto.getSerializator(buf), proto.rejectFromSlave);
});
