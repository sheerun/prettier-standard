#!/usr/bin/env node

const path = require('path')
const mri = require('mri')
const getStdin = require('get-stdin')
const { run, format, check } = require('./')
const chalk = require('chalk')

const cliHelp = `
Prettier and standard brought together!

Usage
  $ prettier-standard [<glob>]

Options
  --since   Format files changed singe given revision
  --changed Format only changed or added lines
  --check   Do not format, just check formatting
  --parser  Force parser to use (default: babel)

Examples
  $ prettier-standard '**/*.{js,css}'
  $ prettier-standard --since HEAD
  $ prettier-standard --changed
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
      changed: false,
      check: false,
      help: false
    }
  })

  if (flags._ && flags._.length > 0) {
    flags.patterns = flags._
  }

  const stdin = await getStdin()

  if ('changed' in flags && stdin) {
    console.error('--changed flag does not support stdin')
    process.exit(1)
  }

  if ('since' in flags && stdin) {
    console.error('--since flag does not support stdin')
    process.exit(1)
  }

  if (
    flags.help ||
    (!stdin && !flags.changed && !flags.since && flags._.length == 0)
  ) {
    help()
  }

  let allFormatted = true

  const options = {}

  if (flags.parser) {
    options.parser = flags.parser
  }

  if (stdin) {
    options.filepath = '(stdin)'

    if (flags.check) {
      const valid = check(stdin, options)
      if (!valid) {
        console.log('(stdin)')
        process.exit(1)
      }
    } else {
      const output = format(stdin, options)
      process.stdout.write(output)
    }
  } else {
    if (flags.check) {
      console.log('Checking formatting...')
    }

    const result = run(process.cwd(), {
      patterns: flags.patterns,
      check: flags.check,
      changed: flags.changed,
      since: flags.since,
      options,
      onProcessed: ({ file, formatted, check, runtime }) => {
        if (check) {
          if (!formatted) {
            console.log(file)
            allFormatted = false
          }
        } else {
          console.log(`${formatted ? chalk.grey(file) : file} ${runtime}ms`)
        }
      }
    })

    if (flags.check) {
      if (!allFormatted) {
        console.log('Code style issues found in the above file(s).')

        process.exit(1)
      } else {
        console.log('All matched files use Standard code style!')
      }
    }
  }
}

main().then(
  function () {},
  function (e) {
    if (process.env.DEBUG) {
      console.error(e)
    } else {
      console.error(e.message)
    }
    process.exit(2)
  }
)
