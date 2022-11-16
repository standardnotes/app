// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('../../common.jest.json')

module.exports = {
  ...base,
  moduleNameMapper: {
    '@Lib/(.*)': '<rootDir>/lib/$1',
    '@Services/(.*)': '<rootDir>/lib/Services/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: './lib/tsconfig.json', isolatedModules: true, babelConfig: 'babel.config.js' },
    ],
  },
  clearMocks: true,
  collectCoverageFrom: ['lib/**/{!(index),}.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'text', 'html'],
  resetMocks: true,
  resetModules: true,
  roots: ['<rootDir>/lib'],
  setupFiles: ['<rootDir>/jest-global.ts'],
  setupFilesAfterEnv: [],
  coverageThreshold: {
    global: {
      branches: 13,
      functions: 22,
      lines: 27,
      statements: 27,
    },
  },
}
