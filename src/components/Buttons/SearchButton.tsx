import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import * as React from 'react'

import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'
import Icon from '../common/Icon'

type Props = {
  dispatch: Dispatch,
  searchToggled: boolean
}

const SearchButton = ({dispatch, searchToggled}: Props) => {
  const toggleSearch = () => {
    dispatch({type: types.TOGGLE_SEARCH})
  }

  if (searchToggled) {
    return null
  }

  return (
    <Button
      transparent
      onClick={toggleSearch}
    >
      <Icon icon='faSearch' />
    </Button>
  )
}

export default connect(
  (state: { search: any }) => ({
    searchToggled: state.search.searchToggled
  })
)(SearchButton)
