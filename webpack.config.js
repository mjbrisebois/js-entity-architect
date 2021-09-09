const webpack			= require('webpack');
const TerserPlugin		= require("terser-webpack-plugin");

module.exports = {
    target: 'node',
    mode: 'production', // production | development
    entry: [ './src/index.js' ],
    resolve: {
	mainFields: ["main"],
    },
    output: {
	filename: 'entity-architect.bundled.js',
	globalObject: 'this',
	library: {
	    "name": "EntityArchitect",
	    "type": "umd",
	},
    },
    stats: {
	colors: true
    },
    devtool: 'source-map',
    optimization: {
	minimizer: [
	    new TerserPlugin({
		terserOptions: {
		    keep_classnames: true,
		},
	    }),
	],
    },
};
