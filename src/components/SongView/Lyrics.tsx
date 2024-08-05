import React from 'react'
import Modal from '../common/Modal'
import Header from '../common/Header'
import * as types from '../../constants/ActionTypes'

type Props = {
  onClose: () => void
  lyrics: string,
  songId: string,
  dispatch: (action: { type: string, songId: string }) => void
}

const Lyrics = (props: Props) => {
  React.useEffect(() => {
    props.dispatch({ type: types.FETCH_LYRICS, songId: props.songId })
  }, [props.songId])

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
