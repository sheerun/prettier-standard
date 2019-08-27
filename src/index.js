const globby = require('globby')
const path = require('path')
const fs = require('fs')
const prettierx = require('prettierx')
const { createIgnorer, isSupportedExtension, getOptions } = require('./utils')

function format (source, options) {
  return prettierx.format(source, getOptions(options))
}

function check (source, options) {
  return prettierx.check(source, getOptions(options))
}

function getFileInfo (filePath, options) {
  return prettierx.getFileInfo(filePath, getOptions(options))
}

function formatWithCursor (source, options) {
  return prettierx.formatWithCursor(source, getOptions(options))
}

function run (cwd, config) {
  const onProcessed = config.onProcessed || function () {}

  const patterns = [
    config.pattern,
    '!**/node_modules/**',
    '!./node_modules/**',
    '!**/.{git,svn,hg}/**',
    '!./.{git,svn,hg}/**'
  ]

  let filePaths
  try {
    filePaths = globby
      .sync(patterns, { dot: true, nodir: true })
      .map(filePath => path.relative(process.cwd(), filePath))
  } catch (error) {
    console.error(`Unable to expand glob pattern: ${error.message}`)
  }

  const ignorer = createIgnorer(cwd)

  const files = filePaths.filter(isSupportedExtension).filter(ignorer)

  for (const relative of files) {
    const start = Date.now()

    const file = path.join(cwd, relative)
    const input = fs.readFileSync(file, 'utf8')

    const fileOptions = Object.assign({},
      prettierx.resolveConfig.sync(file, {
        editorconfig: true
      }),
      config.options
    )

    if (config.check) {
      const formatted = check(input, fileOptions)

      onProcessed({
        file: relative,
        runtime: Date.now() - start,
        formatted,
        check: config.check
      })
      continue
    }

    const output = format(input, fileOptions)

    const formatted = output === input

    if (!formatted) {
      fs.writeFileSync(file, output)
    }

    onProcessed({
      file: relative,
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
