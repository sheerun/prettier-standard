// This is the mock that will be used in tests
// Jest sets this up automatically http://facebook.github.io/jest/docs/manual-mocks.html
// so we just return some spies here and assert that we're calling prettier-eslint APIs correctly
const format = jest.fn(({text, filePath = ''}) => {
  if (text === 'MOCK_SYNTAX_ERROR' || filePath.includes('syntax-error')) {
    throw new Error('Mock error for a syntax error')
  }
  return `MOCK_OUTPUT for ${filePath || 'stdin'}`
})

export default format
