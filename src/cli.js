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

async function main() {
  const flags = mri(process.argv.slice(2), {
    string: ['parser', 'branch', 'pattern'],
    default: {
      check: false,
      staged: false,
      help: false,
      branch: null
    }
  })

  if (flags._ && flags._.length > 0 && !flags.pattern) {
    flags.pattern = flags._[0]
  }

  const stdin = await getStdin()

  if (flags.parser) {
    config.parser = flags.parser
  }

  if (flags.help || (!stdin && flags._.length == 0)) {
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
      pattern: flags.pattern,
      check: flags.check || false,
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

main().then(function () {}, function (e) {
  console.error(e.message)
  process.exit(2)
})
