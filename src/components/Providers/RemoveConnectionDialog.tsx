import { Translate, I18n } from 'react-redux-i18n'

import Modal from '../common/Modal'

type Props = {
  instanceKey: string
  name: string
  onConfirm: () => void
  onClose: () => void
}

export const RemoveConnectionDialog = ({ name, onConfirm, onClose }: Props) => {
  const title = I18n.t('providers.remove.title', { name })

  return (
    <Modal isOpen onClose={onClose} title={title}>
      <p className="py-4 opacity-80">
        <Translate value="providers.remove.body" />
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          <Translate value="providers.remove.cancel" />
        </button>
        <button
          type="button"
          className="btn btn-error btn-sm"
          onClick={() => { onConfirm(); onClose() }}
        >
          <Translate value="providers.remove.confirm" />
        </button>
      </div>
    </Modal>
  )
}

export default RemoveConnectionDialog
