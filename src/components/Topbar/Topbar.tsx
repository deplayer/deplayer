import * as React from 'react'

import SearchInput from './SearchInput'
import SidebarButton from '../Buttons/SidebarButton'
import Title from './Title'
import * as types from '../../constants/ActionTypes'

type State = {
  focus: boolean,
}

type Props = {
  title?: string | React.ReactNode,
  dispatch: (params: any) => void,
  loading: boolean,
  showInCenter: boolean,
  children: React.ReactNode
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

  constructor(props: Props) {
    super(props);
    this.timer = null
  }

  // Handling searchTerm text change
  onSearchChange = (event: React.FormEvent<HTMLInputElement>) => {
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
      this.props.dispatch({
        type: types.START_SEARCH, searchTerm: this.props.searchTerm
      })
    }
  }

  onFocusOut = () => {
    this.setState({ focus: false })
    this.props.dispatch({ type: types.TOGGLE_SEARCH })
  }

  setSearchOn = () => {
    this.props.dispatch({ type: types.TOGGLE_SEARCH })
    this.setState({ focus: true })
  }

  setSearchOff = () => {
    this.props.dispatch({ type: types.TOGGLE_SEARCH_OFF })
    this.setState({ focus: false })
  }

  render() {
    const {
      children,
      title,
      searchTerm,
      searchToggled,
      loading
    } = this.props

    const childrenWithProps = React.Children.map(children, (child: any) =>
      React.cloneElement(child, { dispatch: this.props.dispatch })
    )

    return (
      <div className='topbar bg-gray-200/70 dark:bg-black/70 flex justify-between overflow-hidden z-20 items-center px-2' style={{ gridArea: 'topbar' }}>
        <SidebarButton />
        <SearchInput
          setSearchOff={this.setSearchOff}
          searchToggled={searchToggled}
          loading={loading}
          onSearchChange={this.onSearchChange}
          onBlur={this.onFocusOut}
          value={searchTerm}
        />
        {!this.state.focus && !this.props.searchToggled ? <Title title={title} onClick={this.setSearchOn} /> : null}
        <div className='flex justify-end'>
          {!this.state.focus && childrenWithProps}
        </div>
      </div>
    )
  }
}

export default Topbar
