import * as React from 'react'

import MenuItem from './MenuItem'

type Props = {
  collection: any,
  totalItems: number,
  current?: Boolean
}

const CollectionMenuItem = ({collection, totalItems, current = false}: Props) => {
  const children = current ? (
    <ul>
      <MenuItem
        totalItems={totalItems}
        title='all'
        label='All'
        url='/collection'
        iconClasses='icon database outline'
      />
      <MenuItem
        totalItems={collection.mediaByType['video'].length}
        title='videos'
        label='Videos'
        url='/collection/video'
        iconClasses='fa fa-film outline'
      />
      <MenuItem
        totalItems={collection.mediaByType['audio'].length}
        title='Audio'
        label='Audio'
        url='/collection/audio'
        iconClasses='fa fa-file-audio-o outline'
      />
    </ul>
  ) : null

  return (
    <MenuItem
      current={current}
      url='/collection'
      title='collection'
      label='Collection'
      iconClasses='icon database outline'
    >
      { children }
    </MenuItem>
  )
}

export default CollectionMenuItem
