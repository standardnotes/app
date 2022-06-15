module.exports = {
  "env": {
    "browser": true,
    "amd": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12
  },
  "rules": {
    "indent": [2, 2],
    "no-var": "error"
  },
  "globals": {
    "CodeMirror": true,
    "ComponentRelay": true
  }
};
