import * as React from 'react'
import { connect } from 'react-redux'
import * as types from '../constants/ActionTypes'

type Props = {
  dispatch: () => void
}


const GlobalKeyHandlers = (props: Props) => {
  return (
    <>
    </>
  )
}

export default connect()(GlobalKeyHandlers)
