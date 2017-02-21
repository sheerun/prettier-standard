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
import * as messages from './messages'

const LINE_SEPERATOR_REGEX = /(\r|\n|\r\n)/
const rxGlob = Rx.Observable.bindNodeCallback(glob)
const rxReadFile = Rx.Observable.bindNodeCallback(fs.readFile)
const rxWriteFile = Rx.Observable.bindNodeCallback(fs.writeFile)
const findUpSyncMemoized = memoize(findUpSync, function resolver(...args) {
  return args.join('::')
})
const getIsIgnoredMemoized = memoize(getIsIgnored)

export default formatFilesFromArgv

async function formatFilesFromArgv(
  {
    _: fileGlobs,
    logLevel,
    stdin,
    write,
    eslintPath,
    prettierPath,
    ignore: ignoreGlobs = [],
    eslintIgnore: applyEslintIgnore = true,
  },
) {
  const prettierESLintOptions = {logLevel, eslintPath, prettierPath}
  const cliOptions = {write}
  if (stdin) {
    return formatStdin(prettierESLintOptions)
  } else {
    return formatFilesFromGlobs(
      fileGlobs,
      [...ignoreGlobs], // make a copy to avoid manipulation
      cliOptions,
      prettierESLintOptions,
      applyEslintIgnore,
    )
  }
}

async function formatStdin(prettierESLintOptions) {
  const stdinValue = (await getStdin()).trim()
  try {
    const formatted = format({text: stdinValue, ...prettierESLintOptions})
    console.log(formatted)
    return Promise.resolve(formatted)
  } catch (error) {
    logError(
      'There was a problem trying to format the stdin text',
      error.stack,
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
      logError(
        'There was an unhandled error while formatting the files',
        error.stack,
      )
      process.exitCode = 1
      resolve({error, successes, failures})
    }

    function onComplete() {
      if (successes.length) {
        console.log(
          messages.success({
            success: chalk.green('success'),
            count: successes.length,
            countString: chalk.bold(successes.length),
          }),
        )
      }
      if (failures.length) {
        process.exitCode = 1
        console.log(
          messages.failure({
            failure: chalk.red('failure'),
            count: failures.length,
            countString: chalk.bold(failures.length),
          }),
        )
      }
      if (unchanged.length) {
        console.log(
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
      return applyEslintIgnore ?
        !isFilePathMatchedByEslintignore(filePath) :
        true
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
      console.log(info.formatted)
      return info
    })
  }

  return format$.catch(error => {
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

function logError(...args) {
  console.error('prettier-eslint-cli error:', ...args)
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
