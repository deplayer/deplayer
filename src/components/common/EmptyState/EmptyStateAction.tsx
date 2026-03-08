import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import Icon, { IconType } from '../Icon'

type Props = {
  to: string
  icon: IconType
  label: string
}

const EmptyStateAction = ({ to, icon, label }: Props) => (
  <Link to={to} className="btn btn-primary">
    <Icon icon={icon} className="mr-2" />
    <Translate value={label} />
  </Link>
)

export default EmptyStateAction
