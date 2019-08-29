#!/usr/bin/env node

const mri = require('mri')
const getStdin = require('get-stdin')
const { run, format, check } = require('./')
const chalk = require('chalk')

const cliHelp = `
Prettier and standard brought together!

Usage
  $ prettier-standard [<glob>]

Options
  --format  Format all files
  --changed Format only changed files
  --lint    Lint code with eslint after formatting it
  --since   Format only changed files since given revision
  --check   Do not format, just check formatting
  --parser  Force parser to use for stdin (default: babel)
  --lines   Format only changed lines (warning: experimental!)

Examples
  $ prettier-standard --lint '**/*.{js,css}'
  $ prettier-standard --changed --lint
  $ prettier-standard --since master
  $ echo 'const {foo} = "bar";' | prettier-standard
  $ echo '.foo { color: "red"; }' | prettier-standard --parser css
`

function help () {
  console.log(cliHelp)
  process.exit(1)
}

async function main () {
  const flags = mri(process.argv.slice(2), {
    string: ['parser', 'since'],
    default: {
      format: false,
      lint: false,
      changed: false,
      lines: true,
      check: false,
      help: false
    }
  })

  if (flags._ && flags._.length > 0) {
    flags.patterns = flags._
  }

  const hasStdin = process.stdin.isTTY !== true

  if (flags.changed && hasStdin) {
    return new Error('--changed flag does not support stdin')
  }

  if (flags.since && hasStdin) {
    return new Error('--since flag does not support stdin')
  }

  if (
    flags.help ||
    (!hasStdin &&
      !flags.changed &&
      !flags.since &&
      !flags.lint &&
      !flags.format &&
      flags._.length === 0)
  ) {
    help()
  }

  const options = {}

  if (flags.parser) {
    options.parser = flags.parser
  }

  if (hasStdin) {
    const stdin = await getStdin()

    options.filepath = '(stdin)'

    if (flags.check) {
      try {
        const valid = check(stdin, options)
        if (!valid) {
          console.log('(stdin)')
          return 1
        }
      } catch (e) {
        if (e.message.match(/SyntaxError/)) {
          return e
        }
        throw e
      }
    } else {
      const output = format(stdin, options)
      process.stdout.write(output)
    }
  } else {
    let allStandard = true

    let results = []
    let engine

    const error = run(process.cwd(), {
      format: flags.format,
      patterns: flags.patterns,
      check: flags.check,
      changed: flags.changed,
      since: flags.since,
      lint: flags.lint,
      precise: flags.precise,
      options,
      onStart: params => {
        if (params.engine) {
          engine = params.engine
        }
      },
      onProcessed: ({ file, formatted, report, check, runtime }) => {
        if (check) {
          if (!formatted) {
            if (allStandard === true) {
              console.log('Code style issues found in following files:')
              allStandard = false
            }
            console.log(file)
          }
        } else {
          console.log(`${formatted ? chalk.grey(file) : file} ${runtime}ms`)
        }

        if (report) {
          results = results.concat(report.results)
        }
      }
    })

    if (error) {
      return error
    }

    if (engine && results.length > 0) {
      const formatter = engine.getFormatter()
      const output = formatter(results)
      if (output) {
        console.error(output)
      }
    } else {
      if ((flags.check || flags.lint) && allStandard) {
        console.log('All matched files use Standard code style!')
      }
    }
  }
}

main().then(
  function index (result) {
    if (typeof result === 'number') {
      process.exit(result)
    }

    if (result instanceof Error) {
      console.error(result.message)
      process.exit(2)
    }
  },
  function (error) {
    console.error(error)
    process.exit(2)
  }
)
