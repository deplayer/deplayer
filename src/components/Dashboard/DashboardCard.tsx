import { ReactNode, ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon'

type Props = {
  title: string
  icon: ComponentProps<typeof Icon>['icon']
  children: ReactNode
  seeAllLink?: string
  className?: string
}

const DashboardCard = ({ title, icon, children, seeAllLink, className = '' }: Props) => {
  return (
    <div data-testid="dashboard-card" className={`bg-base-200 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon icon={icon} />
          {title}
        </h3>
        {seeAllLink && (
          <Link data-testid="see-all-link" to={seeAllLink} className="text-sm text-primary hover:text-primary-focus">
            See all
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

export default DashboardCard
