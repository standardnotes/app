const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
  entry: './app/assets/javascripts/index.js',
  output: {
    filename: './javascripts/app.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(require('./package.json').version)
    }),
    new CopyPlugin([
      { from: 'node_modules/snjs/dist/libsodium.bundle.js', to: '../public/dist/libsodium.bundle.js' },
      { from: 'node_modules/snjs/dist/vendors~libsodium.bundle.js', to: '../public/dist/vendors~libsodium.bundle.js' },
    ]),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      filename: './stylesheets/app.css',
      ignoreOrder: false // Enable to remove warnings about conflicting order
    })
  ],
  devtool: 'source-map',
  resolve: {
    alias: {
      '%': path.resolve(__dirname, 'app/assets/templates'),
      '@': path.resolve(__dirname, 'app/assets/javascripts'),
      '@Controllers': path.resolve(__dirname, 'app/assets/javascripts/controllers')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.s?css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../', // The base assets directory in relation to the stylesheets
              hmr: process.env.NODE_ENV === 'development'
            }
          },
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'ng-cache-loader',
            options: {
              prefix: 'templates:**'
            }
          }
        ]
      },
      {
        test: /\.pug$/,
        use: [
          {
            loader: 'apply-loader'
          },
          {
            loader: 'pug-loader'
          }
        ]
      }
    ]
  }
};
