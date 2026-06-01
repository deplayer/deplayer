import { I18n } from 'react-redux-i18n'

import Modal from '../common/Modal'
import AddSourcePicker from './AddSourcePicker'

type Props = {
  open: boolean
  configuredKeys: string[]
  onPick: (providerKey: string) => void
  onClose: () => void
}

export const AddSourceModal = ({ open, configuredKeys, onPick, onClose }: Props) => {
  if (!open) return null
  return (
    <Modal isOpen onClose={onClose} title={I18n.t('providers.addSource')}>
      <div className="pt-2">
        <AddSourcePicker
          configuredKeys={configuredKeys}
          onPick={key => { onPick(key); onClose() }}
        />
      </div>
    </Modal>
  )
}

export default AddSourceModal
