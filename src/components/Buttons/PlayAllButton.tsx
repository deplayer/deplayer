import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import * as React from 'react'

import { PLAY_ALL } from '../../constants/ActionTypes'
import Button from '../common/Button'

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
    <Button
      transparent
      className='playall-button button'
      onClick={playAll}
    >
      <i className='fa fa-caret-right'></i>
    </Button>
  )
}

const RoutedButton = withRouter((props: any) => <PlayAllButton {...props}/>)

export default RoutedButton
