// This is the mock that will be used in tests
// Jest sets this up automatically http://facebook.github.io/jest/docs/manual-mocks.html
// so we just return some spies here and assert that we're calling prettier-eslint APIs correctly
const actualPrettierEslint = require.requireActual('prettier-eslint')

module.exports = {
  ...actualPrettierEslint,
  // evertying after this line ☝️ will override properties actualPrettierEslint
  // so we can provide our mock versions
  format: jest.fn(() => 'MOCK_FORMAT_OUTPUT'),
}
