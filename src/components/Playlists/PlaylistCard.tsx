import { memo } from 'react'
import { Translate } from 'react-redux-i18n'
import Icon from '../common/Icon'
import Button from '../common/Button'

export type FilterChip = {
  labelKey: string // e.g. "filters.genre"
  value: string
}

type Props = {
  name: string
  trackCount: number
  albumCount: number
  duration: number
  firstCover: string | undefined
  isSmartPlaylist: boolean
  chips?: FilterChip[]
  onPlayAll: () => void
  onShuffle: () => void
  onShowSongs: () => void
  onAddToQueue: () => void
  onApplyFilters: () => void
  onDelete: () => void
}

// NOTE: matches the existing (buggy) duration formatting in Playlist.tsx —
// track.duration is stored in ms but treated here as seconds. Keeping parity
// with the current behavior so this refactor is purely visual; fix separately.
const formatDuration = (durationLikeSeconds: number) => {
  const minutes = Math.floor(durationLikeSeconds / 60)
  const remainingSeconds = Math.floor(durationLikeSeconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const PlaylistCard = memo(({
  name,
  trackCount,
  albumCount,
  duration,
  firstCover,
  isSmartPlaylist,
  chips,
  onPlayAll,
  onShuffle,
  onShowSongs,
  onAddToQueue,
  onApplyFilters,
  onDelete,
}: Props) => (
  <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-200">
    <figure className="relative aspect-square w-full overflow-hidden bg-base-300 rounded-box rounded-b-none">
      {firstCover ? (
        <>
          <img
            src={firstCover}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Icon icon="faMusic" className="text-4xl text-base-content/30" />
        </div>
      )}
    </figure>

    <div className="card-body p-4">
      <h3 className="card-title text-lg font-bold truncate">{name}</h3>

      <div className="text-sm opacity-70 space-y-1">
        <div className="flex items-center gap-2">
          <Icon icon="faMusic" className="text-xs" />
          <span>
            {trackCount} <Translate value="menu.songs" />
          </span>
        </div>
        {albumCount > 0 && (
          <div className="flex items-center gap-2">
            <Icon icon="faCompactDisc" className="text-xs" />
            <span>
              {albumCount} <Translate value="titles.albums" />
            </span>
          </div>
        )}
        {duration > 0 && (
          <div className="flex items-center gap-2">
            <Icon icon="faStopwatch" className="text-xs" />
            <span>{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {chips.map((chip, idx) => (
            <span
              key={`${chip.labelKey}-${chip.value}-${idx}`}
              className="badge badge-outline badge-sm gap-1"
            >
              <Translate value={chip.labelKey} />
              <span className="opacity-70">·</span>
              <span className="truncate max-w-[8rem]">{chip.value}</span>
            </span>
          ))}
        </div>
      )}

      <div className="card-actions flex-wrap justify-end mt-4 gap-2">
        <div className="flex w-full gap-2">
          <Button onClick={onPlayAll} className="flex-1 btn-primary">
            <Icon icon="faPlay" className="mr-2" />
            <Translate value="buttons.playAll" />
          </Button>

          <Button
            onClick={onShuffle}
            className="btn-ghost px-3"
            aria-label="Shuffle"
          >
            <Icon icon="faRandom" />
          </Button>

          <div className="dropdown dropdown-end">
            <Button className="btn-ghost px-3" aria-label="Playlist options">
              <Icon icon="faEllipsisV" />
            </Button>
            <ul className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52">
              <li>
                <button onClick={onShowSongs}>
                  <Icon icon="faList" className="mr-2" />
                  <Translate value="buttons.showSongs" />
                </button>
              </li>
              <li>
                <button onClick={onAddToQueue}>
                  <Icon icon="faPlus" className="mr-2" />
                  <Translate value="buttons.addToQueue" />
                </button>
              </li>
              {isSmartPlaylist && (
                <>
                  <li>
                    <button onClick={onApplyFilters}>
                      <Icon icon="faFilter" className="mr-2" />
                      <Translate value="buttons.applyFilters" />
                    </button>
                  </li>
                  <li className="text-error">
                    <button onClick={onDelete}>
                      <Icon icon="faTrash" className="mr-2" />
                      <Translate value="buttons.delete" />
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
))

export default PlaylistCard
