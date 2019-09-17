import * as React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'

import * as types from '../../constants/ActionTypes'

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
    <button
      className='search-button button'
      onClick={toggleSearch}
    >
      <i className='fa fa-search'></i>
    </button>
  )
}

export default connect(
  (state: { search: any }) => ({
    searchToggled: state.search.searchToggled
  })
)(SearchButton)
