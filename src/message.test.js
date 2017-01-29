/*eslint import/namespace: [2, { allowComputed: true }]*/
import * as messages from './messages'

const tests = {
  success: [
    {
      input: {success: 'success', count: 1, countString: '1String'},
      output: 'success formatting 1String file with prettier-eslint',
    },
    {
      input: {success: 'success', count: 3, countString: '3String'},
      output: 'success formatting 3String files with prettier-eslint',
    },
  ],
  failure: [
    {
      input: {failure: 'failure', count: 1, countString: '1String'},
      output: 'failure formatting 1String file with prettier-eslint',
    },
    {
      input: {failure: 'failure', count: 3, countString: '3String'},
      output: 'failure formatting 3String files with prettier-eslint',
    },
  ],
  unchanged: [
    {
      input: {unchanged: 'unchanged', count: 1, countString: '1String'},
      output: '1String file was unchanged',
    },
    {
      input: {unchanged: 'unchanged', count: 3, countString: '3String'},
      output: '3String files were unchanged',
    },
  ],
}

Object.keys(tests).forEach(messageKey => {
  tests[messageKey].forEach(({input, output}) => {
    test(`${messageKey} ${JSON.stringify(input)}`, () => {
      expect(messages[messageKey](input)).toEqual(output)
    })
  })
})
