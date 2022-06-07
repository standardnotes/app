const pathsToModuleNameMapper = require('ts-jest').pathsToModuleNameMapper
const tsConfig = require('./tsconfig.json')

const pathsFromTsconfig = tsConfig.compilerOptions.paths

module.exports = {
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  moduleNameMapper: {
    ...pathsToModuleNameMapper(pathsFromTsconfig, {
      prefix: '<rootDir>',
    }),
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '@standardnotes/toast': 'identity-obj-proxy',
  },
  globals: {
    __WEB_VERSION__: '1.0.0',
    self: {}, // fixes error happening on `import { SKAlert } from 'sn-stylekit'`
  },
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '\\.svg$': 'svg-jest',
  },
}
