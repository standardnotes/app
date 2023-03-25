const CopyPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => {
  return {
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
          { from: `./src/manifest.v${process.env.MANIFEST_VERSION || 2}.json`, to: './manifest.json' },
          {
            from: './src/popup',
            to: './popup',
          },
          {
            from: './images',
            to: './images',
          },
        ],
      }),
    ],
    resolve: {
      extensions: ['.ts', '.js'],
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
}
