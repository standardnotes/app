const { merge } = require('webpack-merge');
const config = require('./webpack.config.js');

module.exports = merge(config, {
  mode: 'development',
  watch: true,
  devtool: 'eval-cheap-module-source-map',
  stats: {
    colors: true
  }
});
