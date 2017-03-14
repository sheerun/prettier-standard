/* eslint no-console:0 */
import path from 'path'
import fs from 'fs'
import glob from 'glob'
import Rx from 'rxjs/Rx'
import format from 'prettier-eslint'
import chalk from 'chalk'
import getStdin from 'get-stdin'
import nodeIgnore from 'ignore'
import findUp from 'find-up'
import memoize from 'lodash.memoize'
import indentString from 'indent-string'
import getLogger from 'loglevel-colored-level-prefix'
import * as messages from './messages'

const LINE_SEPERATOR_REGEX = /(\r|\n|\r\n)/
const rxGlob = Rx.Observable.bindNodeCallback(glob)
const rxReadFile = Rx.Observable.bindNodeCallback(fs.readFile)
const rxWriteFile = Rx.Observable.bindNodeCallback(fs.writeFile)
const findUpSyncMemoized = memoize(findUpSync, function resolver(...args) {
  return args.join('::')
})
const getIsIgnoredMemoized = memoize(getIsIgnored)

const logger = getLogger({prefix: 'prettier-standard'})

function getPathInHostNodeModules(module) {
  const modulePath = findUp.sync(`node_modules/${module}`)
  if (modulePath) {
    return modulePath
  } else {
    return path.resolve(__dirname, `../node_modules/${module}`)
  }
}

function coercePath(input) {
  return path.isAbsolute(input) ? input : path.join(process.cwd(), input)
}

async function formatFilesFromArgv(
  fileGlobs,
  {
    logLevel = logger.getLevel(),
    eslintPath = getPathInHostNodeModules('eslint'),
    prettierPath = getPathInHostNodeModules('prettier'),
    ignore: ignoreGlobs = [],
    eslintIgnore: applyEslintIgnore = true,
  } = {},
) {
  logger.setLevel(logLevel)
  const prettierESLintOptions = {
    logLevel,
    eslintPath,
    prettierPath,
    eslintConfig: {
      parserOptions: {
        ecmaVersion: 8,
        ecmaFeatures: {
          experimentalObjectRestSpread: true,
          jsx: true,
        },
        sourceType: 'module',
      },
      rules: {
        semi: ['error', 'never'],
        quotes: [
          'error',
          'single',
          {avoidEscape: true, allowTemplateLiterals: true},
        ],
      },
    },
  }

  if (fileGlobs.length > 0) {
    return formatFilesFromGlobs(
      fileGlobs,
      [...ignoreGlobs], // make a copy to avoid manipulation
      {write: true},
      prettierESLintOptions,
      applyEslintIgnore,
    )
  }

  return formatStdin(prettierESLintOptions)
}

async function formatStdin(prettierESLintOptions) {
  const stdinValue = (await getStdin()).trim()
  try {
    const formatted = format({text: stdinValue, ...prettierESLintOptions})
    process.stdout.write(formatted)
    return Promise.resolve(formatted)
  } catch (error) {
    logger.error(
      'There was a problem trying to format the stdin text',
      `\n${indentString(error.stack, 4)}`,
    )
    process.exitCode = 1
    return Promise.resolve(stdinValue)
  }
}

async function formatFilesFromGlobs(
  fileGlobs,
  ignoreGlobs,
  cliOptions,
  prettierESLintOptions,
  applyEslintIgnore,
) {
  const concurrentGlobs = 3
  const concurrentFormats = 10
  return new Promise(resolve => {
    const successes = []
    const failures = []
    const unchanged = []
    Rx.Observable
      .from(fileGlobs)
      .mergeMap(
        getFilesFromGlob.bind(null, ignoreGlobs, applyEslintIgnore),
        null,
        concurrentGlobs,
      )
      .concatAll()
      .distinct()
      .mergeMap(filePathToFormatted, null, concurrentFormats)
      .subscribe(onNext, onError, onComplete)

    function filePathToFormatted(filePath) {
      return formatFile(filePath, prettierESLintOptions, cliOptions)
    }

    function onNext(info) {
      if (info.error) {
        failures.push(info)
      } else if (info.unchanged) {
        unchanged.push(info)
      } else {
        successes.push(info)
      }
    }

    function onError(error) {
      logger.error(
        'There was an unhandled error while formatting the files',
        `\n${indentString(error.stack, 4)}`,
      )
      process.exitCode = 1
      resolve({error, successes, failures})
    }

    function onComplete() {
      if (successes.length) {
        console.error(
          messages.success({
            success: chalk.green('success'),
            count: successes.length,
            countString: chalk.bold(successes.length),
          }),
        )
      }
      if (failures.length) {
        process.exitCode = 1
        console.error(
          messages.failure({
            failure: chalk.red('failure'),
            count: failures.length,
            countString: chalk.bold(failures.length),
          }),
        )
      }
      if (unchanged.length) {
        console.error(
          messages.unchanged({
            unchanged: chalk.gray('unchanged'),
            count: unchanged.length,
            countString: chalk.bold(unchanged.length),
          }),
        )
      }
      resolve({successes, failures})
    }
  })
}

function getFilesFromGlob(ignoreGlobs, applyEslintIgnore, fileGlob) {
  const globOptions = {ignore: ignoreGlobs}
  if (!fileGlob.includes('node_modules')) {
    // basically, we're going to protect you from doing something
    // not smart unless you explicitly include it in your glob
    globOptions.ignore.push('**/node_modules/**')
  }
  return rxGlob(fileGlob, globOptions).map(filePaths => {
    return filePaths.filter(filePath => {
      return applyEslintIgnore
        ? !isFilePathMatchedByEslintignore(filePath)
        : true
    })
  })
}

function formatFile(filePath, prettierESLintOptions, cliOptions) {
  const fileInfo = {filePath}
  let format$ = rxReadFile(filePath, 'utf8').map(text => {
    fileInfo.text = text
    fileInfo.formatted = format({text, filePath, ...prettierESLintOptions})
    return fileInfo
  })

  if (cliOptions.write) {
    format$ = format$.mergeMap(info => {
      if (info.text === info.formatted) {
        return Rx.Observable.of(Object.assign(fileInfo, {unchanged: true}))
      } else {
        return rxWriteFile(filePath, info.formatted).map(() => fileInfo)
      }
    })
  } else {
    format$ = format$.map(info => {
      console.error(info.formatted)
      return info
    })
  }

  return format$.catch(error => {
    logger.error(
      `There was an error formatting "${fileInfo.filePath}":`,
      `\n${indentString(error.stack, 4)}`,
    )
    return Rx.Observable.of(Object.assign(fileInfo, {error}))
  })
}

function getNearestEslintignorePath(filePath) {
  const {dir} = path.parse(filePath)
  return findUpSyncMemoized('.eslintignore', dir)
}

function isFilePathMatchedByEslintignore(filePath) {
  const eslintignorePath = getNearestEslintignorePath(filePath)
  if (!eslintignorePath) {
    return false
  }

  const eslintignoreDir = path.parse(eslintignorePath).dir
  const filePathRelativeToEslintignoreDir = path.relative(
    eslintignoreDir,
    filePath,
  )
  const isIgnored = getIsIgnoredMemoized(eslintignorePath)
  return isIgnored(filePathRelativeToEslintignoreDir)
}

function findUpSync(filename, cwd) {
  return findUp.sync('.eslintignore', {cwd})
}

function getIsIgnored(filename) {
  const ignoreLines = fs
    .readFileSync(filename, 'utf8')
    .split(LINE_SEPERATOR_REGEX)
    .filter(line => Boolean(line.trim()))
  const instance = nodeIgnore()
  instance.add(ignoreLines)
  return instance.ignores.bind(instance)
}

export default formatFilesFromArgv
