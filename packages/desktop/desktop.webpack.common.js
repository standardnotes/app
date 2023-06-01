const env = process.env.NODE_ENV ?? 'production'
require('dotenv').config({
  path: `.env.public.${env}`,
})

const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const { DefinePlugin } = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = function ({ onlyTranspileTypescript = false, experimentalFeatures = false, snap = false } = {}) {
  const moduleConfig = {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: onlyTranspileTypescript,
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        sideEffects: true,
        test: /\.(png|html)$/i,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
    ],
  }

  const resolve = {
    extensions: ['.ts', '.js'],
    alias: {
      '@web': path.resolve(__dirname, '../web/src/javascripts'),
    },
  }

  const EXPERIMENTAL_FEATURES = JSON.stringify(experimentalFeatures)
  const IS_SNAP = JSON.stringify(snap ? true : false)

  const electronMainConfig = {
    entry: {
      index: './app/index.ts',
    },
    output: {
      path: path.resolve(__dirname, 'app', 'dist'),
      filename: 'index.js',
    },
    devtool: 'inline-cheap-source-map',
    target: 'electron-main',
    node: {
      __dirname: false,
    },
    resolve,
    module: moduleConfig,
    externals: {
      keytar: 'commonjs keytar',
      "@standardnotes/home-server": "commonjs @standardnotes/home-server",
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          exclude: ['web', 'node_modules'],
        }),
      ],
    },
    plugins: [
      new DefinePlugin({
        EXPERIMENTAL_FEATURES,
        IS_SNAP,
      }),
      new CopyPlugin({
        patterns: [
          {
            from: '../web/dist',
            to: 'web',
          },
          {
            from: 'app/node_modules',
            to: 'node_modules',
            globOptions: {
              ignore: ['**/@standardnotes/inner-desktop/**'],
            },
          },
          {
            from: 'app/stylesheets/renderer.css',
            to: 'stylesheets/renderer.css',
          },
          {
            from: 'app/icon',
            to: 'icon',
          },
        ],
      }),
    ],
  }

  const electronRendererConfig = {
    entry: {
      preload: './app/javascripts/Renderer/Preload.ts',
      renderer: './app/javascripts/Renderer/Renderer.ts',
      grantLinuxPasswordsAccess: './app/javascripts/Renderer/grantLinuxPasswordsAccess.js',
    },
    output: {
      path: path.resolve(__dirname, 'app', 'dist', 'javascripts', 'renderer'),
      publicPath: '/',
    },
    target: 'electron-renderer',
    devtool: 'inline-cheap-source-map',
    node: {
      __dirname: false,
    },
    resolve,
    module: moduleConfig,
    externals: {
      electron: 'commonjs electron',
    },
    plugins: [
      new webpack.DefinePlugin({
        DEFAULT_SYNC_SERVER: JSON.stringify(process.env.DEFAULT_SYNC_SERVER || 'https://api.standardnotes.com'),
        PURCHASE_URL: JSON.stringify(process.env.PURCHASE_URL),
        PLANS_URL: JSON.stringify(process.env.PLANS_URL),
        DASHBOARD_URL: JSON.stringify(process.env.DASHBOARD_URL),
        EXPERIMENTAL_FEATURES,
        WEBSOCKET_URL: JSON.stringify(process.env.WEBSOCKET_URL),
        ENABLE_UNFINISHED_FEATURES: JSON.stringify(process.env.ENABLE_UNFINISHED_FEATURES),
      }),
    ],
  }
  return [electronMainConfig, electronRendererConfig]
}
