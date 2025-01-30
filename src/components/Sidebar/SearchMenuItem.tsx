import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: boolean,
  totalItems: number
}

const SearchMenuItem = ({ current = false, totalItems }: Props) => {
  return (
    <MenuItem
      current={current}
      totalItems={totalItems}
      url='/search-results'
      title="menu.search"
      label="menu.search"
      icon={<Icon icon='faSearch' />}
      translate={true}
    />
  )
}

export default SearchMenuItem
