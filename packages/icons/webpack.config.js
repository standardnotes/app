const path = require('path')

module.exports = (_, { mode }) => ({
  entry: path.resolve(__dirname, 'src/Icons/index.ts'),
  output: {
    filename: 'icons.js',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
      },
      {
        test: /\.svg$/i,
        use: [{ loader: '@svgr/webpack', options: { babel: false } }],
      },
    ],
  },
})
