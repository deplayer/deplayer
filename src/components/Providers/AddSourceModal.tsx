import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'

import providerRegistry from '../../services/settings/providers'
import Modal from '../common/Modal'

type Variant = 'modal' | 'inline'

type Props = {
  open: boolean
  configuredKeys: string[]
  onPick: (providerKey: string) => void
  onClose: () => void
  variant?: Variant
}

type TileProps = {
  providerKey: string
  alreadyConfigured: boolean
  onPick: (providerKey: string) => void
}

const Tile = ({ providerKey, alreadyConfigured, onPick }: TileProps) => {
  const schema = providerRegistry[providerKey]
  const disabled = alreadyConfigured && !schema.repeatable
  const onClick = () => { if (!disabled) onPick(providerKey) }

  return (
    <button
      type="button"
      data-testid={`add-source-tile-${providerKey}`}
      disabled={disabled}
      onClick={onClick}
      aria-disabled={disabled}
      className={classNames(
        'text-left p-4 rounded-lg border border-base-300 bg-base-100',
        'transition-colors',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-primary hover:bg-base-200',
      )}
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="font-medium">
          <Translate value={schema.label} />
        </span>
        {disabled && (
          <span className="text-xs uppercase tracking-wide opacity-70">
            <Translate value="providers.connectedBadge" />
          </span>
        )}
      </div>
      <p className="text-sm opacity-70 mb-3">
        <Translate value={`providers.descriptions.${providerKey}`} />
      </p>
      <div className="flex flex-wrap gap-1.5">
        {schema.capabilities.map(cap => (
          <span
            key={cap}
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-base-300/60"
          >
            <Translate value={`providers.capabilities.${cap}`} />
          </span>
        ))}
      </div>
    </button>
  )
}

const Grid = ({ configuredKeys, onPick }: Pick<Props, 'configuredKeys' | 'onPick'>) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Object.keys(providerRegistry).map(key => (
      <Tile
        key={key}
        providerKey={key}
        alreadyConfigured={configuredKeys.includes(key)}
        onPick={onPick}
      />
    ))}
  </div>
)

export const AddSourceModal = ({ open, configuredKeys, onPick, onClose, variant = 'modal' }: Props) => {
  if (!open) return null

  const handlePick = (key: string) => {
    onPick(key)
    onClose()
  }

  if (variant === 'inline') {
    return <Grid configuredKeys={configuredKeys} onPick={handlePick} />
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Add source">
      <div className="pt-2">
        <Grid configuredKeys={configuredKeys} onPick={handlePick} />
      </div>
    </Modal>
  )
}

export default AddSourceModal
