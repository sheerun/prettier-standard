const globby = require('globby')
const path = require('path')
const fs = require('fs')
const prettierx = require('prettierx')
const {
  createIgnorer,
  isSupportedExtension,
  getOptions,
  getScm,
  getRanges,
  getPathInHostNodeModules
} = require('./utils')

const DEFAULT_IGNORE = [
  '!**/*.min.js',
  '!**/{node_modules,coverage,vendor}/**',
  '!./{node_modules,coverage,vendor}/**',
  '!**/.{git,svn,hg}/**',
  '!./.{git,svn,hg}/**'
]

const LINT_REGEXP = /\.(js|mjs|cjs|jsx)$/

function format (source, options) {
  return prettierx.format(source, getOptions(options))
}

function check (source, options) {
  return prettierx.check(source, getOptions(options))
}

function getFileInfo (filePath, options) {
  return prettierx.getFileInfo(filePath, options)
}

function formatWithCursor (source, options) {
  return prettierx.formatWithCursor(source, getOptions(options))
}

function formatWithRanges (source, ranges, options) {
  if (!ranges || ranges.length === 0) {
    return format(source, options)
  }

  let output = source

  ranges.forEach(({ rangeStart, rangeEnd }) => {
    output = format(
      output,
      Object.assign({}, options, { rangeStart, rangeEnd })
    )
  })

  return output
}

function checkWithRanges (source, ranges, options) {
  if (!ranges || ranges.length === 0) {
    return check(source, options)
  }

  let valid = true
  ranges.forEach(({ rangeStart, rangeEnd }) => {
    valid =
      valid &&
      check(source, Object.assign({}, options, { rangeStart, rangeEnd }))
  })
  return valid
}

function run (cwd, config) {
  // Filepaths will be relative to this directory
  let root = cwd

  let patterns = config.patterns || []

  if ((config.format || config.lint) && patterns.length === 0) {
    patterns.push('*/**')
  }

  if (!Array.isArray(patterns)) {
    return new Error('patterns should be an array')
  }

  const onStart = config.onStart || function () {}
  const onProcessed = config.onProcessed || function () {}

  // They ignore files relative to current directory
  const filters = [
    // Ignore .prettierignore entries
    createIgnorer(cwd),
    // Ignore unsupported extensions
    isSupportedExtension
  ]

  const runFilters = path => filters.reduce((a, b) => a && b(path), true)

  let engine

  if (config.lint) {
    const eslintPath = getPathInHostNodeModules('eslint')
    const babelEslintPath = getPathInHostNodeModules('babel-eslint')

    const configs = {
      prettier: getPathInHostNodeModules('eslint-config-prettier'),
      standard: getPathInHostNodeModules('eslint-config-standard'),
      'standard-jsx': getPathInHostNodeModules('eslint-config-standard-jsx')
    }

    const getConfig = (config, file) => path.join(configs[config], file)

    const eslint = require(eslintPath)
    engine = new eslint.CLIEngine({
      parser: babelEslintPath,
      resolvePluginsRelativeTo: path.join(__dirname, 'vendor'),
      baseConfig: {
        plugins: ['jest'],
        env: {
          'jest/globals': true
        },
        extends: [
          getConfig('standard', 'index.js'),
          getConfig('standard-jsx', 'index.js'),
          getConfig('prettier', 'index.js'),
          getConfig('prettier', '@typescript-eslint.js'),
          getConfig('prettier', 'babel.js'),
          getConfig('prettier', 'flowtype.js'),
          getConfig('prettier', 'react.js'),
          getConfig('prettier', 'standard.js'),
          getConfig('prettier', 'unicorn.js'),
          getConfig('prettier', 'vue.js')
        ]
      }
    })
  }

  onStart({ engine })

  let files

  if (config.changed || config.since || config.lines) {
    const scm = getScm(cwd)

    if (!scm) {
      return new Error('No git repository detected...')
    }

    root = scm.dir

    const revision = scm.getRevision(config.since || 'HEAD')

    if (!revision) {
      return new Error(`Cannot find ${scm.name()} revision ${config.since}`)
    }

    files = scm
      .getChanges(revision, config.patterns)
      .filter(p => runFilters(p.filepath))
  } else {
    patterns = patterns.concat(DEFAULT_IGNORE)

    let filePaths = []

    try {
      filePaths = globby
        .sync(patterns, { dot: true, nodir: true, cwd })
        .map(filePath => path.relative(process.cwd(), filePath))
    } catch (error) {
      return new Error(`Unable to expand glob pattern: ${error.message}`)
    }

    files = filePaths.filter(runFilters).map(filepath => ({ filepath }))
  }

  for (const file of files) {
    const start = Date.now()
    const { filepath, changes } = file

    const fullpath = path.join(root, filepath)
    const input = fs.readFileSync(fullpath, 'utf8')

    let ranges
    if (config.lines && changes) {
      ranges = getRanges(input, changes)
    }

    const fileOptions = Object.assign(
      {},
      prettierx.resolveConfig.sync(fullpath, {
        editorconfig: true
      }),
      config.options,
      { filepath: fullpath }
    )

    const fileInfo = prettierx.getFileInfo.sync(fullpath, {})

    if (!fileOptions.parser) {
      fileOptions.parser = fileInfo.inferredParser
    }

    if (config.check) {
      const formatted = checkWithRanges(input, ranges, fileOptions)

      let report
      if (config.lint && fullpath.match(LINT_REGEXP)) {
        report = engine.executeOnText(input, fullpath)
      }

      onProcessed({
        file: filepath,
        runtime: Date.now() - start,
        formatted,
        report,
        engine,
        check: config.check
      })

      continue
    }

    const output = formatWithRanges(input, ranges, fileOptions)

    const formatted = output === input

    if (!formatted) {
      fs.writeFileSync(fullpath, output)
    }

    let report
    if (config.lint && fullpath.match(LINT_REGEXP)) {
      report = engine.executeOnText(output, fullpath)
    }

    onProcessed({
      file: filepath,
      runtime: Date.now() - start,
      formatted,
      report,
      check: config.check
    })
  }
}

module.exports = {
  format,
  check,
  run,
  getFileInfo,
  formatWithCursor,
  resolveConfig: prettierx.resolveConfig,
  clearConfigCache: prettierx.clearConfigCache,
  getSupportInfo: prettierx.getSupportInfo
}
