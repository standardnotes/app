const { merge } = require('webpack-merge')
const config = require('./web.webpack.config.js')
const mergeWithEnvDefaults = require('./web.webpack-defaults.js')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = (env, argv) => {
  const port = argv.port || 3001
  mergeWithEnvDefaults(env)
  return merge(config(env, argv), {
    mode: 'development',
    devtool: process.env.BUILD_TARGET === 'extension' ? 'cheap-module-source-map' : 'inline-source-map',
    optimization: {
      minimize: false,
    },
    output: {
      publicPath: '/',
    },
    plugins: [new ReactRefreshWebpackPlugin()],
    devServer: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Security-Policy':
          "default-src https: 'self'; base-uri 'self'; child-src * blob:; connect-src * blob:; font-src * data:; form-action 'self'; frame-ancestors * file:; frame-src * blob:; img-src 'self' * data: blob:; manifest-src 'self'; media-src 'self' blob: *.standardnotes.com; object-src 'self' blob: *.standardnotes.com; script-src 'self' 'sha256-r26E+iPOhx7KM7cKn4trOSoD8u5E7wL7wwJ8UrR+rGs=' 'unsafe-eval' 'wasm-unsafe-eval'; style-src *;",
      },
      hot: true,
      static: './dist',
      port,
      historyApiFallback: true,
      devMiddleware: {
        writeToDisk: argv.writeToDisk,
      },
    },
  })
}
