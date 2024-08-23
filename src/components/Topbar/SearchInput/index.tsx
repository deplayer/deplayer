import { I18n } from 'react-redux-i18n'
import * as React from 'react'
import classNames from 'classnames'
import Icon from '../../common/Icon'

type Props = {
  loading: boolean,
  searchToggled: boolean,
  setSearchOff: () => void,
  onSearchChange: (event: React.FormEvent<HTMLInputElement>) => void,
  onFocus?: () => void,
  onBlur: () => void,
  value: string,
}

const SearchInput = (props: Props) => {
  if (!props.searchToggled) {
    return null;
  }

  const classes = classNames({
    'w-full': true,
    'p-3': true,
    'bg-transparent': true,
    'dark:text-sky-100': true,
    'text-sky-900': true,
    'text-xl': true,
    'font-sans': true,
    'focus:outline-none': true,
    loading: props.loading,
    action: true
  })

  return (
    <div
      className={'w-full flex bg-transparent border-b-4 border-blue-400 items-center'}
    >
      <input
        className={classes}
        autoFocus={props.searchToggled}
        onChange={props.onSearchChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onKeyUp={(e) => e.key === 'Escape' && props.setSearchOff()}
        value={props.value}
        placeholder={I18n.t('placeholder.search')}
        type='text'
      />
      <div className='p-2'>
        {props.loading ? <Icon icon='faSpinner' className='fa-pulse' /> : <Icon icon='faSearch' />}
      </div>
    </div>
  )
}

export default SearchInput
