import { Translate } from 'react-redux-i18n'

import Icon from '../common/Icon'
import Button from '../common/Button'

type Props = {
  providerKey: string
  onAdd: (providerKey: string) => void
}

const ProviderButton = (props: Props) => {
  const onClick = () => {
    props.onAdd(props.providerKey)
  }

  return (
    <Button
      inverted
      onClick={onClick}
      title={props.providerKey}
    >
      <Icon icon='faPlusCircle' className='mr-2' />
      <Translate value={`buttons.addProvider.${props.providerKey}`} />
    </Button>
  )
}

export default ProviderButton
