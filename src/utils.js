const fs = require('fs')
const path = require('path')
const prettierx = require('prettierx')
const { getSupportInfo } = prettierx
const ignore = require('ignore')

const extensions = {}

getSupportInfo()
  .languages.reduce(
    (prev, language) => prev.concat(language.extensions || []),
    []
  )
  .forEach(e => (extensions[e] = true))

function isSupportedExtension (file) {
  return extensions[path.extname(file)] || false
}

function createIgnorer (directory, filename = '.prettierignore') {
  const file = path.join(directory, filename)
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8')
    return ignore()
      .add(text)
      .createFilter()
  }

  return () => true
}

const defaultOptions = {
  spaceBeforeFunctionParen: true,
  generatorStarSpacing: true,
  yieldStarSpacing: true,
  singleQuote: true,
  semi: false,
  jsxSingleQuote: true,
  alignTernaryLines: false
}

function getOptions (options) {
  const final = Object.assign({}, defaultOptions, options)

  if (!final.filepath || (final.filepath === '(stdin)' && !final.parser)) {
    final.parser = 'babel'
  }

  return final
}

module.exports = {
  isSupportedExtension,
  createIgnorer,
  getOptions
}
