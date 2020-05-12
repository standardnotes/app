const merge = require('webpack-merge');
const config = require('./webpack.config.js');

module.exports = merge(config, {
  mode: 'development',
  devServer: {
    publicPath: '/dist/',
    proxy: {
      '/extensions': {
        target: 'http://localhost:3001',
        pathRewrite: { '^/extensions': '/public/extensions' }
      }
    },
    port: 3001
  }
});
