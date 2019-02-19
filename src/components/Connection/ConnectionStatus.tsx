import * as React from 'react'
import { connect } from 'react-redux'

type Props = {
  connection: any
}

const ConnectionStatus = (props: Props) => {
  if (props.connection.connected) {
    return (
      <div className='button connection-btn'>
        <a>
          <i className='fa fa-wifi'></i>
        </a>
      </div>
    )
  }

  return (
    <div className='button connection-btn'>
      <a>
        <i className='fa fa-wifi disabled'></i>
      </a>
    </div>
  )
}

export default connect(
  (state) => ({
    connection: state.connection
  })
)(ConnectionStatus)
