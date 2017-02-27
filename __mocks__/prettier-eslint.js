/* eslint complexity:0 */
// This is the mock that will be used in tests
// Jest sets this up automatically
// http://facebook.github.io/jest/docs/manual-mocks.html
// so we just return some spies here and assert
// that we're calling prettier-eslint APIs correctly
const format = jest.fn(({text, filePath = ''}) => {
  if (text === 'MOCK_SYNTAX_ERROR' || filePath.includes('syntax-error')) {
    throw new Error('Mock error for a syntax error')
  } else if (filePath.includes('eslint-config-error')) {
    throw new Error('Some weird eslint config error')
  } else if (filePath.includes('no-change')) {
    return text
  }
  return `MOCK_OUTPUT for ${filePath || 'stdin'}`
})

export default format
