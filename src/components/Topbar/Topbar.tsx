import * as React from 'react'
import { Dispatch } from 'redux'
import KeyHandler, {KEYPRESS} from 'react-key-handler'
import { I18n } from 'react-redux-i18n'

import ConnectionStatus from '../Connection/ConnectionStatus'
import * as types from '../../constants/ActionTypes'

type State = {
  focus: boolean,
}

type Props = {
  dispatch: Dispatch,
  loading: boolean,
  showInCenter: boolean,
  children: any,
  searchTerm: string,
  searchToggled: boolean,
  error: string
}

const WAIT_INTERVAL = 1000
const ENTER_KEY = 13

class Topbar extends React.Component<Props, State> {
  state = {
    focus: false
  }
  timer: any
  searchInput: any
  props: Props

  constructor(props: Props){
    super(props);

    this.props = props
    this.timer = null
  }

  // Handling searchTerm text change
  onSearchChange = (event:  React.FormEvent<HTMLInputElement>) => {
    clearTimeout(this.timer)
    this.props.dispatch({
      type: types.SET_SEARCH_TERM,
      searchTerm: event.currentTarget.value
    })
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
    if (this.props.searchTerm) {
      this.props.dispatch( {
        type: types.START_SEARCH, searchTerm: this.props.searchTerm
      })
    }
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

  renderSearch = (props) => {
    if (!props.searchToggled) {
      return null;
    }

    return (
      <div
        className={`search-bar ui huge action icon input inverted ${this.props.loading ? 'loading': ''}`}
      >
        <input
          ref={(input) => { this.searchInput = input }}
          onChange={this.onSearchChange}
          onFocus={this.onFocus}
          onBlur={this.onFocusOut}
          value={this.props.searchTerm}
          placeholder={ I18n.t('placeholder.search') }
          type='text'
        />
        { this.props.loading ? <i className='icon fa fa-spinner'></i> : <i className='icon search'></i> }
        { this.props.error ?  <div className='alert search'>{ this.props.error }</div> : null }
      </div>
    )
  }

  render() {
    const { children } = this.props

    const childrenWithProps = React.Children.map(children, child =>
      React.cloneElement(child, { dispatch: this.props.dispatch })
    )

    return (
      <React.Fragment>
        <div className={`sidebar-container ${ this.props.showInCenter ? '': 'has-results'}`}>
          <KeyHandler
            keyEventName={KEYPRESS}
            keyValue='/'
            onKeyHandle={this.setFocus}
          />
          <ConnectionStatus />
          { this.renderSearch(this.props) }
          {  !this.state.focus ? childrenWithProps : null }
        </div>
      </React.Fragment>
    )
  }
}

export default Topbar