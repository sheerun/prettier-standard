const fsMock = require('mock-fs')

let logsTemp = []
let logMock

module.exports = config => {
  logMock = jest.spyOn(console, 'log').mockImplementation((...args) => {
    logsTemp.push(args)
  })
  fsMock(config)
  return
}

module.exports.restore = () => {
  logMock.mockRestore()
  fsMock.restore()
  logsTemp.map(el => console.log(...el))
  logsTemp = []
}
