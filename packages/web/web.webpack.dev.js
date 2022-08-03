const { merge } = require('webpack-merge')
const config = require('./web.webpack.config.js')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const mergeWithEnvDefaults = require('./web.webpack-defaults.js')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = (env, argv) => {
  const port = argv.port || 3001
  mergeWithEnvDefaults(env)
  return merge(config(env, argv), {
    mode: 'development',
    optimization: {
      minimize: false,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: true,
        templateParameters: {
          env: process.env,
        },
      }),
      new ReactRefreshWebpackPlugin(),
    ],
    devServer: {
      hot: true,
      static: './dist',
      port,
      devMiddleware: {
        writeToDisk: argv.writeToDisk,
      },
    },
  })
}
