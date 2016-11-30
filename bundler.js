const rollup = require('rollup'),
	alias = require('rollup-plugin-alias');

rollup.rollup({
	entry: 'server/index.js',
	plugins: [
		alias({
			'<@convert@>': 'server/convert.js'
		})
	]
}).then(bundle => {
	console.log('bundle generated');
	bundle.write({
		format: 'cjs',
		dest: 'bundle.js'
	});
});
