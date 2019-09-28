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
  --lint    Additionally lint code after formatting
  --check   Do not format, just check formatting
  --staged  Run only on staged files
  --changed Run only on changed files
  --since   Run only on changed files since given revision
  --lines   Run only on changed lines (warning: experimental!)
  --stdin   Force reading input from stdin
  --parser  Force parser to use for stdin (default: babel)
  --help    Tells how to use prettier-standard

Examples
  $ prettier-standard --changed --lint
  $ prettier-standard --lint '**/*.{js,css}'
  $ prettier-standard --since master
  $ "precommit": "prettier-standard --lint --staged" # in package.json 
  $ echo 'const {foo} = "bar";' | prettier-standard --stdin
  $ echo '.foo { color: "red"; }' | prettier-standard --parser css
`

function help () {
  console.log(cliHelp)
  process.exit(1)
}

async function main () {
  const defaultFlags = {
    lint: false,
    changed: false,
    lines: false,
    check: false,
    staged: false,
    stdin: false,
    help: false
  }

  const flags = mri(process.argv.slice(2), {
    string: ['parser', 'since'],
    default: defaultFlags
  })

  if (flags._ && flags._.length > 0) {
    flags.patterns = flags._
  } else {
    flags.patterns = []
  }

  const hasStdin = flags.stdin || !!flags.parser

  if (hasStdin) {
    for (const key in defaultFlags) {
      if (key !== 'stdin' && key !== 'check' && flags[key]) {
        return new Error(`--${key} is not supported when --stdin is used`)
      }
    }

    if (flags._.length > 0) {
      return new Error(`Cannot provide patterns when --stdin is used`)
    }
  }

  if (flags.help) {
    help()
  }

  const options = {}

  if (flags.parser) {
    options.parser = flags.parser
  }

  if (hasStdin) {
    const stdin = await getStdin()

    options.filepath = '(stdin)'

    try {
      if (flags.check) {
        const valid = check(stdin, options)
        if (!valid) {
          console.log('(stdin)')
          return 1
        }
      } else {
        const output = format(stdin, options)
        process.stdout.write(output)
      }
    } catch (e) {
      if (e.message.match(/SyntaxError/)) {
        return e
      }
      throw e
    }
  } else {
    let allStandard = true

    let results = []
    let engine

    const error = await run(process.cwd(), {
      patterns: flags.patterns,
      check: flags.check,
      changed: flags.changed,
      since: flags.since,
      staged: flags.staged,
      lint: flags.lint,
      lines: flags.lines,
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

    const errorCount = results.map(r => r.errorCount).reduce((a, b) => a + b, 0)

    if (engine && errorCount > 0) {
      const formatter = engine.getFormatter()
      const output = formatter(results)
      if (output) {
        console.error(output)
      }
      allStandard = false
    } else {
      if ((flags.check || flags.lint) && allStandard) {
        console.log('All matched files use Standard code style!')
      }
    }

    if (allStandard === false) {
      process.exit(1)
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
