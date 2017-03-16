# (✿◠‿◠) prettier-standard [![Build Status][build-badge]][build] [![version][version-badge]][package] [![Modern Node](https://img.shields.io/badge/modern-node-9BB48F.svg)](https://github.com/sheerun/modern-node)

[prettier](https://github.com/prettier/prettier) and [standard](https://github.com/feross/standard) brought together

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
  $ prettier-standard [<glob>...]

Options
  --log-level  Log level to use (default: warn)

Examples
  $ prettier-standard 'src/**/*.js'
  $ echo "const {foo} = "bar";" | prettier-standard
```

Typically you'll use this in your [npm scripts][npm scripts] (or [package scripts][package scripts]):

```json
{
  "scripts": {
    "format": "prettier-standard \"src/**/*.js\""
  }
}
```

We also encourage to use [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged). You can configure it as follows:

```
{
  "lint-staged": {
    "linters": {
      "src/**/*.js": [
        "prettier-standard",
        "git add"
      ]
    }
  }
}
```

NOTE: Unlike [prettier](https://github.com/prettier/prettier) this package simplifies your workflow by making `--write` flag a default, and allowing for passing code to stdin without additional `--stdin` flag. Now **that's** prettier!

### Vim

Vim users can add the following to their .vimrc:

```
autocmd FileType javascript set formatprg=prettier-standard
```

This makes prettier-standard power the gq command for automatic formatting without any plugins. You can also add the following to your .vimrc to run prettier-standard when .js files are saved:

```
autocmd BufWritePre *.js :normal gggqG
```

## Related

- [prettier-standard](https://github.com/prettier/prettier) - the core package
- [prettier-eslint](https://github.com/prettier/prettier-eslint) - used for integrating with eslint
- [prettier-eslint-cli](https://github.com/prettier/prettier-eslint-cli) - this package is based on it

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars3.githubusercontent.com/u/292365?v=3" width="100px;"/><br /><sub>Adam Stankiewicz</sub>](http://sheerun.net)<br />[💻](https://github.com/prettier/prettier-standard/commits?author=sheerun) 🚇 | [<img src="https://avatars.githubusercontent.com/u/1500684?v=3" width="100px;"/><br /><sub>Kent C. Dodds</sub>](https://kentcdodds.com)<br />[💻](https://github.com/prettier/prettier-standard/commits?author=kentcdodds) | [<img src="https://avatars3.githubusercontent.com/u/3266363?v=3" width="100px;"/><br /><sub>Adam Harris</sub>](https://github.com/aharris88)<br />[💻](https://github.com/prettier/prettier-standard/commits?author=aharris88) |
| :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

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
[emojis]: https://github.com/kentcdodds/all-contributors#emoji-key
[all-contributors]: https://github.com/kentcdodds/all-contributors
[npm scripts]: https://docs.npmjs.com/misc/scripts
[package scripts]: https://github.com/kentcdodds/p-s
[glob]: https://github.com/isaacs/node-glob
