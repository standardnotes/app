module.exports = {
  root: true,
  extends: ['../../common.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['**/*.spec.ts', '@types', 'node_modules', 'dist'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-var-requires': 'off',
  },
  globals: {
    zip: true,
  },
}
