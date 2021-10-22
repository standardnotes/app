const { merge } = require('webpack-merge');
const config = require('./webpack.config.js');

const WebEnv = {
  platform: 'web',
};

module.exports = (env, argv) => {
  return merge(config(Object.assign(env, WebEnv), argv), {
    mode: 'production',
    devtool: 'source-map',
  });
};
