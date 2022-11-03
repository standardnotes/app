const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: {
    'editor-kit': './src/EditorKit.ts',
    'editor-kit.min': './src/EditorKit.ts',
  },
  resolve: {
    extensions: ['.ts']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    sourceMapFilename: '[name].js.map',
    library: 'EditorKit',
    libraryTarget: 'umd',
    libraryExport: 'default',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(ts)?$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              presets: [
                ["@babel/preset-env"],
                ["@babel/preset-typescript"]
              ],
              plugins: [
                "@babel/plugin-proposal-class-properties"
              ]
            }
          }
        ]
      }
    ]
  },
  optimization: {
    usedExports: true,
    minimize: true,
    minimizer: [new TerserPlugin({
      include: /\.min\.js$/,
      terserOptions: {
        format: {
          comments: false
        }
      },
      extractComments: false
    })]
  }
};
