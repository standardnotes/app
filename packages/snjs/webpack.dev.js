const { merge } = require('webpack-merge')
const config = require('./webpack.config.js')
const webpack = require('webpack')

module.exports = merge(config, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  stats: {
    colors: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      __IS_DEV__: true,
    }),
  ],
})
