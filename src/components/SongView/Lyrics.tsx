import React from 'react'
import Modal from '../common/Modal'
import Header from '../common/Header'
import * as types from '../../constants/ActionTypes'
import { Dispatch } from 'redux'

type Props = {
  onClose: () => void
  lyrics: string,
  songId: string,
  dispatch: Dispatch<any>
}

const Lyrics = (props: Props) => {
  React.useEffect(() => {
    if (props.lyrics) return

    props.dispatch({ type: types.FETCH_LYRICS, songId: props.songId })
  }, [props.songId, props.lyrics])

  return (
    <Modal
      onClose={() => {
        props.onClose()
      }}
    >
      <Header>Lyrics</Header>
      <div className='p-4 my-6'>
        <pre className='overflow-y-auto'>
          {props.lyrics}
        </pre>
      </div>
    </Modal>
  )
}

export default Lyrics
