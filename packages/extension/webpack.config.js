const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    background: './src/background/background.ts',
    content: './src/content/content.ts',
  },
  output: {
    filename: '[name].js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: '../web/dist',
          to: './web',
        },
        { from: './src/manifest.json' },
        {
          from: './src/popup/index.html',
          to: './popup/index.html',
        },
        {
          from: './images',
          to: './images',
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
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
    ],
  },
}
