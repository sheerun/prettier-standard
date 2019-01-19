const findUp = require('find-up')

function getPathInHostNodeModules(module) {
  const modulePath = findUp.sync(`node_modules/${module}`)

  if (modulePath) {
    return modulePath
  }

  const result = findUp.sync(`node_modules/${module}`, { cwd: __dirname })

  return result
}

module.exports = {
  getPathInHostNodeModules
}
