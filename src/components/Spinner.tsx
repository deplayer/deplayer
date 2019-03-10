import * as React from 'react'

export default class Spinner extends React.Component {
  render() {
    return (
      <div className="spinner">
        <div className="double-bounce1" />
        <div className="double-bounce2" />
      </div>
    )
  }
}
