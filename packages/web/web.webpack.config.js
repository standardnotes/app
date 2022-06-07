const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')
const mergeWithEnvDefaults = require('./web.webpack-defaults')
require('dotenv').config()

module.exports = (env) => {
  mergeWithEnvDefaults(env)
  return {
    entry: './src/javascripts/index.ts',
    output: {
      filename: './app.js',
    },
    plugins: [
      new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        exclude: /a\.js|node_modules/,
        // include specific files based on a RegExp
        include: /app\/assets\/javascripts/,
        // add errors to webpack instead of warnings
        failOnError: true,
        // allow import cycles that include an asyncronous import,
        // e.g. via import(/* webpackMode: "weak" */ './file.js')
        allowAsyncCycles: false,
        // set the current working directory for displaying module paths
        cwd: process.cwd(),
      }),
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(require('./package.json').version),
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        filename: './app.css',
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
        '@': path.resolve(__dirname, 'src/javascripts'),
        '@Controllers': path.resolve(__dirname, 'src/javascripts/controllers'),
        '@Services': path.resolve(__dirname, 'src/javascripts/services'),
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
      ],
    },
  }
}
