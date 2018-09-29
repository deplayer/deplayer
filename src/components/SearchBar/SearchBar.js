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
    this.props.dispatch({type: START_SEARCH})
  }

  render() {
    return (
      <div className='search-bar'>
        <input onChange={this.onSearchChange} type='text' />
        <button onClick={this.startSearch} type='submit'>Search!</button>
      </div>
    )
  }
}

export default SearchBar
