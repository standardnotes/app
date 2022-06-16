const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: [
    path.resolve(__dirname, 'app/main.js'),
    path.resolve(__dirname, 'app/stylesheets/main.scss')
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
          path.resolve(__dirname, 'node_modules/@standardnotes/component-relay/dist/dist.js')
        ],
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      stylekit: path.resolve(__dirname, 'node_modules/sn-stylekit/dist/stylekit.css'),
      '@Components': path.resolve(__dirname, 'app/components'),
      '@Lib': path.resolve(__dirname, 'app/lib'),
      '@Models': path.resolve(__dirname, 'app/models')
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "dist.css"
    }),
    new HtmlWebpackPlugin({
      title: "Simple Task Editor",
      template: 'editor.index.ejs',
      filename: 'index.html'
    })
  ]
};
