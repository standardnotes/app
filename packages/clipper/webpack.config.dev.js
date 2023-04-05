const { merge } = require('webpack-merge')
const config = require('./webpack.config.js')

module.exports = (env) => {
  return merge(config(env), {
    mode: 'development',
    devtool: 'cheap-module-source-map',
  })
}
