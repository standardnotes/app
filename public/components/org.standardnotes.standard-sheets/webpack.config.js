const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: [
    path.resolve(__dirname, 'app/main.js'),
    path.resolve(__dirname, 'app/stylesheets/main.scss'),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'dist.js'
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader"
          },
        ],
      },
      { 
        test: /\.js[x]?$/, 
        include: [
          path.resolve(__dirname, 'app'),
          path.resolve(__dirname, 'node_modules/sn-components-api/dist/dist.js')
        ],
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.scss'],
    alias: {
      stylekit: path.join(__dirname, 'node_modules/sn-stylekit/dist/stylekit.css')
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: './dist.css'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './app/index.html', to: 'index.html' }
      ]
    })
  ]
};
