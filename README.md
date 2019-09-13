# ![prettier-standard](https://i.imgur.com/F62GQUk.png)

[![Build Status][build-badge]][build] [![version][version-badge]][package] [![Modern Node](https://img.shields.io/badge/modern-node-9BB48F.svg)](https://github.com/sheerun/modern-node)

Formats with [prettier](https://github.com/prettier/prettier) and lint with [eslint](https://eslint.org/) preconfigured with [standard](https://github.com/standard/standard) rules (✿◠‿◠) 

You don't have to fix any whitespace warnings and waste time configuring eslint presets :relieved:

## Installation

```
yarn add --dev prettier-standard
```

> If you're using the [`npm`][npm]: `npm install --save-dev prettier-standard`.

> You can also install globally with `npm install -g prettier-standard`

## Usage

```
Prettier and standard brought together!

Usage
  $ prettier-standard [<glob>]

Options
  --format  Format all files
  --changed Format only changed files
  --lint    Lint code with eslint after formatting it
  --since   Format only changed files since given revision
  --check   Do not format, just check formatting
  --parser  Force parser to use for stdin (default: babel)
  --lines   Format only changed lines (warning: experimental!)

Examples
  $ prettier-standard --lint '**/*.{js,css}'
  $ prettier-standard --changed --lint
  $ prettier-standard --since master
  $ echo 'const {foo} = "bar";' | prettier-standard
  $ echo '.foo { color: "red"; }' | prettier-standard --parser css
```

Warning: `--changed` flag should be considered experimental as prettier has issues with range formatting:

- https://github.com/prettier/prettier/issues/4926
- https://github.com/prettier/prettier/issues/6428

## Usage

Typically you'll use this in your [npm scripts][npm scripts] (or [package scripts][package scripts]):

```json
{
  "scripts": {
    "format": "prettier-standard '**/*'"
  }
}
```

We also encourage to use [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged). You can configure it as follows:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "linters": {
      "**/*": ["prettier-standard", "git add"]
    }
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


### Ignoring Files

You can use `.prettierignore` file for ignoring any files to format, e.g:

```
dist
.next
**/*.ts
```

This package currently doesn't recognize `.eslintignore` file for linting and just uses `.prettierignore`.

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
