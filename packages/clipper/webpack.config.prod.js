const { merge } = require('webpack-merge')
const config = require('./webpack.config.js')

module.exports = (env) => {
  return merge(config(env), {
    mode: 'production',
    devtool: 'source-map',
  })
}
