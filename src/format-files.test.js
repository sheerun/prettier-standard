/* eslint no-console:0 */
import fsMock from 'fs'
import formatMock from 'prettier-eslint'
import globMock from 'glob'
import mockGetStdin from 'get-stdin'
import formatFiles from './format-files'

jest.mock('fs')

beforeEach(() => {
  console.log = jest.fn()
  console.error = jest.fn()
  formatMock.mockClear()
  fsMock.writeFile.mockClear()
})

test('sanity test', async () => {
  const globs = ['src/**/1*.js', 'src/**/2*.js']
  await formatFiles({_: globs})
  expect(globMock).toHaveBeenCalledTimes(globs.length)
  expect(fsMock.readFile).toHaveBeenCalledTimes(6)
  expect(formatMock).toHaveBeenCalledTimes(6)
  expect(fsMock.writeFile).toHaveBeenCalledTimes(0)
  expect(console.log).toHaveBeenCalledTimes(7)
  const mockOutput = expect.stringMatching(/MOCK_OUTPUT.*index.js/)
  const successOutput = expect.stringMatching(/success.*6.*files/)
  expect(console.log).toHaveBeenCalledWith(mockOutput)
  expect(console.log).toHaveBeenCalledWith(successOutput)
})

test('glob call inclues an ignore of node_modules', async () => {
  const fileGlob = 'src/**/1*.js'
  await formatFiles({_: [fileGlob]})
  const globOptions = expect.objectContaining({
    ignore: expect.arrayContaining(['**/node_modules/**']),
  })
  const callback = expect.any(Function)
  expect(globMock).toHaveBeenCalledWith(fileGlob, globOptions, callback)
})

test('glob call excludes an ignore of node_modules', async () => {
  const fileGlob = 'foo/node_modules/stuff*.js'
  await formatFiles({_: [fileGlob]})
  expect(globMock).not.toHaveBeenCalledWith(
    expect.any,
    expect.objectContaining({
      // should not have an ignore with **/node_modules/**
      ignore: expect.arrayContaining(['**/node_modules/**']),
    }),
    expect.any,
  )
})

test('should accept stdin', async () => {
  mockGetStdin.stdin = '  var [ foo, {  bar } ] = window.APP ;'
  await formatFiles({stdin: true})
  expect(formatMock).toHaveBeenCalledTimes(1)
  expect(formatMock).toHaveBeenCalledWith(
    expect.objectContaining({
      // the trim is part of the test
      text: mockGetStdin.stdin.trim(),
    }),
  )
  expect(console.log).toHaveBeenCalledTimes(1)
  expect(console.log).toHaveBeenCalledWith('MOCK_OUTPUT for stdin')
})

test('will write to files if that is specified', async () => {
  const fileGlob = 'src/**/1*.js'
  await formatFiles({_: [fileGlob], write: true})
  expect(fsMock.writeFile).toHaveBeenCalledTimes(4)
})

test('handles stdin errors gracefully', async () => {
  mockGetStdin.stdin = 'MOCK_SYNTAX_ERROR'
  await formatFiles({stdin: true})
  expect(console.error).toHaveBeenCalledTimes(1)
})

test('handles file errors gracefully', async () => {
  const globs = ['files-with-syntax-errors/*.js', 'src/**/1*.js']
  await formatFiles({_: globs, write: true})
  expect(fsMock.writeFile).toHaveBeenCalledTimes(4)
  expect(console.log).toHaveBeenCalledTimes(2)
  const successOutput = expect.stringMatching(/success.*4.*files/)
  const failureOutput = expect.stringMatching(/failure.*2.*files/)
  expect(console.log).toHaveBeenCalledWith(successOutput)
  expect(console.log).toHaveBeenCalledWith(failureOutput)
})

test('does not print success if there were no successful files', async () => {
  await formatFiles({_: ['no-match/*.js']})
  const successOutput = expect.stringMatching(/unhandled error/)
  expect(console.log).not.toHaveBeenCalledWith(successOutput)
})

test('fails gracefully if something odd happens', async () => {
  await formatFiles({_: ['throw-error/*.js']})
  expect(console.error).toHaveBeenCalledTimes(1)
  const label = expect.stringMatching(/prettier-eslint-cli/)
  const notice = expect.stringMatching(/unhandled error/)
  const errorStack = expect.stringMatching(/something weird happened/)
  expect(console.error).toHaveBeenCalledWith(label, notice, errorStack)
})

test('forwards sillyLogs onto prettier-eslint', async () => {
  await formatFiles({_: ['src/**/1*.js'], sillyLogs: true})
  const options = expect.objectContaining({sillyLogs: true})
  expect(formatMock).toHaveBeenCalledWith(options)
})
