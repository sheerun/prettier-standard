/* global jasmine */
/* eslint no-console:0 */
import path from 'path'
import fs from 'fs'
import spawn from 'spawn-command'
import pify from 'pify'
import stripIndent from 'strip-indent'

const pWriteFile = pify(fs.writeFile)
const pReadFile = pify(fs.readFile)
const pUnlink = pify(fs.unlink)

// this is a bit of a long running test...
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000

const PRETTIER_ESLINT_PATH = require.resolve('../../src/index')
const BABEL_BIN_PATH = require.resolve('babel-cli/bin/babel-node')

testOutput('--version')

test('help outputs usage information and flags', async () => {
  // can't just do the testOutput function here because
  // the output is variable (based on the width of your
  // terminal I think)...
  const stdout = await runPrettierESLintCLI('--help')
  expect(stdout).toMatch(/Usage:.*?<globs>.../)
  expect(stdout).toContain('Options:\n')
  // just a sanity check.
  // If it's ever longer than 2000 then we've probably got a problem...
  if (stdout.length > 1600) {
    console.error(stdout)
    throw new Error(
      'We probably have a problem. The --help output is probably too long...',
    )
  }
})

test('formats files and outputs to stdout', async () => {
  // can't just do the testOutput function here because
  // the output is in an undeterministic order
  const stdout = await runPrettierESLintCLI('cli-test/fixtures/stdout*.js')
  expect(stdout).toContain(
    stripIndent(
      `
        import baz, {stuff} from 'fdjakfdlfw-baz'
        
        export {bazzy}
        
        function bazzy(something) {
          return baz(stuff(something))
        }
      `,
    ).trim(),
  )
  expect(stdout).toContain(
    stripIndent(
      `
        export default foo
        
        function foo(thing) {
          return thing
        }
      `,
    ).trim(),
  )
})

test('accepts stdin of code', async () => {
  const stdin = 'echo "console.log(   window.baz , typeof [] );  "'
  const stdout = await runPrettierESLintCLI('--stdin', stdin)
  expect(stdout).toEqual('console.log(window.baz, typeof [])\n\n')
})

const writeCommand = 'cli-test/fixtures/example*.js --write'

test(`prettier-eslint ${writeCommand}`, async () => {
  // because we're using --write,
  // we have to recreate and delete the files every time
  const example1Path = path.resolve(__dirname, '../fixtures/example1.js')
  const example2Path = path.resolve(__dirname, '../fixtures/example2.js')
  const example1 = `const {  example1  }  =  baz.bar`
  const example2 = `function example2(thing){return thing;};;;;;;;;;`
  await Promise.all([
    pWriteFile(example1Path, example1),
    pWriteFile(example2Path, example2),
  ])
  const stdout = await runPrettierESLintCLI(writeCommand)
  expect(stdout).toMatchSnapshot(`stdout: prettier-eslint ${writeCommand}`)
  const [example1Result, example2Result] = await Promise.all([
    pReadFile(example1Path, 'utf8'),
    pReadFile(example2Path, 'utf8'),
  ])
  expect({
    example1Result,
    example2Result,
  }).toMatchSnapshot(`file contents: prettier-eslint ${writeCommand}`)
  await Promise.all([pUnlink(example1Path), pUnlink(example2Path)])
})

function testOutput(command) {
  test(`prettier-eslint ${command}`, async () => {
    try {
      const stdout = await runPrettierESLintCLI(command)
      expect(stdout).toMatchSnapshot(`stdout: ${command}`)
    } catch (stderr) {
      expect(stderr).toMatchSnapshot(`stderr: ${command}`)
    }
  })
}

function runPrettierESLintCLI(args = '', stdin = '') {
  const cwd = process.cwd()
  if (stdin) {
    stdin = `${stdin} |`
  }

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const command = `${PRETTIER_ESLINT_PATH} ${args}`
    const babelCommand = `${stdin}${BABEL_BIN_PATH} -- ${command}`
    const child = spawn(babelCommand, {cwd})

    child.on('error', error => {
      reject(error)
    })

    child.stdout.on('data', data => {
      stdout += data.toString()
    })

    child.stderr.on('data', data => {
      stderr += data.toString()
    })

    child.on('close', () => {
      if (stderr) {
        reject(relativeizePath(stderr))
      } else {
        resolve(relativeizePath(stdout))
      }
    })
  })
}

function relativeizePath(stringWithAbsolutePaths) {
  return stringWithAbsolutePaths.replace(
    new RegExp(path.resolve(__dirname, '../../'), 'g'),
    '<projectRootDir>',
  )
}
