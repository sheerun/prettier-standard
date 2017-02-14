import path from 'path'
import findUp from 'find-up'
import yargs from 'yargs'

const parser = yargs
  .usage('Usage: $0 <globs>... [--option-1 option-1-value --option-2]')
  .help('h')
  .alias('h', 'help')
  .version()
  .options({
    write: {
      default: false,
      describe: 'Edit the file in-place (beware!)',
      type: 'boolean',
    },
    stdin: {default: false, describe: 'Read input via stdin', type: 'boolean'},
    eslintPath: {
      default: getPathInHostNodeModules('eslint'),
      describe: 'The path to the eslint module to use',
    },
    prettierPath: {describe: 'The path to the prettier module to use'},
    log: {default: false, describe: 'Show logs', type: 'boolean'},
    // TODO: if we allow people to to specify a config path,
    // we need to read that somehow. These can come invarious
    // formats and we'd have to work out `extends` somehow as well.
    // I don't know whether ESLint exposes a way to do this...
    // Contributions welcome!
    // eslintConfigPath: {
    //   describe: 'Path to the eslint config to use for eslint --fix',
    // },
    // TODO: would this be just a JSON file? There's never going to be
    // a `.prettierrc`: https://github.com/jlongster/prettier/issues/154
    // so we'll have to be careful how we do this (if we do it at all).
    // prettierOptions: {
    //   describe: 'Path to the prettier config to use',
    // },
    sillyLogs: {
      default: false,
      describe: 'Show silly amount of logs (good for debugging)',
      type: 'boolean',
    },
  })

export default parser

function getPathInHostNodeModules(module) {
  const modulePath = findUp.sync(`node_modules/${module}`)
  if (modulePath) {
    return modulePath
  } else {
    return path.relative(__dirname, `../node_modules/${module}`)
  }
}
