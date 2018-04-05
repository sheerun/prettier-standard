#!/usr/bin/env node

const minimist = require('minimist')
const formatFilesFromArgv = require('./format-files')

const cliHelp = `
Usage
  $ prettier-standard [<glob>...]

Options
  --log-level  Log level to use (default: warn)

Examples
  $ prettier-standard 'src/**/*.js'
  $ echo "const {foo} = "bar";" | prettier-standard
`

const options = {}

function help () {
  console.log(cliHelp)
  process.exit(1)
}

async function main () {
  const flags = require('minimist')(process.argv.slice(2), options)
  const input = flags._

  if (process.stdin.isTTY === true && input.length < 1) {
    help()
  }

  return formatFilesFromArgv(input, flags)
}

main()
