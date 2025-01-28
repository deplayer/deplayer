import { useState, useEffect, useRef } from 'react'
import CoverImage from '../MusicTable/CoverImage'
import Modal from '../common/Modal'
import Media from '../../entities/Media'

type Props = {
  slim?: boolean,
  song: Media,
  onClick?: () => void
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

  const handleClick = () => {
    setIsModalOpen(true)
    if (props.onClick) {
      props.onClick()
    }
  }

  const albumName = props.song.album ? props.song.album.name : 'N/A'

  return (
    <>
      <div 
        className='relative text-lg hidden md:block cursor-pointer w-16 aspect-square'
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid="cover-container"
      >
        <div className="w-full h-full">
          <CoverImage
            useImage
            cover={props.song.cover}
            size='thumbnail'
            albumName={albumName}
            noFade
          />
        </div>
        
        {/* Hover Preview */}
        {isImageLoaded && (
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
          <div className="w-full max-w-2xl aspect-square">
            <CoverImage
              useImage
              cover={props.song.cover}
              size='large'
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
