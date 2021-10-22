const { merge } = require('webpack-merge');
const config = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const WebEnv = {
  platform: 'web',
};

module.exports = (env, argv) => {
  const port = argv.port || 3001;
  return merge(config(Object.assign(env, WebEnv), argv), {
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
