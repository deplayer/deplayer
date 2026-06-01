import { I18n } from 'react-redux-i18n'
import * as React from 'react'
import classNames from 'classnames'
import Icon from '../../common/Icon'

type Props = {
  loading: boolean,
  searchOpen: boolean,
  setSearchOff: () => void,
  onSearchChange: (event: React.FormEvent<HTMLInputElement>) => void,
  onFocus?: () => void,
  onBlur: () => void,
  value: string,
}

// Search input is the main place to perform a local collection filtering + search online providers for the criteria.
// If any search provider returns media it's automatically added to the local collection and included in the search results.
// Whenever this input is not being used (focused) it's automatically hidden and the regular topbar title is shown.
const SearchInput = (props: Props) => {
  if (!props.searchOpen) {
    return null;
  }

  const classes = classNames({
    'w-full': true,
    'p-3': true,
    'bg-transparent': true,
    'text-xl': true,
    'font-sans': true,
    'focus:outline-none': true,
    'focus:ring-0': true,
    'focus:border-none': true,
    action: true
  })

  return (
    <div
      className={'w-full flex bg-transparent border-b-4 border-accent items-center'}
    >
      <input
        className={classes}
        onChange={props.onSearchChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onKeyUp={(e) => e.key === 'Escape' && props.setSearchOff()}
        value={props.value}
        placeholder={I18n.t('placeholder.search')}
        type='text'
        data-testid="search-input"
      />
      <div className='p-2'>
        {props.loading ? <Icon icon='faSpinner' className='fa-pulse text-primary' /> : <Icon icon='faSearch' className='text-primary' />}
      </div>
    </div>
  )
}

export default SearchInput
