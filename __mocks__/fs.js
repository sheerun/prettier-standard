module.exports = {
  readFile: jest.fn((filePath, encoding, callback) => {
    callback(null, `console.log('this is a mock thing for file: ${filePath}')`)
  }),
  writeFile: jest.fn((filePath, contents, callback) => {
    callback(null)
  }),
}
