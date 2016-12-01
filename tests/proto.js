import test from 'ava';
import * as proto from '../shared/proto.js';

test('register', t => {
	let userData = {
			qwf: "This is",
			luu: "abritrary data",
			lol: true,
			integer: 8988798,
			float: 80.3
		},
		buf = proto.register.serialize(userData),
		res = proto.register.deserialize(buf);

	t.deepEqual(userData, res);
});

test('addSlaves', t => {
	let slaves = [
			{
				id: 666,
				userData: {
					stuff: "sfharnehsarne",
					more: 432
				}
			},
			{
				id: 42,
				userData: {
					welp: "arst",
					more: null,
					less: true
				}
			}
		],
		buf = proto.addSlaves.serialize(slaves),
		res = proto.addSlaves.deserialize(buf);

	t.deepEqual(slaves, res);
});
