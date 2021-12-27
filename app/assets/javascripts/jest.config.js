const pathsToModuleNameMapper =
  require('ts-jest/utils').pathsToModuleNameMapper;
const tsConfig = require('./tsconfig.json');

const pathsFromTsconfig = tsConfig.compilerOptions.paths;

module.exports = {
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  moduleNameMapper: {
    ...pathsToModuleNameMapper(pathsFromTsconfig, {
      prefix: '<rootDir>',
    }),
    '^react$': ['preact/compat'],
    '^react-dom$': 'preact',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  globals: {
    __VERSION__: '1.0.0',
    __DESKTOP__: false,
    __WEB__: true,
    self: {}, // fixes error happening on `import { SKAlert } from 'sn-stylekit'`
  },
  transform: {
    '\\.(pug)$': '../../../node_modules/jest-transform-pug',
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '\\.svg$': 'svg-jest',
  },
};
