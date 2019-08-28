#!/usr/bin/env node

const path = require('path')
const mri = require('mri')
const getStdin = require('get-stdin')
const { run, format, check } = require('./')
const chalk = require('chalk')

const cliHelp = `
Prettier and standard brought together!

Usage
  $ prettier-standard

Options
  --check   Do not format, just check formatting
  --changed Format only changed or added lines
  --parser  Force parser to use (default: babel)
            https://prettier.io/docs/en/options.html#parser

Examples
  $ prettier-standard
  $ prettier-standard '**/*.{js,css}'
  $ echo 'const {foo} = "bar";' | prettier-standard
  $ echo '.foo { color: "red"; }' | prettier-standard --parser css
`

function help () {
  console.log(cliHelp)
  process.exit(1)
}

async function main () {
  const flags = mri(process.argv.slice(2), {
    string: ['parser', 'branch', 'pattern', 'changed'],
    default: {
      check: false,
      staged: false,
      help: false,
      branch: null
    }
  })

  if (flags._ && flags._.length > 0) {
    flags.patterns = flags._
  }

  const stdin = await getStdin()

  if ('changed' in flags && !flags.changed) {
    console.error('--changed flag requires revision. Here are some examples:')
    console.error(
      '  $ prettier-standard --changed HEAD # all uncommited changes'
    )
    console.error(
      '  $ prettier-standard --changed master # all changes since master'
    )
    process.exit(1)
  }

  if ('changed' in flags && stdin) {
    console.error('--changed flag does not support stdin')
    process.exit(1)
  }

  if (flags.help || (!stdin && !flags.changed && flags._.length == 0)) {
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
      check: flags.check || false,
      changed: flags.changed || false,
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
    console.error(e)
    process.exit(2)
  }
)
