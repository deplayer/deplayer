import { useState, useEffect, useRef } from 'react'
import CoverImage from '../MusicTable/CoverImage'
import Modal from '../common/Modal'
import Media from '../../entities/Media'

type Props = {
  slim?: boolean,
  song: Media
}

const Cover = (props: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (props.song.cover?.thumbnailUrl) {
      const img = new Image()
      img.onload = () => setIsImageLoaded(true)
      img.src = props.song.cover.thumbnailUrl
      imageRef.current = img
      return () => {
        imageRef.current = null
      }
    }
  }, [props.song.cover?.thumbnailUrl])

  if (props.slim) {
    return null
  }

  const albumName = props.song.album ? props.song.album.name : 'N/A'

  return (
    <>
      <div 
        className='show-cover relative text-lg hidden md:block h-full overflow-visible cursor-pointer' 
        style={{ width: '60px', height: '60px' }}
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid="cover-container"
      >
        <CoverImage
          useImage
          cover={props.song.cover}
          size='thumbnail'
          albumName={albumName}
          noFade
        />
        
        {/* Hover Preview */}
        {isImageLoaded && (
          <div 
            className={`absolute z-[100] bg-base-100 p-2 rounded-lg shadow-xl transition-all duration-200 ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
            style={{ 
              bottom: 'calc(100% + 10px)',
              left: '0',
              width: '200px',
              height: '200px',
              pointerEvents: 'none'
            }}
            data-testid="hover-preview"
          >
            <CoverImage
              useImage
              cover={props.song.cover}
              size='medium'
              albumName={albumName}
              noFade
            />
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={albumName}
      >
        <div className="flex justify-center items-center">
          <CoverImage
            useImage
            cover={props.song.cover}
            size='large'
            albumName={albumName}
            noFade
          />
        </div>
      </Modal>
    </>
  )
}

export default Cover
