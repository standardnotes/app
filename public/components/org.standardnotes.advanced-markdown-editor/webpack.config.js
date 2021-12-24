const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: [
    path.resolve(__dirname, "src", "main.js"),
    path.resolve(__dirname, "src", "main.scss")
  ],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "dist.js"
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                includePaths: [
                  "src/main.scss"
                ],
              },
            },
          },
        ],
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
      }
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "node_modules/easymde/dist/easymde.min.js", to: path.resolve(__dirname, "dist/vendor/easymd/easymd.js") },
        { from: "node_modules/easymde/dist/easymde.min.css", to: path.resolve(__dirname, "dist/vendor/easymd/easymde.css") },
        { from: "node_modules/highlightjs/highlight.pack.min.js", to: path.resolve(__dirname, "dist/vendor/highlightjs/highlightjs.js") },
        { from: "node_modules/@standardnotes/component-relay/dist/dist.js", to: path.resolve(__dirname, "dist/lib/component-relay.js") },
        { from: "node_modules/sn-stylekit/dist/stylekit.css", to: path.resolve(__dirname, "dist/stylekit.css") },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "dist.css"
    }),
    new HtmlWebpackPlugin({
      title: "Markdown Pro",
      template: "editor.index.ejs"
    })
  ],
};
