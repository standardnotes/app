const CopyPlugin = require('copy-webpack-plugin')
const package = require('./package.json')

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
          {
            from: `./src/manifest.v${process.env.MANIFEST_VERSION || 2}.json`,
            to: './manifest.json',
            transform: (content) => {
              const manifest = JSON.parse(content.toString())
              manifest.version = package.version
              return JSON.stringify(manifest, null, 2)
            },
          },
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
