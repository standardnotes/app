const { merge } = require('webpack-merge')
const config = require('./webpack.config.js')

module.exports = (env, argv) => {
  return merge(config(env, argv), {
    mode: 'development',
    devtool: 'cheap-module-source-map',
  })
}
