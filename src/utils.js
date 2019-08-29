const fs = require('fs')
const path = require('path')
const prettierx = require('prettierx')
const { getSupportInfo } = prettierx
const ignore = require('ignore')
const multimatch = require('multimatch')
const findUp = require('find-up')

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

function createMatcher (relative, patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return () => true
  }

  return file =>
    multimatch(path.relative(relative, file), patterns, { dot: true }).length >
    0
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

function getPathInHostNodeModules (module) {
  const modulePath = findUp.sync(`node_modules/${module}`, {
    type: 'directory'
  })

  if (modulePath) {
    return modulePath
  }

  const result = findUp.sync(`node_modules/${module}`, {
    cwd: path.join(__dirname, 'vendor'),
    type: 'directory'
  })

  return result
}

module.exports = {
  isSupportedExtension,
  createIgnorer,
  createMatcher,
  getOptions,
  getScm,
  getRanges,
  getPathInHostNodeModules
}
