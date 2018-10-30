// @flow

import React, { Component } from 'react';
import { Dispatch } from 'redux'
import KeyHandler, {KEYPRESS} from 'react-key-handler'
import { I18n } from 'react-redux-i18n'

import { START_SEARCH } from '../../constants/ActionTypes'
import PlaylistButton from '../PlaylistButton'
import CollectionButton from '../CollectionButton'
import SettingsButton from '../Buttons/SettingsButton'

type State = {
  searchTerm: string,
  focus: boolean,
}

type Props = {
  dispatch: Dispatch,
  loading: boolean,
  showInCenter: boolean,
  error: string
}

const WAIT_INTERVAL = 1000
const ENTER_KEY = 13

class SearchBar extends Component<Props, State> {
  state = {
    searchTerm: '',
    focus: false
  }
  timer: any
  searchInput: any

  componentWillMount() {
    this.timer = null
  }

  // Handling searchTerm text change
  onSearchChange = (event: SyntheticInputEvent<EventTarget>) => {
    clearTimeout(this.timer)
    this.setState({ searchTerm: event.target.value})
    this.timer = setTimeout(this.triggerChange, WAIT_INTERVAL)
  }

  // Handling enter keydown in search bar
  handleKeyDown(e: KeyboardEvent) {
    if (e.keyCode === ENTER_KEY) {
      this.triggerChange()
    }
  }

  // Starting to search when the user press enter key or stops to writte in the interval
  triggerChange = () => {
    this.props.dispatch( {
      type: START_SEARCH, searchTerm: this.state.searchTerm
    })
  }

  setFocus = () => {
    this.searchInput.focus()
  }

  onFocus = () => {
    this.setState({focus: true})
  }

  onFocusOut = () => {
    this.setState({focus: false})
  }

  render() {
    return (
      <React.Fragment>
        <div className={`sidebar-container ${ this.props.showInCenter ? '': 'has-results'}`}>
          <KeyHandler
            keyEventName={KEYPRESS}
            keyValue='/'
            onKeyHandle={this.setFocus}
          />
          <div className={`search-bar ui huge action icon input inverted ${this.props.loading ? 'loading': ''}`}>
            <input
              ref={(input) => { this.searchInput = input }}
              onChange={this.onSearchChange}
              onFocus={this.onFocus}
              onBlur={this.onFocusOut}
              placeholder={ I18n.t('placeholder.search') }
              type='text'
            />
            <i className='icon search'></i>
          </div>
          {
            !this.state.focus ?
              <React.Fragment>
                <PlaylistButton />
                <CollectionButton />
                <SettingsButton />
              </React.Fragment>: null
          }
        </div>
        { this.props.error ?  <div className='alert search'>{ this.props.error }</div> : null }
      </React.Fragment>
    )
  }
}

export default SearchBar
