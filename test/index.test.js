const { format, check } = require('..')

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
