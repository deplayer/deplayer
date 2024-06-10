import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  totalItems: number,
  current?: Boolean
}

const ArtistsMenuItem = ({ totalItems, current = false }: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/artists'
      title='artists'
      label='Artists'
      icon={<Icon icon='faMicrophoneAlt' />}
    />
  )
}

export default ArtistsMenuItem
