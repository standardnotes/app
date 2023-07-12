const CopyPlugin = require('copy-webpack-plugin')
const package = require('./package.json')

module.exports = (env, argv) => {
  const isProd = !argv.watch

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
            to: './',
            globOptions: {
              ignore: isProd ? ['**/*.js.map'] : [],
            },
          },
          {
            from: `./src/manifest.v${process.env.MANIFEST_VERSION || 2}.json`,
            to: './manifest.json',
            transform: (content) => {
              const manifest = JSON.parse(content.toString())
              manifest.version = package.version
              if (process.env.EXT_TARGET === 'chromium') {
                delete manifest.browser_specific_settings
              }
              return JSON.stringify(manifest, null, 2)
            },
          },
          {
            from: './src/popup',
            to: './',
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
