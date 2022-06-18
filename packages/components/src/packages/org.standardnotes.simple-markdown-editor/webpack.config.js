const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  performance: {
    hints: false,
  },
  devtool: 'cheap-source-map',
  entry: [
    path.resolve(__dirname, 'app/main.js'),
    path.resolve(__dirname, 'app/stylesheets/main.scss'),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: './dist.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        include: path.resolve(__dirname, 'app'),
        loader: 'style-loader!css-loader',
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../',
            },
          },
          'css-loader',
          {
            loader: 'sass-loader',
            query: {
              sourceMap: false,
            },
          },
        ],
      },
      {
        test: /\.js[x]?$/,
        include: [
          path.resolve(__dirname, 'app'),
          require.resolve('@standardnotes/component-relay/dist/dist.js'),
        ],
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.scss'],
    alias: {
      highlightjs_css: require.resolve('highlight.js/styles/atom-one-light.css'),
      stylekit: require.resolve('sn-stylekit/dist/stylekit.css'),
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: './dist.css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './app/index.html',
          to: 'index.html',
        },
      ],
    }),
  ],
};
