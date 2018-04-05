/* eslint no-console:0 */
const fsMock = require('fs')
const findUpMock = require('find-up')
const formatMock = require('prettier-eslint')
const globMock = require('glob')
const mockGetStdin = require('get-stdin')
const formatFiles = require('./format-files')

jest.mock('fs')

jest.mock(
  '/node_modules/eslint',
  () => ({
    linter: {
      getRules () {
        return []
      }
    }
  }),
  { virtual: true }
)

beforeEach(() => {
  process.stdout.write = jest.fn()
  console.error = jest.fn()
  formatMock.mockClear()
  fsMock.writeFile.mockClear()
  fsMock.readFile.mockClear()
})

test('sanity test', async () => {
  const globs = ['src/**/1*.js', 'src/**/2*.js']
  await formatFiles(globs)
  expect(globMock).toHaveBeenCalledTimes(globs.length)
  expect(fsMock.readFile).toHaveBeenCalledTimes(6)
  expect(formatMock).toHaveBeenCalledTimes(6)
  expect(fsMock.writeFile).toHaveBeenCalledTimes(6)
  expect(console.error).toHaveBeenCalledTimes(1)
  const successOutput = expect.stringMatching(/success.*6.*files/)
  expect(console.error).toHaveBeenCalledWith(successOutput)
})

test('glob call inclues an ignore of node_modules', async () => {
  const fileGlob = 'src/**/1*.js'
  await formatFiles([fileGlob])
  const globOptions = expect.objectContaining({
    ignore: expect.arrayContaining(['**/node_modules/**'])
  })
  const callback = expect.any(Function)
  expect(globMock).toHaveBeenCalledWith(fileGlob, globOptions, callback)
})

test('glob call excludes an ignore of node_modules', async () => {
  const fileGlob = 'foo/node_modules/stuff*.js'
  await formatFiles([fileGlob])
  expect(globMock).not.toHaveBeenCalledWith(
    expect.any,
    expect.objectContaining({
      // should not have an ignore with **/node_modules/**
      ignore: expect.arrayContaining(['**/node_modules/**'])
    }),
    expect.any
  )
})

test('should accept stdin', async () => {
  mockGetStdin.stdin = '  var [ foo, {  bar } ] = window.APP ;'
  await formatFiles([], { stdin: true })
  expect(formatMock).toHaveBeenCalledTimes(1)
  // the trim is part of the test
  const text = mockGetStdin.stdin.trim()
  expect(formatMock).toHaveBeenCalledWith(expect.objectContaining({ text }))
  expect(process.stdout.write).toHaveBeenCalledTimes(1)
  expect(process.stdout.write).toHaveBeenCalledWith('MOCK_OUTPUT for stdin')
})

test('will write to files if that is specified', async () => {
  const fileGlob = 'src/**/1*.js'
  await formatFiles([fileGlob], { write: true })
  expect(fsMock.writeFile).toHaveBeenCalledTimes(4)
})

test('handles stdin errors gracefully', async () => {
  mockGetStdin.stdin = 'MOCK_SYNTAX_ERROR'
  await formatFiles([], { stdin: true })
  expect(console.error).toHaveBeenCalledTimes(1)
})

test('handles file errors gracefully', async () => {
  const globs = ['files-with-syntax-errors/*.js', 'src/**/1*.js']
  await formatFiles(globs, { write: true })
  expect(fsMock.writeFile).toHaveBeenCalledTimes(4)
  expect(console.error).toHaveBeenCalledTimes(4)
  const successOutput = expect.stringMatching(/success.*4.*files/)
  const failureOutput = expect.stringMatching(/failure.*2.*files/)
  expect(console.error).toHaveBeenCalledWith(successOutput)
  expect(console.error).toHaveBeenCalledWith(failureOutput)
})

test('does not print success if there were no successful files', async () => {
  await formatFiles(['no-match/*.js'])
  const successOutput = expect.stringMatching(/unhandled error/)
  expect(console.error).not.toHaveBeenCalledWith(successOutput)
})

test('fails gracefully if something odd happens', async () => {
  await formatFiles(['throw-error/*.js'])
  expect(console.error).toHaveBeenCalledTimes(1)
  const label = expect.stringMatching(/prettier-standard/)
  const notice = expect.stringMatching(/unhandled error/)
  const errorStack = expect.stringMatching(/something weird happened/)
  expect(console.error).toHaveBeenCalledWith(label, notice, errorStack)
})

test('logs errors to the console if something goes wrong', async () => {
  const globs = ['eslint-config-error/*.js', 'src/**/2*.js']
  await formatFiles(globs, { write: true })
  expect(fsMock.writeFile).toHaveBeenCalledTimes(4)
  expect(console.error).toHaveBeenCalledTimes(4)
  const successOutput = expect.stringMatching(/success.*4.*files/)
  const failureOutput = expect.stringMatching(/failure.*2.*files/)
  expect(console.error).toHaveBeenCalledWith(successOutput)
  expect(console.error).toHaveBeenCalledWith(failureOutput)
  const errorPrefix = expect.stringMatching(/prettier-standard.*ERROR/)
  const cliError = expect.stringContaining('eslint-config-error')
  const errorOutput = expect.stringContaining('Some weird eslint config error')
  expect(console.error).toHaveBeenCalledTimes(4)
  expect(console.error).toHaveBeenCalledWith(errorPrefix, cliError, errorOutput)
})

test('forwards logLevel onto prettier-eslint', async () => {
  await formatFiles(['src/**/1*.js'], { logLevel: 'debug' })
  const options = expect.objectContaining({ logLevel: 'debug' })
  expect(formatMock).toHaveBeenCalledWith(options)
})

test('wont save file if contents did not change', async () => {
  const fileGlob = 'no-change/*.js'
  await formatFiles([fileGlob], { write: true })
  expect(fsMock.readFile).toHaveBeenCalledTimes(3)
  expect(fsMock.writeFile).toHaveBeenCalledTimes(0)
  const unchangedOutput = expect.stringMatching(/3.*?files.*?unchanged/)
  expect(console.error).toHaveBeenCalledWith(unchangedOutput)
})

test('allows you to specify an ignore glob', async () => {
  const ignore = ['src/ignore/thing', 'src/ignore/otherthing']
  const fileGlob = 'src/**/1*.js'
  await formatFiles([fileGlob], { ignore })

  ignore.push('**/node_modules/**')
  const globOptions = expect.objectContaining({
    ignore
  })
  const callback = expect.any(Function)
  expect(globMock).toHaveBeenCalledWith(fileGlob, globOptions, callback)
})

test('wont modify a file if it is eslint ignored', async () => {
  await formatFiles(['src/**/ignored*.js'], { write: true })
  expect(fsMock.readFile).toHaveBeenCalledTimes(1)
  expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
  expect(fsMock.readFile).toHaveBeenCalledWith(
    expect.stringMatching(/applied/),
    'utf8',
    expect.any(Function)
  )
  expect(fsMock.writeFile).toHaveBeenCalledWith(
    expect.stringMatching(/applied/),
    expect.stringMatching(/MOCK_OUTPUT.*?applied/),
    expect.any(Function)
  )
  const ignoredOutput = expect.stringMatching(/success.*1.*file/)
  expect(console.error).toHaveBeenCalledWith(ignoredOutput)
})

test('will modify a file if it is eslint ignored with noIgnore', async () => {
  await formatFiles(['src/**/ignored*.js'], {
    write: true,
    eslintIgnore: false
  })
  expect(fsMock.readFile).toHaveBeenCalledTimes(4)
  expect(fsMock.writeFile).toHaveBeenCalledTimes(4)
  const ignoredOutput = expect.stringMatching(/success.*4.*files/)
  expect(console.error).toHaveBeenCalledWith(ignoredOutput)
})

test('will not blow up if an .eslintignore cannot be found', async () => {
  const originalSync = findUpMock.sync
  findUpMock.sync = () => ''
  try {
    await formatFiles(['src/**/no-eslint-ignore/*.js'], {
      write: true
    })
  } catch (error) {
    throw error
  } finally {
    findUpMock.sync = originalSync
  }
})
