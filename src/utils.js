const fs = require('fs')
const path = require('path')
const prettierx = require('prettierx')
const { getSupportInfo } = prettierx
const ignore = require('ignore')
const execa = require('execa')

const git = require('./scms/git')

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

function createFilter (directory, filename = '.prettierignore') {
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
  jsxSingleQuote: true
}

function getOptions (options) {
  const final = Object.assign({}, defaultOptions, options)

  if (!final.filepath || (final.filepath === '(stdin)' && !final.parser)) {
    final.parser = 'babel'
  }

  return final
}

function getRanges (source, changes) {
  const lines = source.split('\n')
  const ranges = changes.slice()

  const result = []

  let i = 0
  let l = 0
  let rangeStart = 0
  while (ranges.length > 0 && l < lines.length) {
    if (ranges[0].start === l) {
      rangeStart = i
    }
    i += lines[l].length + 1
    if (ranges[0].end === l) {
      result.push({
        rangeStart,
        rangeEnd: i
      })
      ranges.shift()
    }
    l += 1
  }

  return result
}

function getScm (cwd) {
  return git(cwd)
}

module.exports = {
  isSupportedExtension,
  createFilter,
  getOptions,
  getScm,
  getRanges
}
