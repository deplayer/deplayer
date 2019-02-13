import * as React from 'react'
import { connect } from 'react-redux'

type Props = {
  connection: any
}

const ConnectionStatus = (props: Props) => {
  if (props.connection.connected) {
    return (
      <i className='fa fa-wifi'></i>
    )
  }

  return (
    <i className='fa fa-wifi-slash'></i>
  )
}

export default connect(
  (state) => ({
    connection: state.connection
  })
)(ConnectionStatus)
