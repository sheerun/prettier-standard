const readFile = jest.fn((filePath, encoding, callback) => {
  callback(null, `console.log('this is a mock thing for file: ${filePath}')`)
})
const writeFile = jest.fn((filePath, contents, callback) => {
  callback(null)
})

const readFileSync = jest.fn(filePath => {
  if (filePath.indexOf('eslintignore')) {
    return '*ignored*\n**/ignored/**\n'
  } else {
    throw new Error('readFileSync mock does nto yet handle ', filePath)
  }
})

module.exports = { readFile, writeFile, readFileSync }
