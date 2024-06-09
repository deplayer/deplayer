import classnames from 'classnames'

import { Link } from 'react-router-dom'

type Props = {
  current?: boolean
}

const PlaylistButton = ({ current = false }: Props) => {
  const classNames = classnames({
    button: true,
    current: current
  })
  return (
    <div className={classNames}>
      <Link
        to="/"
        title="playlists"
      >
        <i className='icon music outline'></i>
      </Link>
    </div>
  )
}

export default PlaylistButton
