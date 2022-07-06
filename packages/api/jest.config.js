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
      branches: 17,
      functions: 43,
      lines: 46,
      statements: 46
    }
  }
};
