const merge = require('webpack-merge');
const config = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const port = argv.port || 3001;
  return merge(config(env, argv), {
    mode: 'development',
    /** Only create an html file for the dev-server */
    plugins: argv.liveReload ? [
      new HtmlWebpackPlugin({
        template: './index.html',
        templateParameters: {
          env: process.env
        },
      }),
    ] : [],
    devServer: {
      proxy: {
        '/extensions': {
          target: `http://localhost:${port}`,
          pathRewrite: { '^/extensions': '/public/extensions' }
        },
        '/assets': {
          target: `http://localhost:${port}`,
          pathRewrite: { '^/assets': '/public/assets' }
        },
      },
      port,
    }
  });
};
