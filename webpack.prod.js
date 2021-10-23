const { merge } = require('webpack-merge');
const mergeWithEnvDefaults = require('./webpack-defaults.js');
const config = require('./webpack.config.js');

module.exports = (env, argv) => {
  mergeWithEnvDefaults(env);
  return merge(config(env, argv), {
    mode: 'production',
    devtool: 'source-map',
  });
};
