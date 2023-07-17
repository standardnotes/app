const path = require('path')
const webpack = require('webpack')
const CircularDependencyPlugin = require('circular-dependency-plugin')

module.exports = {
  entry: {
    'snjs.js': './lib/index.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@Lib': path.resolve(__dirname, 'lib'),
      '@Services': path.resolve(__dirname, 'lib/services'),
      '@Payloads': path.resolve(__dirname, 'lib/protocol/payloads'),
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: './[name]',
    library: 'SNLibrary',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    publicPath: '/dist/',
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(require('./package.json').version),
    }),
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /a\.js|node_modules/,
      // add errors to webpack instead of warnings
      failOnError: false,
      // allow import cycles that include an asyncronous import,
      // e.g. via import(/* webpackMode: "weak" */ './file.js')
      allowAsyncCycles: false,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    }),
  ],
}
