module.exports = jest.fn(function mockGlob(globString, options, callback) {
  /* eslint complexity:0 */
  if (globString.includes('1')) {
    callback(null, [
      fredProject('index.js'),
      fredProject('start.js'),
      fredProject('stop/index.js'),
      fredProject('stop/log.js'),
    ])
  } else if (globString.includes('2')) {
    callback(null, [
      fredProject('index.js'),
      fredProject('start.js'),
      fredProject('continue/index.js'),
      fredProject('continue/forever.js'),
    ])
  } else if (globString.includes('node_modules')) {
    callback(null, [
      fredProject('foo/node_modules/stuff1.js'),
      fredProject('foo/node_modules/stuff2.js'),
      fredProject('foo/node_modules/stuff3.js'),
    ])
  } else if (globString.includes('files-with-syntax-errors')) {
    callback(null, [
      fredProject('syntax-error1.js'),
      fredProject('syntax-error2.js'),
    ])
  } else if (globString.includes('no-match')) {
    callback(null, [])
  } else if (globString.includes('throw-error')) {
    callback(new Error('something weird happened'))
  } else if (globString.includes('no-change')) {
    callback(null, [
      fredProject('no-change/1.js'),
      fredProject('no-change/2.js'),
      fredProject('no-change/3.js'),
    ])
  } else if (globString.includes('ignored')) {
    callback(null, [
      fredProject('ignored1.js'),
      fredProject('ignored2.js'),
      fredProject('ignored3.js'),
      fredProject('applied4.js'),
    ])
  } else {
    throw new Error(
      `Your test globString: "${globString}"` +
        ` doesn't have associated mock data.`,
    )
  }
})

function fredProject(path) {
  return `/Users/fredFlintstone/Developer/top-secret/footless-carriage/${path}`
}
