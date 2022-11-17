// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('../../common.jest.json')

module.exports = {
  ...base,
  coverageThreshold: {
    global: {
      branches: 4,
      functions: 4,
      lines: 24,
      statements: 25,
    },
  },
}
