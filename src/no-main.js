const message = `
Looks like you're trying to require/import \`prettier-eslint-cli\`.
This module doesn't actually expose a NodeJS interface.
This module's just the CLI for \`prettier-eslint\`.
If you want to use \`prettier-eslint\` via NodeJS, install \`prettier-eslint\` instead.
`.trim()

console.info(message) // eslint-disable-line

module.exports = message
