import { Link } from 'react-router-dom'
import { getDurationStr } from '../../utils/timeFormatter'
import Icon from '../common/Icon'

type DigitalScreenProps = {
  playedSeconds: number,
  duration: number,
  currentPlaying?: {
    id: string,
    title: string,
    artist?: {
      id: string,
      name: string
    }
  },
  repeat?: boolean,
  shuffle?: boolean
}

const DigitalScreen = (props: DigitalScreenProps) => {
  const { playedSeconds, duration, currentPlaying, repeat, shuffle } = props;
  
  return (
    <div className='flex w-full items-center relative px-4 md:px-0'>
      {/* Center container with absolute positioning */}
      <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
        <div className='flex flex-col items-center max-w-[60%]'>
          {currentPlaying && (
            <>
              <Link to={`/song/${currentPlaying.id}`} 
                    className='text-primary hover:text-primary-focus truncate digital-font pointer-events-auto'>
                <span className='text-lg tracking-widest'>{currentPlaying.title}</span>
              </Link>
              {currentPlaying.artist && (
                <Link to={`/artist/${currentPlaying.artist.id}`} 
                      className='text-base-content/70 hover:text-primary-focus truncate digital-font pointer-events-auto uppercase'>
                  <span className='text-l tracking-widest'>{currentPlaying.artist.name}</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right-aligned duration with mode indicators */}
      <div className='ml-auto pl-4 text-base-content/40 hover:text-base-content/50 hidden md:flex flex-col gap-1 pr-6'>
        <div className='flex digital-numbers'>
          {getDurationStr(playedSeconds * 1000)}
          -{getDurationStr(duration * 1000)}
        </div>
        { (repeat || shuffle) && (
          <div className='flex gap-2 justify-end text-sm'>
            {shuffle && (
              <Icon icon='faRandom' className='w-3 h-3' />
            )}
            {repeat && (
              <Icon icon='faSync' className='w-3 h-3' />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DigitalScreen 