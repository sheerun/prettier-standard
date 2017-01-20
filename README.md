# prettier-eslint-cli

CLI for [`prettier-eslint`][prettier-eslint]

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Dependencies][dependencyci-badge]][dependencyci]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npm-stat]
[![MIT License][license-badge]][LICENSE]

[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors)
[![PRs Welcome][prs-badge]][prs]
[![Donate][donate-badge]][donate]
[![Code of Conduct][coc-badge]][coc]
[![Roadmap][roadmap-badge]][roadmap]
[![Examples][examples-badge]][examples]

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]
[![Tweet][twitter-badge]][twitter]

## The problem

You have a bunch of files that you want to format using [`prettier-eslint`][prettier-eslint].
But `prettier-eslint` can only operate on strings.

## This solution

This is a [CLI](https://en.wikipedia.org/wiki/Command-line_interface) that allows you to use
`prettier-eslint` on one or multiple files. `prettier-eslint-cli` forwards on the `filePath`
and other relevant options to `prettier-eslint` which identifies the applicable `ESLint`
config for each file and uses that to determine the options for `prettier` and `eslint --fix`.

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and should
be installed (with [`yarn`][yarn]) as one of your project's `devDependencies`:

```
yarn add --dev prettier-eslint-cli
```

> If you're still using the [`npm`][npm] client: `npm install --save-dev prettier-eslint-cli`

## Usage

Typically you'll use this in your [npm scripts][npm scripts] (or [package scripts][package scripts]):

```json
{
  "scripts": {
    "format": "prettier-eslint src/**/*.js"
  }
}
```

This will format all `.js` files in the `src` directory. The argument you pass to the CLI
is a [glob][glob] and you can pass as many as you wish. You can also pass options.

### CLI Options

```
prettier-eslint --help
Usage: prettier-eslint <globs>... [--option-1 option-1-value --option-2]

Options:
  -h, --help      Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  --write         Edit the file in-place (beware!)              [default: false]
  --stdin         Read input via stdin                          [default: false]
  --eslintPath    The path to the eslint module to use
    [default: "<your_project>/node_modules/eslint"]
  --prettierPath  The path to the prettier module to use
  [default: "<your_project>/node_modules/prettier"]
  --log           Show logs                                     [default: false]
  --sillyLogs     Show silly amount of logs (good for debugging)[default: false]
```

#### <globs>

Any number of [globs][glob] you wish to use to match the files you wish to format. By default, `glob` will ignore
`**/node_modules/**` unless the glob you provide
includes the string `node_modules`.

#### --write

By default `prettier-eslint` will simply log the formatted version to the terminal. If you want to overwrite the file
itself (a common use-case) then add `--write`.

> **NOTE:** It is recommended that you keep your files under source control and committed
> before running `prettier-eslint --write` as it will overwrite your files!

#### --stdin

Accept input via `stdin`. For example:

```
echo "var   foo =    'bar'" | prettier-eslint --stdin
# results in: "var foo = 'bar';" (depending on your eslint config)
```

#### --eslint-path

Forwarded as the `eslintPath` option to `prettier-eslint`

#### --prettier-path

Forwarded as the `prettierPath` option to `prettier-eslint`

#### --log

If `prettier-eslint` encounters an error formatting a file, it logs an error to the console.
`prettier-eslint-cli` disables this behavior by default. You can turn it on with `--log`.

#### --silly-logs

This will be forwarded onto `prettier-eslint` as (`sillyLogs`) and is useful for debugging.

## Related

- [prettier-eslint](https://github.com/kentcdodds/prettier-eslint) - the core package
- [prettier-eslint-atom](https://github.com/kentcdodds/prettier-eslint-atom) - an atom plugin

## Contributors

Thanks goes to these people ([emoji key][emojis]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars.githubusercontent.com/u/1500684?v=3" width="100px;"/><br /><sub>Kent C. Dodds</sub>](https://kentcdodds.com)<br />[💻](https://github.com/kentcdodds/prettier-eslint-cli/commits?author=kentcdodds) [📖](https://github.com/kentcdodds/prettier-eslint-cli/commits?author=kentcdodds) 🚇 [⚠️](https://github.com/kentcdodds/prettier-eslint-cli/commits?author=kentcdodds) | [<img src="https://avatars3.githubusercontent.com/u/3266363?v=3" width="100px;"/><br /><sub>Adam Harris</sub>](https://github.com/aharris88)<br />👀 | [<img src="https://avatars.githubusercontent.com/u/622118?v=3" width="100px;"/><br /><sub>Eric McCormick</sub>](https://ericmccormick.io)<br />👀 |
| :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification. Contributions of any kind welcome!

## LICENSE

MIT

[yarn]: https://yarnpkg.com/
[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/travis/kentcdodds/prettier-eslint-cli.svg?style=flat-square
[build]: https://travis-ci.org/kentcdodds/prettier-eslint-cli
[coverage-badge]: https://img.shields.io/codecov/c/github/kentcdodds/prettier-eslint-cli.svg?style=flat-square
[coverage]: https://codecov.io/github/kentcdodds/prettier-eslint-cli
[dependencyci-badge]: https://dependencyci.com/github/kentcdodds/prettier-eslint-cli/badge?style=flat-square
[dependencyci]: https://dependencyci.com/github/kentcdodds/prettier-eslint-cli
[version-badge]: https://img.shields.io/npm/v/prettier-eslint-cli.svg?style=flat-square
[package]: https://www.npmjs.com/package/prettier-eslint-cli
[downloads-badge]: https://img.shields.io/npm/dm/prettier-eslint-cli.svg?style=flat-square
[npm-stat]: http://npm-stat.com/charts.html?package=prettier-eslint-cli&from=2016-04-01
[license-badge]: https://img.shields.io/npm/l/prettier-eslint-cli.svg?style=flat-square
[license]: https://github.com/kentcdodds/prettier-eslint-cli/blob/master/other/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[donate-badge]: https://img.shields.io/badge/$-support-green.svg?style=flat-square
[donate]: http://kcd.im/donate
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/kentcdodds/prettier-eslint-cli/blob/master/other/CODE_OF_CONDUCT.md
[roadmap-badge]: https://img.shields.io/badge/%F0%9F%93%94-roadmap-CD9523.svg?style=flat-square
[roadmap]: https://github.com/kentcdodds/prettier-eslint-cli/blob/master/other/ROADMAP.md
[examples-badge]: https://img.shields.io/badge/%F0%9F%92%A1-examples-8C8E93.svg?style=flat-square
[examples]: https://github.com/kentcdodds/prettier-eslint-cli/blob/master/other/EXAMPLES.md
[github-watch-badge]: https://img.shields.io/github/watchers/kentcdodds/prettier-eslint-cli.svg?style=social
[github-watch]: https://github.com/kentcdodds/prettier-eslint-cli/watchers
[github-star-badge]: https://img.shields.io/github/stars/kentcdodds/prettier-eslint-cli.svg?style=social
[github-star]: https://github.com/kentcdodds/prettier-eslint-cli/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20prettier-eslint-cli!%20https://github.com/kentcdodds/prettier-eslint-cli%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/kentcdodds/prettier-eslint-cli.svg?style=social
[emojis]: https://github.com/kentcdodds/all-contributors#emoji-key
[all-contributors]: https://github.com/kentcdodds/all-contributors
[prettier-eslint]: https://github.com/kentcdodds/prettier-eslint
[npm scripts]: https://docs.npmjs.com/misc/scripts
[package scripts]: https://github.com/kentcdodds/p-s
[glob]: https://github.com/isaacs/node-glob
