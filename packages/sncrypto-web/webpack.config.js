const path = require('path')
module.exports = {
  entry: {
    'sncrypto-web.js': './src/index',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      crypto: false,
      path: false,
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: './[name]',
    chunkFilename: '[name].bundle.js',
    library: 'SNCrypto',
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
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader' }, { loader: 'ts-loader' }],
      },
      {
        test: /\.(js)$/,
        loader: 'babel-loader',
      },
    ],
  },
  plugins: [],
  stats: {
    colors: true,
  },
  devtool: 'source-map',
}
