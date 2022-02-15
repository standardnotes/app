const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const mergeWithEnvDefaults = require('./webpack-defaults');
require('dotenv').config();

module.exports = (env) => {
  mergeWithEnvDefaults(env);
  return {
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
      extensions: ['.ts', '.tsx', '.js'],
      fallback: {
        crypto: false,
        path: false,
      },
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
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|tsx?)$/,
          exclude: /(node_modules)/,
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
              },
            },
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.svg$/i,
          use: ['@svgr/webpack'],
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
  };
};
