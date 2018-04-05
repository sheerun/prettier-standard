const MessageFormat = require('messageformat')

const mf = new MessageFormat('en')

function success (data) {
  const files = `{count, plural, one{file} other{files}}`
  return mf.compile(
    `{success} formatting {countString} ${files} with prettier-standard`
  )(data)
}

function failure (data) {
  const files = `{count, plural, one{file} other{files}}`
  return mf.compile(
    `{failure} formatting {countString} ${files} with prettier-standard`
  )(data)
}

function unchanged (data) {
  const files = `{count, plural, one{file was} other{files were}}`
  return mf.compile(`{countString} ${files} {unchanged}`)(data)
}

module.exports = {
  success,
  failure,
  unchanged
}
