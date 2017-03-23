#!/usr/bin/env node

import meow from 'meow'
import formatFilesFromArgv from './format-files'

const cli = meow(
  `
  Usage
    $ prettier-standard [<glob>...]

  Options
    --log-level  Log level to use (default: warn)

  Examples
    $ prettier-standard 'src/**/*.js'
    $ echo "const {foo} = "bar";" | prettier-standard
 
`,
)

function help () {
  console.log(cli.help)
  process.exit(1)
}

async function main () {
  if (process.stdin.isTTY === true && cli.input.length < 1) {
    help()
  }

  return formatFilesFromArgv(cli.input, cli.flags)
}

main()
