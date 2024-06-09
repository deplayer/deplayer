import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  collection: any,
  totalItems: number,
  current?: Boolean
}

const CollectionMenuItem = ({ collection, totalItems, current = false }: Props) => {
  const children = current ? (
    <ul>
      <MenuItem
        totalItems={totalItems}
        title='all'
        label='All'
        url='/collection'
        icon={<Icon icon='faDatabase' />}
      />
      <MenuItem
        totalItems={collection.mediaByType['video'].length}
        title='videos'
        label='Videos'
        url='/collection/video'
        icon={<Icon icon='faFilm' />}
      />
      <MenuItem
        totalItems={collection.mediaByType['audio'].length}
        title='Audio'
        label='Audio'
        url='/collection/audio'
        icon={<Icon icon='faFileAudio' />}
      />
    </ul>
  ) : null

  return (
    <MenuItem
      current={current}
      url='/collection'
      title='collection'
      label='Collection'
      icon={<Icon icon='faDatabase' />}
    >
      {children}
    </MenuItem>
  )
}

export default CollectionMenuItem
