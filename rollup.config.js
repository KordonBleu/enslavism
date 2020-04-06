import alias from 'rollup-plugin-alias';
import eslint from 'rollup-plugin-eslint';

export default [
	{
		input: 'server/index.js',
		output: {
			file: 'dist/server.bundle.js',
			format: 'cjs'
		},
		plugins: [
			alias({
				'<@convert@>': 'server/convert.js'
			}),
			eslint()
		]
	},
	{
		input: 'client/master_connection.js',
		output: {
			file: 'dist/client.bundle.js',
			format: 'iife',
			name: 'MasterConnection',
		},
		plugins: [
			alias({
				'<@convert@>': './../client/convert.js'
			}),
			eslint(),
		]
	},
];
