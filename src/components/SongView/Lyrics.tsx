import { useEffect } from 'react'
import Modal from '../common/Modal'
import Header from '../common/Header'
import * as types from '../../constants/ActionTypes'
import { Dispatch } from 'redux'

type Props = {
  onClose: () => void
  lyrics: string,
  error?: string,
  songId: string,
  dispatch: Dispatch<any>,
  isOpen: boolean,
  currentPlayingSongId?: string
}

const Lyrics = (props: Props) => {
  // Clear and refetch lyrics when song changes
  useEffect(() => {
    if (props.isOpen) {
      // Clear previous lyrics first
      props.dispatch({ type: types.CLEAR_LYRICS })
      // Then fetch new lyrics if we have a song ID
      if (props.songId) {
        props.dispatch({ type: types.FETCH_LYRICS, songId: props.songId })
      }
    }
  }, [props.songId, props.isOpen])

  // Clear lyrics when modal closes or component unmounts
  useEffect(() => {
    if (!props.isOpen) {
      props.dispatch({ type: types.CLEAR_LYRICS })
    }

    return () => {
      props.dispatch({ type: types.CLEAR_LYRICS })
    }
  }, [props.isOpen])

  // Clear lyrics if the currently playing song changes and it doesn't match our songId
  useEffect(() => {
    if (props.isOpen && props.currentPlayingSongId && props.currentPlayingSongId !== props.songId) {
      props.dispatch({ type: types.CLEAR_LYRICS })
      props.onClose()
    }
  }, [props.currentPlayingSongId])

  return (
    <Modal
      onClose={() => {
        props.onClose()
      }}
      isOpen={props.isOpen}
    >
      <Header>Lyrics</Header>
      <div className='p-4 my-6'>
        {props.error ? (
          <div className='text-error text-center'>
            {props.error}
          </div>
        ) : (
          <pre className='overflow-y-auto w-full whitespace-pre-wrap'>
            {props.lyrics}
          </pre>
        )}
      </div>
    </Modal>
  )
}

export default Lyrics
