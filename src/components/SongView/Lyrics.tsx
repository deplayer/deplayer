import { useEffect, useState } from 'react'
import Modal from '../common/Modal'
import Header from '../common/Header'
import * as types from '../../constants/ActionTypes'
import { Dispatch } from 'redux'
import { useLyrics } from '../../stores/livestore/hooks'

type Props = {
  onClose: () => void
  songId: string,
  dispatch: Dispatch<any>,
  isOpen: boolean,
  currentPlayingSongId?: string
}

const Lyrics = (props: Props) => {
  const lyricsData = useLyrics(props.songId)
  const [error, setError] = useState<string | undefined>()
  
  // Get lyrics text from LiveStore query result
  const lyrics = lyricsData && lyricsData.length > 0 ? lyricsData[0].lyricsText : undefined

  // Fetch lyrics when modal opens and no lyrics exist
  useEffect(() => {
    if (props.isOpen && !lyrics && props.songId) {
      // Trigger saga to fetch lyrics from API
      props.dispatch({ type: types.FETCH_LYRICS, songId: props.songId })
      setError(undefined)
    }
  }, [props.songId, props.isOpen, lyrics])

  // Close modal if the currently playing song changes
  useEffect(() => {
    if (props.isOpen && props.currentPlayingSongId && props.currentPlayingSongId !== props.songId) {
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
        {error ? (
          <div className='text-error text-center'>
            {error}
          </div>
        ) : lyrics ? (
          <pre className='overflow-y-auto w-full whitespace-pre-wrap'>
            {lyrics}
          </pre>
        ) : (
          <div className='text-center'>
            Loading lyrics...
          </div>
        )}
      </div>
    </Modal>
  )
}

export default Lyrics
