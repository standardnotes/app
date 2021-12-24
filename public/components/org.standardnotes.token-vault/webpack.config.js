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
  externals: {
    'filesafe-js': {}
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
          path.resolve(__dirname, 'app')
        ],
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.svg$/i,
        issuer: /\.s[ac]ss$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10000
            }
          }
        ],
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      stylekit: path.resolve(__dirname, 'node_modules/sn-stylekit/dist/stylekit.css'),
      '@Components': path.resolve(__dirname, 'app/components'),
      '@Lib': path.resolve(__dirname, 'app/lib')
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "dist.css"
    }),
    new HtmlWebpackPlugin({
      title: "TokenVault",
      template: 'editor.index.ejs',
      filename: 'index.html'
    })
  ]
};
