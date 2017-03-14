/* eslint no-console:0 */
const message = `
Looks like you're trying to require/import \`prettier-standard\`.
This module doesn't actually expose a NodeJS interface.
This module's just the CLI for \`prettier-standard\`.
If you want to use this via NodeJS, install \`prettier-standard\` instead.
`.trim()

console.info(message)

module.exports = message
