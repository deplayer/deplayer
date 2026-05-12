import { memo } from 'react'
import { Translate } from 'react-redux-i18n'
import Icon from '../common/Icon'

export type SortMode = 'default' | 'alphabetical' | 'trackCount'

const OPTIONS: Array<{ mode: SortMode; labelKey: string }> = [
  { mode: 'default', labelKey: 'sort.default' },
  { mode: 'alphabetical', labelKey: 'sort.alphabetical' },
  { mode: 'trackCount', labelKey: 'sort.trackCount' },
]

type Props = {
  value: SortMode
  onChange: (mode: SortMode) => void
}

const PlaylistRowSortMenu = memo(({ value, onChange }: Props) => (
  <div className="dropdown dropdown-end">
    <button
      type="button"
      tabIndex={0}
      className="btn btn-ghost btn-sm btn-circle"
      aria-label="Sort"
    >
      <Icon icon="faStream" />
    </button>
    <ul
      tabIndex={0}
      className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-48"
    >
      {OPTIONS.map(opt => (
        <li key={opt.mode}>
          <button
            type="button"
            className={value === opt.mode ? 'active' : ''}
            onClick={() => onChange(opt.mode)}
          >
            {value === opt.mode && <Icon icon="faCheck" className="mr-2" />}
            <Translate value={opt.labelKey} />
          </button>
        </li>
      ))}
    </ul>
  </div>
))

export default PlaylistRowSortMenu
