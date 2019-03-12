import * as React from 'react'
import { Dispatch, connect } from 'react-redux'

import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const SearchButton = ({dispatch}: Props) => {
  const toggleSearch = () => {
    dispatch({type: types.TOGGLE_SEARCH})
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

export default connect()(SearchButton)
