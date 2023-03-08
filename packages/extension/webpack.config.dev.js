const { merge } = require('webpack-merge')
const config = require('./webpack.config.js')

module.exports = () => {
  return merge(config, {
    mode: 'development',
    devtool: 'cheap-module-source-map',
  })
}
