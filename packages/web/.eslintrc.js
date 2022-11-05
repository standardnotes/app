module.exports = {
  root: true,
  extends: ['../../common.eslintrc.js', 'plugin:react-hooks/recommended'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['**/*.spec.ts', "__mocks__"],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  env: {
    browser: true,
  },
  globals: {
    __WEB_VERSION__: true,
  },
}
