const globby = require('globby')
const path = require('path')
const fs = require('fs')
const prettierx = require( 'prettierx' )
const {
  createFilter,
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
  const onProcessed = config.onProcessed || function () {}

  const filter = createFilter(cwd)
  const allFilters = path => isSupportedExtension(path) && filter(path)

  let files

  if (config.changed) {
    const scm = getScm(cwd)

    if (!scm) {
      console.error('--changed flag requires git repository...')
      process.exit(1)
    }

    cwd = scm.dir

    const revision = scm.getRevision(config.changed)

    if (!revision) {
      console.error(`Cannot find ${scm.name()} revision ${config.changed}`)
      process.exit(1)
    }

    files = scm.getChanges(revision)
  } else {
    const patterns = config.patterns.concat([
      '!**/node_modules/**',
      '!./node_modules/**',
      '!**/.{git,svn,hg}/**',
      '!./.{git,svn,hg}/**'
    ])

    try {
      filePaths = globby
        .sync(patterns, { dot: true, nodir: true })
        .map(filePath => path.relative(process.cwd(), filePath))
    } catch (error) {
      console.error(`Unable to expand glob pattern: ${error.message}`)
    }

    files = filePaths
      .filter(isSupportedExtension)
      .filter(filter)
      .map(filepath => ({ filepath }))
  }

  for (const file of files) {
    const start = Date.now()
    const { filepath, changes } = file

    const fullpath = path.join(cwd, filepath)
    const input = fs.readFileSync(fullpath, 'utf8')

    let ranges
    if (changes) {
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
