const { format, check, run } = require('..')
const git = require('isomorphic-git')
const fs = require('fs')
const path = require('path')
const tmp = require('tmp')
tmp.setGracefulCleanup()

describe('format', () => {
  it('formats non-standard code', () => {
    const output = format('function foo(){}')
    expect(output).toEqual('function foo () {}\n')
  })
})

describe('check', () => {
  it('checks standard code', () => {
    const valid = check('function foo () {}\n')
    expect(valid).toEqual(true)
  })

  it('checks non-standard code', () => {
    const valid = check('function foo() {}\n')
    expect(valid).toEqual(false)
  })
})

let dir

const file = filepath => path.join(dir, filepath)
const write = (filepath, contents) => fs.writeFileSync(file(filepath), contents)
const read = filepath => fs.readFileSync(file(filepath), 'utf8')

describe('run', () => {
  beforeEach(() => {
    dir = tmp.dirSync().name
  })

  it('formats file on disk', async () => {
    write('file.js', 'const foo=()=>"12";')
    run(dir, { patterns: ['file.js'] })
    expect(read('file.js')).toEqual("const foo = () => '12'\n")
  })

  it('formats changed files', async () => {
    await git.init({ dir, fs })
    write('file.js', 'const foo=()=>"12";')
    await git.add({ dir, fs, filepath: 'file.js' })
    run(dir, { changed: true })
    expect(read('file.js')).toEqual("const foo = () => '12'\n")
  })

  it('formats changed lines', async () => {
    await git.init({ dir, fs })
    write(
      'file.js',
      'function test(){\n  const foo = "bar";\n  let fiz="fuz";\n}\n'
    )
    await git.add({ dir, fs, filepath: 'file.js' })
    await git.commit({
      dir,
      fs,
      message: 'test',
      author: {
        name: 'Anonymous',
        email: 'email@example.com'
      }
    })
    write(
      'file.js',
      'function test(){\n  const foo = "fiz";\n  let fiz="fuz";\n}\n'
    )
    run(dir, { lines: true })
    expect(read('file.js')).toEqual(
      'function test(){\n  const foo = \'fiz\'\n  let fiz="fuz";\n}\n'
    )
  })
})
