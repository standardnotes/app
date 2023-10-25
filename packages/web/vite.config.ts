import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,tsx}',
    }),
  ],
  define: {
    __WEB_VERSION__: JSON.stringify(require('./package.json').version),
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src', 'javascripts'),
      },
    ],
    extensions: ['.js', '.ts', '.tsx'],
    preserveSymlinks: true,
  },
  build: {
    outDir: './dist',
  },
  server: {
    port: 3001,
  },
})
