import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [svgr()],
  build: {
    outDir: './dist',
    lib: {
      entry: 'src/index.ts',
      name: 'SNIcons',
      formats: ['umd'],
      fileName() {
        return 'index.js'
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
})
