import alias from '@rollup/plugin-alias';

export default [
	{
		input: 'server/index.js',
		output: {
			file: 'dist/server.bundle.js',
			format: 'cjs',
		},
		plugins: [
			alias({
				entries: {
					'<@convert@>': 'server/convert.js',
				},
			}),
		],
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
				entries: {
					'<@convert@>': './../client/convert.js',
				},
			}),
		],
	},
];
