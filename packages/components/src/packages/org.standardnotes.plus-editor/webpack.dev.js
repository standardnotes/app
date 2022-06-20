const { merge } = require('webpack-merge');
const config = require('./webpack.config.js');
const path = require('path');

module.exports = merge(config, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  stats: {
    colors: true
  },
  devServer: {
    port: 8001,
    contentBase: path.resolve(__dirname, 'dist'),
    disableHostCheck: true,
    historyApiFallback: true,
    watchOptions: { aggregateTimeout: 300, poll: 1000 },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  }
});
