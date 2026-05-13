import { memo, useCallback } from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { usePlaylistStats } from './usePlaylistStats'
import { useAppStore } from '../../stores/livestore/store'
import { addToQueueAction } from '../../stores/livestore/actions'
import * as types from '../../constants/ActionTypes'
import type { FeaturedReason } from './usePickFeatured'

type Props = {
  playlist: {
    _id: string
    id?: string
    name?: string
    trackIds: string[]
    filters?: Record<string, string[]>
  }
  reasonKey: FeaturedReason
  dispatch: Dispatch
}

const formatDuration = (durationLikeSeconds: number) => {
  const hours = Math.floor(durationLikeSeconds / 3600)
  const minutes = Math.floor((durationLikeSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const FeaturedHero = memo(({ playlist, reasonKey, dispatch }: Props) => {
  const stats = usePlaylistStats(playlist.trackIds)
  const liveStore = useAppStore()

  const displayName =
    playlist.name || (playlist.filters?.genres?.[0] ?? 'Untitled Playlist')

  const handlePlay = useCallback(() => {
    if (playlist.trackIds.length === 0) return
    dispatch({ type: types.PLAY_LIST, trackIds: playlist.trackIds })
  }, [playlist.trackIds, dispatch])

  const handleShuffle = useCallback(() => {
    if (playlist.trackIds.length === 0) return
    dispatch({ type: types.PLAY_LIST, trackIds: playlist.trackIds })
    dispatch({ type: types.SHUFFLE })
  }, [playlist.trackIds, dispatch])

  const handleAddToQueue = useCallback(async () => {
    if (!liveStore || playlist.trackIds.length === 0) return
    try {
      await addToQueueAction(liveStore, playlist.trackIds)
    } catch (error) {
      console.error('Failed to add featured playlist to queue:', error)
    }
  }, [liveStore, playlist.trackIds])

  return (
    <section className="relative mx-4 mb-10 overflow-hidden rounded-box bg-base-200">
      {stats.firstCover && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-30"
          style={{ backgroundImage: `url(${stats.firstCover})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-base-100/80 via-base-100/40 to-transparent" />

      <div className="relative flex flex-col md:flex-row gap-6 p-6 md:p-8">
        <div className="shrink-0">
          <div className="aspect-square w-48 md:w-60 rounded-box overflow-hidden bg-base-300 shadow-2xl">
            {stats.firstCover ? (
              <img
                src={stats.firstCover}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon icon="faMusic" className="text-5xl text-base-content/30" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-end min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-base-content/60 mb-2">
            <Translate value={reasonKey} />
          </p>
          <h1 className="text-3xl md:text-5xl truncate mb-3">
            {displayName}
          </h1>
          <p className="text-sm text-base-content/70 mb-5">
            <span>{stats.trackCount} </span>
            <Translate value="menu.songs" />
            {stats.albumCount > 0 && (
              <>
                <span> · {stats.albumCount} </span>
                <Translate value="titles.albums" />
              </>
            )}
            {stats.duration > 0 && <span> · {formatDuration(stats.duration)}</span>}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePlay} className="btn-primary">
              <Icon icon="faPlay" className="mr-2" />
              <Translate value="buttons.playAll" />
            </Button>
            <Button onClick={handleShuffle} className="btn-ghost">
              <Icon icon="faRandom" className="mr-2" />
              <Translate value="buttons.shuffle" />
            </Button>
            <Button onClick={handleAddToQueue} className="btn-ghost">
              <Icon icon="faPlus" className="mr-2" />
              <Translate value="buttons.addToQueue" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
})

export default FeaturedHero
