module.exports = jest.fn(async function mockGetStdin() {
  return module.exports.stdin
})

module.exports.stdin = ''
