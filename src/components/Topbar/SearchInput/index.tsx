import { I18n } from 'react-redux-i18n'
import * as React from 'react'
import classNames from 'classnames'

type Props = {
  ref: any,
  loading: boolean,
  searchToggled: boolean,
  onSearchChange: (event:  React.FormEvent<HTMLInputElement>) => void,
  onFocus: () => void,
  onBlur: () => void,
  value: string,
}

const SearchInput = (props: Props) => {
  if (!props.searchToggled) {
    return null;
  }

  const classes = classNames({
    'search-bar': true,
    ui: true,
    'w-full': true,
    'p-3': true,
    'bg-transparent': true,
    'text-blue-100': true,
    'text-xl': true,
    'font-sans': true,
    'focus:outline-none': true,
    huge: true,
    icon: true,
    input: true,
    inverted: true,
    loading: props.loading,
    action: true
  })

  return (
    <div
      className={'w-full flex bg-transparent border-b-4 border-blue-400 items-center'}
    >
      <input
        className={classes}
        autoFocus
        ref={props.ref}
        onChange={props.onSearchChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        value={props.value}
        placeholder={ I18n.t('placeholder.search') }
        type='text'
      />
      <div className='p-3'>
        { props.loading ? <i className='icon fa fa-spinner fa-pulse'></i> : <i className='icon search'></i> }
      </div>
    </div>
  )
}

export default SearchInput
