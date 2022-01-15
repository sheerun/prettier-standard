import { globbySync } from 'globby'
import path from 'path'
import fs from 'fs'
import prettierx from 'prettierx'
import lintStaged from 'lint-staged'
import {
  createIgnorer,
  isSupportedExtension,
  getOptions,
  getScm,
  getRanges,
  getPathInHostNodeModules,
  createMatcher,
  importDirectoryModule,
  normalizeEslint
} from './utils.js'

const DEFAULT_IGNORE = [
  '!**/*.min.js',
  '!**/{node_modules,coverage,vendor}/**',
  '!./{node_modules,coverage,vendor}/**',
  '!**/.{git,svn,hg}/**',
  '!./.{git,svn,hg}/**'
]

const LINT_REGEXP = /\.(js|mjs|cjs|jsx|ts|tsx)$/

const __dirname = new URL('./', import.meta.url).pathname

export function format (source, options) {
  return prettierx.format(source, getOptions(options))
}

export function check (source, options) {
  return prettierx.check(source, getOptions(options))
}

export function getFileInfo (filePath, options) {
  return prettierx.getFileInfo(filePath, options)
}

export function formatWithCursor (source, options) {
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

export async function run (cwd, config) {
  // Filepaths will be relative to this directory
  let root = cwd

  const scm = getScm(cwd)

  let patterns = config.patterns || []

  if (!Array.isArray(patterns)) {
    return new Error('patterns should be an array')
  }

  if (patterns.length === 0) {
    if (scm) {
      patterns.push('**/*')
    } else {
      return new Error(
        'Error: You must provide patterns to match outside of git repository'
      )
    }
  }

  const onStart = config.onStart || function () {}
  const onProcessed = config.onProcessed || function () {}

  // They ignore files relative to current directory
  const filters = [
    // Ignore unsupported extensions
    isSupportedExtension,
    // Ignore .prettierignore entries
    createIgnorer(cwd)
  ]

  const runFilters = path => filters.reduce((a, b) => a && b(path), true)

  let engine

  if (config.lint) {
    const eslintPath = getPathInHostNodeModules('eslint')
    const babelEslintPath = getPathInHostNodeModules('@babel/eslint-parser')

    const configs = {
      prettier: getPathInHostNodeModules('eslint-config-prettier'),
      standard: getPathInHostNodeModules('eslint-config-standard'),
      'standard-jsx': getPathInHostNodeModules('eslint-config-standard-jsx')
    }

    const getConfig = (config, file) => path.join(configs[config], file)

    const eslint = (await importDirectoryModule(eslintPath)).default
    const eslintOptions = {
      overrideConfig: {
        parser: babelEslintPath,
        parserOptions: {
          requireConfigFile: false,
          babelOptions: {
            presets: [getPathInHostNodeModules('@babel/preset-react')]
          }
        }
      },
      resolvePluginsRelativeTo: path.join(__dirname, 'vendor'),
      baseConfig: {
        plugins: ['jest'],
        env: {
          'jest/globals': true
        },
        extends: [
          getConfig('standard', 'index.js'),
          getConfig('standard-jsx', 'index.js'),
          getConfig('prettier', 'index.js')
        ]
      }
    }
    engine = normalizeEslint(eslint, eslintOptions)
  }

  onStart({ engine })

  let files

  if (config.changed || config.since || config.lines || config.staged) {
    if (!scm) {
      return new Error('No git repository detected...')
    }

    root = scm.dir

    // Ignore non-matched patterns
    filters.push(createMatcher(path.relative(root, cwd), config.patterns))

    const revision = scm.getRevision(config.since || 'HEAD')

    if (!revision) {
      return new Error(`Cannot find ${scm.name()} revision ${config.since}`)
    }

    files = scm.getChanges(revision).filter(p => runFilters(p.filepath))
  } else {
    patterns = patterns.concat(DEFAULT_IGNORE)

    let filePaths = []

    try {
      filePaths = globbySync(patterns, { dot: true, onlyFiles: true, cwd }).map(
        filePath => path.relative(process.cwd(), filePath)
      )
    } catch (error) {
      return new Error(`Unable to expand glob pattern: ${error.message}`)
    }

    files = filePaths.filter(runFilters).map(filepath => ({ filepath }))
  }

  if (config.staged) {
    const lintConfig = {}

    let command = 'node ' + path.join(__dirname, 'cli.js')

    if (config.lint) {
      command += ' --lint'
    }
    if (config.check) {
      command += ' --check'
    }
    if (config.lines) {
      command += ' --lines'
    }

    files.forEach(f => {
      const mask = '*' + path.extname(f.filepath)
      if (!lintConfig[mask]) {
        lintConfig[mask] = [command]
      }
    })

    if (Object.keys(lintConfig).length > 0) {
      if (config.lint) {
        console.log('Formatting and linting all staged files...')
      } else {
        console.log('Formatting all staged files...')
      }

      const success = await lintStaged(
        {
          config: lintConfig,
          shell: false,
          quiet: true,
          debug: false
        },
        {
          log: msg => console.log(msg),
          warn: msg => console.warn(msg),
          error: msg =>
            console.error(
              msg.replace(new RegExp(command, 'g'), 'prettier-standard').trim()
            )
        }
      )

      if (!success) {
        process.exit(1)
      }
    }

    return
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
        report = await engine.lintText(input, { filePath: fullpath })
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
      report = await engine.lintText(output, { filePath: fullpath })
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

export const resolveConfig = prettierx.resolveConfig
export const clearConfigCache = prettierx.clearConfigCache
export const getSupportInfo = prettierx.getSupportInfo
