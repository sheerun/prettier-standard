/* eslint no-console:0 */
import fs from 'fs'
import glob from 'glob'
import Rx from 'rxjs/Rx'
import format from 'prettier-eslint'
import chalk from 'chalk'
import getStdin from 'get-stdin'

const rxGlob = Rx.Observable.bindNodeCallback(glob)
const rxReadFile = Rx.Observable.bindNodeCallback(fs.readFile)
const rxWriteFile = Rx.Observable.bindNodeCallback(fs.writeFile)

export default formatFilesFromArgv

async function formatFilesFromArgv(
  {
    _: fileGlobs,
    log: enableLog,
    sillyLogs,
    stdin,
    write,
    eslintPath,
    prettierPath,
  },
) {
  const prettierESLintOptions = {
    disableLog: !enableLog,
    sillyLogs,
    eslintPath,
    prettierPath,
  }
  const cliOptions = {write}
  if (stdin) {
    return formatStdin(prettierESLintOptions)
  } else {
    return formatFilesFromGlobs(fileGlobs, cliOptions, prettierESLintOptions)
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
    return Promise.resolve(stdinValue)
  }
}

async function formatFilesFromGlobs(
  fileGlobs,
  cliOptions,
  prettierESLintOptions,
) {
  const concurrentGlobs = 3
  const concurrentFormats = 10
  return new Promise(resolve => {
    const successes = []
    const failures = []
    Rx.Observable
      .from(fileGlobs)
      .mergeMap(getFilesFromGlob, null, concurrentGlobs)
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
      } else {
        successes.push(info)
      }
    }

    function onError(error) {
      logError(
        'There was an unhandled error while formatting the files',
        error.stack,
      )
      resolve({error, successes, failures})
    }

    function onComplete() {
      if (successes.length) {
        const count = chalk.bold(successes.length)
        const success = chalk.green('success')
        console.log(
          `${success} formatting ${count} files with prettier-eslint`,
        )
      }
      if (failures.length) {
        const count = chalk.bold(failures.length)
        const failure = chalk.red('failure')
        console.log(
          `${failure} formatting ${count} files with prettier-eslint`,
        )
      }
      resolve({successes, failures})
    }
  })
}

function getFilesFromGlob(fileGlob) {
  const globOptions = {ignore: []}
  if (!fileGlob.includes('node_modules')) {
    // basically, we're going to protect you from doing something
    // not smart unless you explicitly include it in your glob
    globOptions.ignore.push('**/node_modules/**')
  }
  return rxGlob(fileGlob, globOptions)
}

function formatFile(filePath, prettierESLintOptions, cliOptions) {
  const fileInfo = {filePath}
  let format$ = rxReadFile(filePath, 'utf8').map(text => {
    fileInfo.text = text
    fileInfo.formatted = format({text, filePath, ...prettierESLintOptions})
    return fileInfo
  })

  if (cliOptions.write) {
    format$ = format$.mergeMap(
      info => rxWriteFile(filePath, info.formatted).map(() => fileInfo),
    )
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

function logError(...args) {
  console.error('prettier-eslint-cli error:', ...args)
}
