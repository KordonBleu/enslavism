import test from 'ava';
import message from '../message.js';

test('register', t => {
	let userData = {
			qwf: "This is",
			luu: "abritrary data",
			lol: true,
			integer: 8988798,
			float: 80.3
		},
		buf = message.register.serialize(userData),
		res = message.register.deserialize(buf);

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
		buf = message.addSlaves.serialize(slaves),
		res = message.addSlaves.deserialize(buf);

	t.deepEqual(slaves, res);
});
