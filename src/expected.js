import React from 'react'

class Example extends React.Component {
  state = {
    foo: 'bar'
  }

  async render () {
    const foo = await import('sdaf')
    return <div foo='bar' />
  }
}
