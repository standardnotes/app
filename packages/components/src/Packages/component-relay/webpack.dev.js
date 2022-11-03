const { merge } = require('webpack-merge');
const config = require('./webpack.config.js');

module.exports = merge(config, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  stats: {
    colors: true
  }
});
