const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MergeIntoSingleFilePlugin = require("webpack-merge-and-include-globally");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: [
    path.resolve(__dirname, "src", "main.js"),
    path.resolve(__dirname, "src", "main.scss"),
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
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "dist.css"
    }),
    new MergeIntoSingleFilePlugin({
      files: {
        "vendor.js": [
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/bootstrap/dist/js/bootstrap.min.js',
          'node_modules/summernote/dist/summernote.min.js',
          'node_modules/@standardnotes/component-relay/dist/dist.js',
          'node_modules/dompurify/dist/purify.min.js',
          'node_modules/sn-stylekit/dist/stylekit.js'
        ],
        "vendor.css": [
          'node_modules/bootstrap/dist/css/bootstrap.min.css',
          'node_modules/summernote/dist/summernote.min.css',
          'node_modules/sn-stylekit/dist/stylekit.css'
        ]
      }
    }),
    new HtmlWebpackPlugin({
      title: "Plus Editor",
      template: "editor.index.ejs"
    })
  ],
};
