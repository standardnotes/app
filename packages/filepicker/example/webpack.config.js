const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env) => {
  return {
    entry: './src/index.ts',
    output: {
      filename: './dist/index.js',
    },
    mode: 'development',
    optimization: {
      minimize: false,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: true,
        templateParameters: {
          env: process.env,
        },
      }),
    ],
    devServer: {
      hot: 'only',
      static: './public',
      port: 3030,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      fallback: {
        crypto: false,
        path: false,
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
      ],
    },
  };
};
