const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const mergeWithEnvDefaults = require('./web.webpack-defaults')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const clipperHtmlTemplate = require('./clipper.htmlTemplate')
require('dotenv').config()

module.exports = (env) => {
  mergeWithEnvDefaults(env)

  const copyPluginPatterns = [
    { from: 'src/favicon', to: 'favicon' },
    { from: 'src/vendor', to: 'dist' },
    { from: 'src/404.html' },
    { from: 'src/422.html' },
    { from: 'src/500.html' },
    { from: 'src/index.html' },
    { from: 'src/manifest.webmanifest' },
    { from: 'src/robots.txt' },
    { from: 'src/.well-known', to: '.well-known' },
  ]

  if (process.env.BUILD_TARGET !== 'clipper') {
    copyPluginPatterns.push({ from: 'src/components', to: 'components' })
  }

  return {
    entry: './src/javascripts/index.ts',
    output: {
      filename: process.env.BUILD_TARGET === 'clipper' ? './[name].bundle.js' : './app.js',
    },
    optimization:
      process.env.BUILD_TARGET === 'clipper'
        ? {
            splitChunks: {
              chunks: 'all',
            },
          }
        : {},
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
        __WEB_VERSION__: JSON.stringify(require('./package.json').version),
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        filename: './app.css',
        ignoreOrder: true, // Enable to remove warnings about conflicting order
      }),
      new CopyWebpackPlugin({
        patterns: copyPluginPatterns,
      }),
    ].concat(
      process.env.BUILD_TARGET === 'clipper'
        ? [
            new HtmlWebpackPlugin({
              filename: 'popup.html',
              inject: false,
              templateContent: clipperHtmlTemplate,
            }),
          ]
        : [],
    ),
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      fallback: {
        crypto: false,
        path: false,
        url: false,
        fs: false,
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
          test: /\.worker\.tsx?$/,
          loader: 'worker-loader',
          options: {
            inline: 'fallback',
          },
        },
        {
          test: /\.(js|tsx?)$/,
          /**
           * Exclude all node_modules, except for those we need to run through our babel rules because
           * they may contain class properties and other ES6+ syntax.
           */
          exclude:
            /node_modules\/(?!(@standardnotes\/common|@standardnotes\/domain-core|webextension-polyfill|yoga-layout))/,
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
            'postcss-loader',
          ],
        },
      ],
    },
  }
}
