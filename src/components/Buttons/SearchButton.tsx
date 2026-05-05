import { useDispatch, useSelector } from 'react-redux'
import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'
import Icon from '../common/Icon'

const SearchButton = () => {
  const dispatch = useDispatch()
  const searchToggled = useSelector((state: { search: { searchToggled: boolean } }) => state.search.searchToggled)

  const toggleSearch = () => {
    dispatch({ type: types.TOGGLE_SEARCH })
  }

  if (searchToggled) {
    return null
  }

  return (
    <Button inverted transparent onClick={toggleSearch}>
      <Icon icon='faSearch' />
    </Button>
  )
}

export default SearchButton
