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

    this.props.dispatch( {
      type: START_SEARCH, searchTerm: this.state.searchTerm
    })
  }

  render() {
    return (
      <div className='search-bar ui huge action icon input'>
        <input
          onChange={this.onSearchChange}
          placeholder='Search'
          type='text'
        />
        <i class="search icon"></i>
      </div>
    )
  }
}

export default SearchBar
