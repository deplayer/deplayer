import { useState } from 'react'
import CoverImage from '../MusicTable/CoverImage'
import Modal from '../common/Modal'
import type { MediaRow } from '../../types/media'

type Props = {
  slim?: boolean,
  song?: MediaRow | null,
  onClick?: () => void
}

const Cover = (props: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const song = props.song

  if (props.slim || !song) {
    return null
  }

  const handleCoverClick = () => {
    setIsModalOpen(true)
    if (props.onClick) {
      props.onClick()
    }
  }

  const albumName = song.albumName || 'N/A'

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && handleCoverClick) handleCoverClick() }}
        className='relative text-lg hidden md:block cursor-pointer w-16 h-16 aspect-square'
        onClick={handleCoverClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid="cover-container"
      >
        <div className="w-full h-full">
          <CoverImage
            useImage
            cover={song.cover || undefined}
            size='thumbnail'
            albumName={albumName}
            noFade
          />
        </div>

        {/* Hover Preview */}
        <div
          className={`absolute z-[100] bg-base-100 p-2 rounded-lg shadow-xl transition-all duration-200 ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          style={{
            bottom: 'calc(100% + 10px)',
            left: '0',
            width: '200px',
            aspectRatio: '1/1',
            pointerEvents: 'none'
          }}
          data-testid="hover-preview"
        >
          <CoverImage
            useImage
            cover={song.cover || undefined}
            size='medium'
            albumName={albumName}
            noFade
          />
        </div>
      </div>

      {/* Fullscreen Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={albumName}
      >
        <div className="flex justify-center items-center">
          <div className="w-full max-w-2xl aspect-square">
            <CoverImage
              useImage
              cover={song.cover || undefined}
              size='full'
              albumName={albumName}
              noFade
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Cover
