import * as React from 'react'
import * as types from '../../constants/ActionTypes'
import Button from '../common/Button'
import { Translate } from 'react-redux-i18n'
import Icon from '../common/Icon'
import SongRow from '../MusicTable/SongRow'
import CoverImage from '../MusicTable/CoverImage'
import { State as QueueState } from '../../reducers/queue'
import { Dispatch } from 'redux'
import { useStore } from '@livestore/react'
import { playAllAction, addToQueueAction, addNextAction } from '../../stores/livestore/actions'

interface AlbumData {
  id: string
  name: string
  year?: number
}

type AlbumProps = {
  album: AlbumData,
  queue: QueueState,
  songs: Array<string>,
  dispatch: Dispatch,
  mediaMap: Record<string, any>  // Passed from parent - no hook call needed
}

/**
 * Album component - displays an album with its songs grouped by disc
 * 
 * PERFORMANCE: mediaMap is passed as prop from ArtistView, not fetched via hook.
 * This prevents each Album from triggering a separate full-library query.
 */
const Album = React.memo((props: AlbumProps) => {
  const { album, mediaMap, songs, dispatch, queue } = props
  const albumId = album.id
  const { store: liveStore } = useStore()

  // Play album: add all songs to queue and start playing
  const playAlbum = React.useCallback(async () => {
    if (!liveStore || !songs || songs.length === 0) return
    
    try {
      // Get unique song IDs in track order
      const uniqueSongIds = Array.from(new Set(songs))
      const firstTrackId = await playAllAction(liveStore, uniqueSongIds)
      
      if (firstTrackId) {
        dispatch({ 
          type: types.PLAY_ALL_COMPLETED,
          trackId: firstTrackId 
        })
      }
    } catch (error) {
      console.error('Failed to play album:', error)
    }
  }, [liveStore, songs, dispatch])

  // Add album to end of queue
  const addAlbumToQueue = React.useCallback(async () => {
    if (!liveStore || !songs || songs.length === 0) return
    
    try {
      const uniqueSongIds = Array.from(new Set(songs))
      await addToQueueAction(liveStore, uniqueSongIds)
    } catch (error) {
      console.error('Failed to add album to queue:', error)
    }
  }, [liveStore, songs])

  // Add album next in queue
  const addAlbumNext = React.useCallback(async () => {
    if (!liveStore || !songs || songs.length === 0) return
    
    try {
      const uniqueSongIds = Array.from(new Set(songs))
      await addNextAction(liveStore, uniqueSongIds)
    } catch (error) {
      console.error('Failed to add album next:', error)
    }
  }, [liveStore, songs])

  const extractSongs = React.useCallback(() => {
    if (!songs) {
      return null
    }

    // Create a Set of unique song IDs
    const uniqueSongsSet = new Set(songs)

    // Log any duplicates that were removed
    if (uniqueSongsSet.size !== songs.length) {
      const duplicates = songs.filter(songId => 
        songs.indexOf(songId) !== songs.lastIndexOf(songId)
      )
      console.warn(`Removed ${songs.length - uniqueSongsSet.size} duplicate songs from album ${album.name} (${albumId}):`, 
        [...new Set(duplicates)])
    }

    // Group songs by disc number using Map to ensure unique entries per disc
    const songsByDiscMap = new Map<number, Set<string>>()
    
    for (const songId of uniqueSongsSet) {
      const song = mediaMap[songId]
      if (!song) {
        console.warn(`Song ${songId} not found in collection for album ${props.album.name}`)
        continue
      }
      
      const discNumber = song.discNumber || 1
      if (!songsByDiscMap.has(discNumber)) {
        songsByDiscMap.set(discNumber, new Set())
      }
      songsByDiscMap.get(discNumber)?.add(songId)
    }

    // Convert Map of Sets to sorted array structure
    const sortedDiscs = Array.from(songsByDiscMap.keys()).sort((a, b) => a - b)

    return sortedDiscs.map(discNumber => {
      const discSongsSet = songsByDiscMap.get(discNumber) || new Set<string>()
      const discSongs = Array.from(discSongsSet)
        .sort((a, b) => {
          const songA = mediaMap[a]
          const songB = mediaMap[b]
          // Sort by track number if available, otherwise by title
          if (songA.track && songB.track) {
            return songA.track - songB.track
          }
          if (songA.title < songB.title) return -1
          if (songA.title > songB.title) return 1
          return 0
        })
        .map((songId) => {
          const songRow = mediaMap[songId]
          return (
            <SongRow
              mqlMatch={false}
              disableCovers
              style={{}}
              key={songId}
              dispatch={dispatch}
              isCurrent={false}
              slim={true}
              onClick={playAlbum}
              song={songRow}
            />
          )
        })

      // Only show disc header if there are multiple discs
      const showDiscHeader = songsByDiscMap.size > 1

      return (
        <div key={discNumber} className="mb-4">
          {showDiscHeader && (
            <h4 className="text-lg font-medium mb-2 px-4">
              <Icon icon="faCompactDisc" className="mr-2" />
              <Translate value="album.disc" /> {discNumber}
            </h4>
          )}
          {discSongs}
        </div>
      )
    })
  }, [songs, album.name, albumId, mediaMap, dispatch, playAlbum])

  // Memoize the cover image source
  const coverSource = React.useMemo(() => {
    const firstSongId = songs?.[0]
    return firstSongId ? mediaMap[firstSongId]?.cover : undefined
  }, [songs, mediaMap])

  return (
    <div 
      className='mx-0 z-4 flex flex-col md:flex-row items-center md:items-start mb-16' 
      key={albumId}
    >
      <div className='sticky backdrop-blur-sm bg-black/30 md:bg-transparent shadow-lg md:shadow-none py-4 top-0 mt-0 w-full md:w-56 flex md:flex-col items-center md:mx-8 z-10'>
        <div
          className='h-56 w-56 mb-2 p-4 md:h-56 md:w-56 cursor-pointer md:mr-4'
          onClick={playAlbum}
        >
          <CoverImage
            cover={coverSource}
            size='thumbnail'
            albumName={album.name}
          />
        </div>
        <div className='flex flex-col items-center justify-center gap-2'>
          <h3 className='text-lg p-4 w-56'>{album.name}</h3>
            { album.year && <h4 className='text-md p-4 w-56'>{album.year}</h4>}
          <Button
            transparent
            onClick={addAlbumToQueue}
          >
            <Icon
              icon='faFolderPlus'
              className='mx-2'
            />
            <Translate value='buttons.addToQueue' />
          </Button>

          {queue?.currentPlaying && (
            <Button
              transparent
              onClick={addAlbumNext}
            >
              <Icon
                icon='faPlusCircle'
                className='mx-2'
              />
              <Translate value='buttons.addNext' />
            </Button>
          )}

          <Button
            transparent
            onClick={() => {
              dispatch({ type: types.PIN_ALBUM, albumId })
            }}
          >
            <Icon
              icon='faFolderPlus'
              className='mx-2'
            />
            <Translate value='buttons.pinAlbum' />
          </Button>
        </div>
      </div>
      <div className='w-full m-2'>
        {extractSongs()}
      </div>
    </div>
  )
})

Album.displayName = 'Album'

export default Album
