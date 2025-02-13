import { Link } from 'react-router-dom'
import CoverImage from '../../MusicTable/CoverImage'
import Tag from '../Tag'

type MediaCoverProps = {
  id: string
  name: string
  artistName?: string
  cover?: {
    thumbnailUrl?: string
    fullUrl?: string
  }
  playCount?: number
  showPlayCount?: boolean
  type?: 'album' | 'song'  // Add type to determine the link path
}

const MediaCover = ({ id, name, artistName, cover, playCount, showPlayCount, type = 'album' }: MediaCoverProps) => {
  // Only return null if we have no id or name
  if (!id || !name) {
    return null
  }

  const linkPath = type === 'song' ? `/song/${id}` : `/album/${id}`

  return (
    <div className='flex flex-col w-32 h-full'>
      <Link 
        to={linkPath}
        className='flex flex-col h-full'
      >
        <div className='relative'>
          {showPlayCount && (
            <div className='w-full'>
              <Tag fullWidth>
                <span className='truncate text-xs'>
                  {playCount ? `#${playCount} times played` : "never played"}
                </span>
              </Tag>
            </div>
          )}
          <div className='h-32 w-32'>
            <CoverImage
              reflect
              albumName={name}
              useImage
              cover={cover ? {
                thumbnailUrl: cover.thumbnailUrl || '',
                fullUrl: cover.fullUrl || cover.thumbnailUrl || ''
              } : undefined}
            />
          </div>
        </div>
        <div className='mt-2 px-1 flex-1 min-h-0'>
          <p className='text-sm text-center line-clamp-2 break-words'>
            {name}
          </p>
          {artistName && (
            <p className='text-sm opacity-70 text-center truncate'>
              {artistName}
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}

// For backward compatibility, export both names
export const AlbumCover = (props: MediaCoverProps) => <MediaCover {...props} type="album" />
export default MediaCover 