const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './src/background/background.js',
  output: {
    filename: './background.js',
  },
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
        {
          from: './images',
          to: './images',
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
}
