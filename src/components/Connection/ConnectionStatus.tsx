import * as React from 'react'
import { connect } from 'react-redux'

type Props = {
  connection: any
}

const ConnectionStatus = (props: Props) => {
  if (props.connection.connected) {
    return (
      <div className='button'>
        <i className='fa fa-wifi'></i>
      </div>
    )
  }

  return (
    <div className='button'>
      <i className='fa fa-wifi disabled'></i>
    </div>
  )
}

export default connect(
  (state) => ({
    connection: state.connection
  })
)(ConnectionStatus)
