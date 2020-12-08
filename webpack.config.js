const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
require('dotenv').config();

module.exports = (
  env = {
    platform: 'web',
  }
) => ({
  entry: './app/assets/javascripts/index.ts',
  output: {
    filename: './javascripts/app.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(require('./package.json').version),
      __WEB__: JSON.stringify(env.platform === 'web'),
      __DESKTOP__: JSON.stringify(env.platform === 'desktop'),
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      filename: './stylesheets/app.css',
      ignoreOrder: true, // Enable to remove warnings about conflicting order
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '%': path.resolve(__dirname, 'app/assets/templates'),
      '@': path.resolve(__dirname, 'app/assets/javascripts'),
      '@Controllers': path.resolve(
        __dirname,
        'app/assets/javascripts/controllers'
      ),
      '@Views': path.resolve(__dirname, 'app/assets/javascripts/views'),
      '@Services': path.resolve(__dirname, 'app/assets/javascripts/services'),
      '@node_modules': path.resolve(__dirname, 'node_modules'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /(node_modules|snjs)/,
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
      {
        test: /\.s?css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../', // The base assets directory in relation to the stylesheets
              hmr: process.env.NODE_ENV === 'development',
            },
          },
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/',
            },
          },
        ],
      },
      {
        test: /\.html$/,
        exclude: [path.resolve(__dirname, 'index.html')],
        use: [
          {
            loader: 'ng-cache-loader',
            options: {
              prefix: 'templates:**',
            },
          },
        ],
      },
      {
        test: /\.pug$/,
        use: [
          {
            loader: 'apply-loader',
          },
          {
            loader: 'pug-loader',
          },
        ],
      },
    ],
  },
});
