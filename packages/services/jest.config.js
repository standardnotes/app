// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('../../node_modules/@standardnotes/config/src/jest.json');

module.exports = {
  ...base,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  coverageThreshold: {
    global: {
      branches: 9,
      functions: 10,
      lines: 17,
      statements: 16
    }
  }
};
