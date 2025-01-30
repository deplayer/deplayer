import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: boolean
}

const SettingsMenuItem = ({ current = false }: Props) => {
  return (
    <MenuItem
      current={current}
      url='/settings'
      title="labels.generalSettings"
      label="labels.generalSettings"
      icon={<Icon icon='faCogs' />}
      translate={true}
    />
  )
}

export default SettingsMenuItem
