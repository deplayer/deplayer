import { useEffect } from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'
import Modal from '../common/Modal'
import * as types from '../../constants/ActionTypes'
import { useLyrics } from '../../stores/livestore/hooks'

type Props = {
  onClose: () => void
  songId: string,
  dispatch: Dispatch,
  isOpen: boolean,
  currentPlayingSongId?: string
}

const Lyrics = ({ onClose, songId, dispatch, isOpen, currentPlayingSongId }: Props) => {
  const lyricsData = useLyrics(songId)
  const lyrics = lyricsData && lyricsData.length > 0 ? lyricsData[0].lyricsText : undefined

  // Fetch lyrics from the API when the modal opens and LiveStore has none
  useEffect(() => {
    if (isOpen && !lyrics && songId) {
      dispatch({ type: types.FETCH_LYRICS, songId })
    }
  }, [songId, isOpen, lyrics, dispatch])

  // Close the modal when playback moves to a different song
  useEffect(() => {
    if (isOpen && currentPlayingSongId && currentPlayingSongId !== songId) {
      onClose()
    }
  }, [currentPlayingSongId, isOpen, songId, onClose])

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <h2><Translate value='common.lyrics' /></h2>
      <div className='p-4 my-6'>
        {lyrics ? (
          <pre className='overflow-y-auto w-full whitespace-pre-wrap'>
            {lyrics}
          </pre>
        ) : (
          <div className='text-center'>
            <Translate value='common.loadingLyrics' />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default Lyrics
