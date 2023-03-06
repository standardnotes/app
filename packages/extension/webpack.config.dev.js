const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './src/background/background.js',
  output: {
    filename: './background.js',
  },
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: '../web/dist',
          to: './web',
        },
        { from: './src/manifest.json' },
        {
          from: './src/popup/index.html',
          to: './popup/index.html',
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
  },
}
