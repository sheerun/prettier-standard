import path from 'path';
import findUp from 'find-up';
import yargs from 'yargs';
import {oneLine} from 'common-tags';
import arrify from 'arrify';

const parser = yargs
  .usage('Usage: $0 <globs>... [--option-1 option-1-value --option-2]')
  .help('h')
  .alias('h', 'help')
  .version()
  .options({
    stdin: {default: false, describe: 'Read input via stdin', type: 'boolean'},
    eslintPath: {
      default: getPathInHostNodeModules('eslint'),
      describe: 'The path to the eslint module to use',
      coerce: coercePath,
    },
    prettierPath: {
      describe: 'The path to the prettier module to use',
      default: getPathInHostNodeModules('prettier'),
      coerce: coercePath,
    },
    ignore: {
      describe: oneLine`
          pattern(s) you wish to ignore
          (can be used multiple times
          and includes **/node_modules/** automatically)
        `,
      coerce: arrify,
    },
    'log-level': {
      describe: 'The log level to use',
      choices: ['silent', 'error', 'warn', 'info', 'debug', 'trace'],
      alias: 'l',
      default: 'warn',
    },
  })
  .strict();

export default parser;

function getPathInHostNodeModules(module) {
  const modulePath = findUp.sync(`node_modules/${module}`);
  if (modulePath) {
    return modulePath;
  } else {
    return path.resolve(__dirname, `../node_modules/${module}`);
  }
}

function coercePath(input) {
  return path.isAbsolute(input) ? input : path.join(process.cwd(), input);
}
