module.exports = {
  root: true,
  extends: ['../../common.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['**/*.spec.ts'],
}
