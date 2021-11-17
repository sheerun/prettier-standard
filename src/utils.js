import fs from 'node:fs'
import path from 'node:path'
import prettierx from 'prettierx'
import ignore from 'ignore'
import multimatch from 'multimatch'
import findUp from 'find-up'

import git from './scms/git.js'

const { getSupportInfo } = prettierx

const __dirname = new URL('./', import.meta.url).pathname

const extensions = {}

getSupportInfo()
  .languages.reduce(
    (prev, language) => prev.concat(language.extensions || []),
    []
  )
  .forEach(e => (extensions[e] = true))

export function isSupportedExtension (file) {
  return extensions[path.extname(file)] || false
}

export function createIgnorer (directory, filename = '.prettierignore') {
  const file = path.join(directory, filename)
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8')
    return ignore
      .default()
      .add(text)
      .createFilter()
  }

  return () => true
}

export function createMatcher (relative, patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return () => true
  }

  return file => {
    const relativepath = path.relative(relative, file)
    return multimatch(relativepath, patterns, { dot: true }).length > 0
  }
}

const defaultOptions = {
  spaceBeforeFunctionParen: true,
  generatorStarSpacing: true,
  yieldStarSpacing: true,
  singleQuote: true,
  semi: false,
  jsxSingleQuote: true,
  trailingComma: 'none',
  offsetTernaryExpressions: true,
  arrowParens: 'avoid'
}

export function getOptions (options) {
  const final = Object.assign({}, defaultOptions, options)

  if (!final.filepath || (final.filepath === '(stdin)' && !final.parser)) {
    final.parser = 'babel'
  }

  return final
}

export function getRanges (source, changes) {
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

export function getScm (cwd) {
  return git(cwd)
}

export function getPathInHostNodeModules (module) {
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

  if (result) {
    return result
  }

  throw new Error(`Module not found: ${module}`)
}

export async function importDirectoryModule (directory) {
  const packagePath = path.join(directory, 'package.json')
  const packageContents = await fs.promises.readFile(packagePath, 'utf-8')
  const packageJSON = JSON.parse(packageContents)
  const importPath = path.resolve(directory, packageJSON.main)
  return import(importPath)
}
