import * as React from 'react'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'

import { PLAY_ALL } from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch,
  location: any
}

const PlayAllButton = (props: Props) => {
  const playAll = () => {
    props.dispatch({type: PLAY_ALL, path: props.location.pathname.replace(/\//, '')})
  }

  if (props.location.pathname.match(/^\/settings?$/)) {
    return null
  }

  return (
    <button
      className='playall-button button'
      onClick={playAll}
    >
      <i className='fa fa-caret-right'></i>
    </button>
  )
}

const RoutedButton = withRouter(props => <PlayAllButton {...props}/>)

export default RoutedButton
