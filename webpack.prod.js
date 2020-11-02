const merge = require('webpack-merge');
const config = require('./webpack.config.js');

module.exports = (env, argv) => merge(config(env, argv), {
  mode: 'production',
  devtool: 'source-map',
});
