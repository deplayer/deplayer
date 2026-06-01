import Button from '../common/Button'
import Icon from '../common/Icon'
import { useUIStore } from '../../stores/uiStore'

const SearchButton = () => {
  const searchToggled = useUIStore((s) => s.searchToggled)
  const toggleSearch = useUIStore((s) => s.toggleSearch)

  if (searchToggled) {
    return null
  }

  return (
    <Button inverted transparent onClick={toggleSearch} aria-label="Search">
      <Icon icon='faSearch' />
    </Button>
  )
}

export default SearchButton
