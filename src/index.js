const { getPathInHostNodeModules } = require('./utils')
const babelEslintPath = getPathInHostNodeModules('babel-eslint')
const eslintConfigPrettierPath = getPathInHostNodeModules('eslint-config-prettier')
const path = require('path')

module.exports = {
  parser: babelEslintPath,
  baseConfig: {
    extends: [
      // path.join(eslintConfigPrettierPath, 'index.js'),
      // path.join(eslintConfigPrettierPath, 'standard.js'),
      // path.join(eslintConfigPrettierPath, 'react.js')
    ]
  }
}
