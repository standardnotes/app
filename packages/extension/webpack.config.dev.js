const { merge } = require('webpack-merge')
const config = require('./webpack.config.js')

module.exports = () => {
  return merge(config, {
    mode: 'development',
    devtool: 'inline-source-map',
  })
}
