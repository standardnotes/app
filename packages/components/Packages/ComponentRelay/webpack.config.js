const path = require('path');

module.exports = {
  entry: './lib/ComponentRelay.ts',
  resolve: {
    extensions: ['.ts']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'dist.js',
    sourceMapFilename: 'dist.js.map',
    library: 'ComponentRelay',
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
  }
};
