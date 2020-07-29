const merge = require('webpack-merge');
const config = require('./webpack.config.js');

module.exports = (_env, argv) => {
  const port = argv.port || 3001;
  return merge(config, {
    mode: 'development',
    devServer: {
      publicPath: '/dist/',
      proxy: {
        '/extensions': {
          target: `http://localhost:${port}`,
          pathRewrite: { '^/extensions': '/public/extensions' }
        },
        '/assets': {
          target: `http://localhost:${port}`,
          pathRewrite: { '^/assets': '/public/assets' }
        }
      },
      port,
    }
  });
};
