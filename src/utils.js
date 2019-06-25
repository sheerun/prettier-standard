const findUp = require('find-up')

function getPathInHostNodeModules (module) {
  const modulePath = findUp.sync(`node_modules/${module}`, { type: 'directory' })

  if (modulePath) {
    return modulePath
  }
  console.log('nope')

  const result = findUp.sync(`node_modules/${module}`, { cwd: __dirname, type: 'directory' })

  return result
}

module.exports = {
  getPathInHostNodeModules
}
