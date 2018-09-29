// @flow

import React, { Component } from 'react';
import { Dispatch } from 'redux'

import { START_SEARCH } from '../../constants/ActionTypes'

type State = {
  searchTerm: string
}

type Props = {
  dispatch: Dispatch
}

class SearchBar extends Component<Props, State> {
  state = {
    searchTerm: ''
  }

  onSearchChange = (event: SyntheticInputEvent<EventTarget>) => {
    this.setState({ searchTerm: event.target.value})
  }

  startSearch = () => {
    this.props.dispatch( {
      type: START_SEARCH, searchTerm: this.state.searchTerm
    })
  }

  render() {
    return (
      <div className='search-bar ui huge action input'>
        <input
          onChange={this.onSearchChange}
          placeholder='Search'
          type='text'
        />
        <button
          className='ui huge button'
          onClick={this.startSearch}
          type='submit'
        >
          Search!
        </button>
      </div>
    )
  }
}

export default SearchBar
