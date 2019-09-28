const execa = require('execa')
const path = require('path')

function run (args, options) {
  try {
    return {
      stdout: execa.sync(path.join(__dirname, '../src/cli.js'), args, options)
        .stdout
    }
  } catch (e) {
    return {
      code: e.exitCode,
      stderr: e.stderr
    }
  }
}
describe('prettier-standard', () => {
  it('can format stdin', () => {
    const result = run(['--stdin'], { input: 'function foo(){};' })
    expect(result).toEqual({ stdout: 'function foo () {}' })
  })
})
