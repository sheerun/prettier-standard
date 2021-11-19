# ![prettier-standard](https://i.imgur.com/F62GQUk.png)

[![Build Status][build-badge]][build] [![version][version-badge]][package] [![Modern Node](https://img.shields.io/badge/modern-node-9BB48F.svg)](https://github.com/sheerun/modern-node)

Formats with [prettier](https://github.com/prettier/prettier) (actually [prettierx](https://github.com/brodybits/prettierx)) and lints with [eslint](https://eslint.org/) preconfigured with [standard](https://github.com/standard/standard) rules (✿◠‿◠)

You don't have to fix any whitespace errors and waste time configuring eslint presets :relieved:

## Installation

```
yarn add --dev prettier-standard
```

> If you're using the [`npm`][npm]: `npm install --save-dev prettier-standard`.

> You can also install globally with `npm install -g prettier-standard`

## Usage

Prettier-standard is best used with `prettier-standard --lint` command which formats and lints all non-ignored files in repository. Here's full usage:

```
Usage
  $ prettier-standard [<glob>]

Options
  --format  Just format all files in current repository
  --lint    Additionally lint code after formatting
  --check   Do not format, just check formatting
  --staged  Run only on staged files
  --changed Run only on changed files
  --since   Run only on changed files since given revision
  --lines   Run only on changed lines (warning: experimental!)
  --stdin   Force reading input from stdin
  --parser  Force parser to use for stdin (default: babel)
  --help    Tells how to use prettier-standard

Examples
  $ prettier-standard --changed --lint
  $ prettier-standard --lint '**/*.{js,css}'
  $ prettier-standard --since master
  $ "precommit": "prettier-standard --lint --staged" # in package.json
  $ echo 'const {foo} = "bar";' | prettier-standard --stdin
  $ echo '.foo { color: "red"; }' | prettier-standard --parser css
```

Warning: `--lines` flag should be considered experimental as prettier has issues with range formatting:

- https://github.com/prettier/prettier/issues/4926
- https://github.com/prettier/prettier/issues/6428

## Examples

Typically you'll use this in your [npm scripts][npm scripts] (or [package scripts][package scripts]):

```json
{
  "scripts": {
    "format": "prettier-standard --format"
  }
}
```

We also encourage to use [modern-node](https://github.com/sheerun/modern-node) and [lint-staged](https://github.com/okonet/lint-staged). You can configure it as follows:

```json
{
  "scripts": {
    "precommit": "lint-staged"
  },
  "lint-staged": {
    "*": ["prettier-standard --lint"]
  }
}
```

NOTE: Unlike [prettier](https://github.com/prettier/prettier) this package simplifies your workflow by making `--write` flag a default, and allowing for passing code to stdin without additional `--stdin` flag.

### Vim

It's probably best to use [ale](https://github.com/w0rp/ale) plugin. It supports multiple fixers, including prettier-standard:

```
Plug 'w0rp/ale'
let g:ale_fixers = {'javascript': ['prettier_standard']}
let g:ale_linters = {'javascript': ['']}
let g:ale_fix_on_save = 1
```

### Sublime Text 3

It's possible to use 'prettier-standard' with Sublime Text 3.

1. Install 'prettier-standard' globally according to the installation instructions above.
2. Find the location of your installed executable file.
   On a unix based system (like MacOS):

```curl
$ which prettier-standard
```

3. Copy the location. (e.g. `/usr/local/bin/prettier-standard`)
4. Install [SublimeJsPrettier](https://github.com/jonlabelle/SublimeJsPrettier) according to their installation instructions.
5. Open SublimeJsPrettier's default settings in Sublime and copy the line: `"prettier_cli_path": ""`
6. Open SublimeJsPrettier's user settings in Sublime and add the line with the correct location of the 'prettier-standard' executable.

```json
{
  "prettier_cli_path": "/usr/local/bin/prettier-standard"
}
```

You can now use 'prettier-standard' in Sublime Text 3 by opening the **Command Palette** (super + shift + p) and typing `JsPrettier: Format Code`.

## Customizing

You can use .prettierrc for overriding some options, e.g to use [semistandard](https://www.npmjs.com/package/semistandard):

```json
{
  "semi": true
}
```

You can also configure linting by creating appropriate [.eslintrc]() file that will override defaults:

```json
{
  "rules": {
    "eqeqeq": "off"
  }
}
```

Prettier-standard includes following packages so you don't need to install them in your repository:

- eslint
- @babel/core
- @babel/eslint-parser
- eslint-config-prettier
- eslint-config-standard
- eslint-config-standard-jsx
- eslint-config-standard-react
- eslint-config-standard-with-typescript
- eslint-plugin-import
- eslint-plugin-jest
- eslint-plugin-node
- eslint-plugin-promise
- eslint-plugin-react
- eslint-plugin-react-hooks
- eslint-plugin-standard
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser

### Ignoring Files

You can use `.prettierignore` file for ignoring any files to format, e.g:

```
dist
.next
**/*.ts
```

You can also use `.eslintignore` to format some files, but prevent linting others.

### API

prettier-standard exposes the same API as prettier: https://prettier.io/docs/en/api.html

It also exposes one additional method that works similarly to its CLI:

`run(cwd, config)`

- **cwd** - path where to execute prettier-standard
- **config** - object configuring execution
  - **patterns** - patterns to use for formatting files (array of strings)
  - **check** - whether to check instead of format files (boolean, default: false)
  - **lint** - whether to perform linting (boolean, default: false)
  - **changed** - whether to format only changed lines (boolean, experimental, default: false)
  - **since** - format changes that happened since given branch (string, optional, example: "master")
  - **onProcess** - callback that is called for each processed file matching pattern: { file, formatted, check, runtime }

## LICENSE

MIT

[yarn]: https://yarnpkg.com/
[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/travis/sheerun/prettier-standard.svg?style=flat-square
[build]: https://travis-ci.org/sheerun/prettier-standard
[coverage-badge]: https://img.shields.io/codecov/c/github/sheerun/prettier-standard.svg?style=flat-square
[coverage]: https://codecov.io/github/sheerun/prettier-standard
[dependencyci-badge]: https://dependencyci.com/github/sheerun/prettier-standard/badge?style=flat-square
[dependencyci]: https://dependencyci.com/github/sheerun/prettier-standard
[version-badge]: https://img.shields.io/npm/v/prettier-standard.svg?style=flat-square
[package]: https://www.npmjs.com/package/prettier-standard
[npm scripts]: https://docs.npmjs.com/misc/scripts
[package scripts]: https://github.com/kentcdodds/p-s
[glob]: https://github.com/isaacs/node-glob
