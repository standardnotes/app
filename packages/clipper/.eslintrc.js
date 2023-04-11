module.exports = {
  root: true,
  extends: ['../../common.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['**/*.spec.ts', '__mocks__'],
  plugins: ['@typescript-eslint', 'prettier'],
  env: {
    browser: true,
  },
  globals: {
    __WEB_VERSION__: true,
  },
}
