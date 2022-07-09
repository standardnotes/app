const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const packages = fs
  .readdirSync(path.resolve(__dirname, 'packages'), { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name.replace(/^sncrypto-/, ''))

// precomputed scope
const scopeComplete = execSync('git status --porcelain || true')
  .toString()
  .trim()
  .split('\n')
  .find((r) => ~r.indexOf('M  packages'))
  ?.replace(/(\/)/g, '%%')
  ?.match(/packages%%((\w|-)*)/)?.[1]
  ?.replace(/^sncrypto-/, '')

/** @type {import('cz-git').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0],
  },
  prompt: {
    alias: {
      f: 'docs: fix typos',
      b: 'chore: bump dep version',
    },
    scopes: [...new Set(packages), 'scripts', 'docker'],
    customScopesAlign: !scopeComplete ? 'top' : 'bottom',
    defaultScope: scopeComplete,
    allowEmptyIssuePrefixs: false,
    allowCustomIssuePrefixs: false,
  },
}
