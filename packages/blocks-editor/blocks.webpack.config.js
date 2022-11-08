const path = require('path')
module.exports = () => {
  return {
    entry: './src/index.ts',
    output: {
      filename: './dist.js',
    },
    mode: 'production',
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    externals: {
      "@standardnotes/icons": path.resolve(__dirname, "./node_modules/@standardnotes/icons")
    },
    module: {
      rules: [
        {
          test: /\.(js|tsx?)$/,
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
