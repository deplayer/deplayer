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
      <div className='absolute inset-0 flex flex-col md:items-center justify-center pointer-events-none'>
        <div className='flex flex-col md:items-center px-4 md:px-0'>
          {currentPlaying && (
            <>
              <Link to={`/song/${currentPlaying.id}`} 
                    className='text-primary hover:text-primary-focus truncate pointer-events-auto text-left md:text-center'>
                <span className='text-lg tracking-widest truncate'>{currentPlaying.title}</span>
              </Link>
              {currentPlaying.artist && (
                <Link to={`/artist/${currentPlaying.artist.id}`} 
                      className='text-base-content/70 hover:text-primary-focus truncate pointer-events-auto uppercase'>
                  <span className='text-sm tracking-widest'>{currentPlaying.artist.name}</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right-aligned duration with mode indicators */}
      <div className='ml-auto pl-4 text-primary/60 hover:text-primary/50 hidden md:flex flex-col gap-1 pr-4 mr-3 p-1 border-r border-base-content/20'>
        <div className='digital-font text-right font-bold'>
          {getDurationStr(playedSeconds * 1000)}
          -{getDurationStr(duration * 1000)}
        </div>
        { (repeat || shuffle) && (
          <div className='flex gap-2 justify-end text-sm digital-font'>
            {shuffle && (
              <Icon icon='faRandom' className='w-3 h-3 glow' />
            )}
            {repeat && (
              <Icon icon='faSync' className='w-3 h-3 glow' />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DigitalScreen 