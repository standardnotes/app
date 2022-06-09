const path = require('path')
module.exports = () => {
  return {
    entry: './src/index.ts',
    mode: 'production',
    devtool: 'source-map',
    optimization: {
      minimize: false,
    },
    output: {
      filename: 'index.js',
    },
    resolve: {
      fallback: {
        crypto: false,
        path: false,
      },
      extensions: ['.js', '.jsx', '.ts'],
    },
    module: {
      rules: [
        {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
        {
          test: /\.svg$/i,
          use: [{ loader: '@svgr/webpack', options: { babel: false } }],
        },
      ],
    },
    plugins: [
      new (require('copy-webpack-plugin'))({
        patterns: [
          {
            from: '**/*.svg',
            to: 'mobile-exports',
            context: path.resolve(__dirname, 'src', 'Icons'),
          },
        ],
      }),
    ],
  }
}
