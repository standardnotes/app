const { merge } = require('webpack-merge')
const mergeWithEnvDefaults = require('./web.webpack-defaults.js')
const config = require('./web.webpack.config.js')

module.exports = (env, argv) => {
  mergeWithEnvDefaults(env)
  return merge(config(env, argv), {
    mode: 'production',
    devtool: 'source-map',
  })
}
