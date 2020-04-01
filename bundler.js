const rollup = require('rollup'),
	alias = require('rollup-plugin-alias'),
	eslint = require('rollup-plugin-eslint');

rollup.rollup({
	input: 'server/index.js',
	plugins: [
		alias({
			'<@convert@>': 'server/convert.js'
		}),
		eslint()
	]
}).then(bundle => {
	bundle.write({
		format: 'cjs',
		file: 'bundle.js',
	});
	console.log('Enslavism bundle generated');
});
