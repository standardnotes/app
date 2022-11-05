module.exports = {
  root: true,
  extends: ['../../common.eslintrc.js'],
  parserOptions: {
    project: './lib/tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['**/*.spec.ts'],
}
