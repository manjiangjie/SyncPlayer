var path = require('path');
var nodeExternals = require('webpack-node-externals');
var webpack = require("webpack");


function createConfig(isDebug) {
	const plugins = [];

	if (!isDebug) {
		plugins.push(new webpack.optimize.UglifyJsPlugin());
	}
	//WEBPACK Config
	return {
		target: "node",
		devtool: "source-map",
		entry: './src/server/server.js',
		output: {
			path: path.join(__dirname, 'build'),
			filename: 'server.js'
		},
		resolve: {
			alias: {
				shared: path.resolve(__dirname, 'src/shared')
			}
		},
		module: {
			rules: [
				{
					enforce: "pre",
					test: /\.js$/,
					exclude: /node_modules/,
					loader: "eslint-loader",
				},
				{
					test: /\.js$/,
					exclude: /node_modules/,
					loader: "babel-loader",
				},
			],
		},
		externals: [nodeExternals()],
		plugins: plugins
	};
}

module.exports = createConfig;