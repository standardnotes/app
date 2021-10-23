const { merge } = require('webpack-merge');
const config = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const mergeWithEnvDefaults = require('./webpack-defaults.js');

module.exports = (env, argv) => {
  const port = argv.port || 3001;
  mergeWithEnvDefaults(env);
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
    ],
    devServer: {
      hot: 'only',
      static: './',
      port,
      devMiddleware: {
        writeToDisk: argv.writeToDisk,
      },
    },
  });
};
