import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(require('./package.json').version),
    __IS_DEV__: process.env.NODE_ENV !== 'production',
  },
  build: {
    lib: {
      entry: 'lib/index.ts',
      name: 'SNLibrary',
      formats: ['umd'],
      fileName(format, entryName) {
        if (format === 'umd') {
          return 'snjs.js'
        }
        return 'snjs.es.js'
      },
    },
  },
  resolve: {
    extensions: ['.js', '.ts'],
    alias: [
      { find: '@Lib', replacement: path.resolve(__dirname, 'lib') },
      { find: '@Services', replacement: path.resolve(__dirname, 'lib/services') },
      { find: '@Payloads', replacement: path.resolve(__dirname, 'lib/protocol/payloads') },
    ],
    preserveSymlinks: true,
  },
})
