const globby = require('globby')
const path = require('path')
const fs = require('fs')
const prettierx = require('prettierx')
const minimatch = require('minimatch')
const {
  createIgnorer,
  createMatcher,
  isSupportedExtension,
  getOptions,
  getScm,
  getRanges
} = require('./utils')

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

  const patterns = config.patterns || []

  if (!Array.isArray(patterns)) {
    throw new Error('patterns should be an array')
  }

  const onProcessed = config.onProcessed || function () {}

  // They ignore files relative to current directory
  const filters = [
    // Ignore .prettierignore entries
    createIgnorer(cwd),
    // Ignore unsupported extensions
    isSupportedExtension
  ]

  const runFilters = path => filters.reduce((a, b) => a && b(path), true)

  let files

  if (config.changed || config.since) {
    const scm = getScm(cwd)

    if (!scm) {
      console.error('--changed flag requires git repository...')
      process.exit(1)
    }

    root = scm.dir

    const revision = scm.getRevision(config.since || 'HEAD')

    if (!revision) {
      console.error(`Cannot find ${scm.name()} revision ${config.changed}`)
      process.exit(1)
    }

    files = scm
      .getChanges(revision, config.patterns)
      .filter(p => runFilters(p.filepath))
  } else {
    const patterns = config.patterns.concat([
      '!**/node_modules/**',
      '!./node_modules/**',
      '!**/.{git,svn,hg}/**',
      '!./.{git,svn,hg}/**'
    ])

    try {
      filePaths = globby
        .sync(patterns, { dot: true, nodir: true, cwd })
        .map(filePath => path.relative(process.cwd(), filePath))
    } catch (error) {
      console.error(`Unable to expand glob pattern: ${error.message}`)
      process.exit(1)
    }

    files = filePaths.filter(runFilters).map(filepath => ({ filepath }))
  }

  for (const file of files) {
    const start = Date.now()
    const { filepath, changes } = file

    const fullpath = path.join(root, filepath)
    const input = fs.readFileSync(fullpath, 'utf8')

    let ranges
    if (config.changed && changes) {
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

      onProcessed({
        file: filepath,
        runtime: Date.now() - start,
        formatted,
        check: config.check
      })
      continue
    }

    const output = formatWithRanges(input, ranges, fileOptions)

    const formatted = output === input

    if (!formatted) {
      fs.writeFileSync(fullpath, output)
    }

    onProcessed({
      file: filepath,
      runtime: Date.now() - start,
      formatted,
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
