import { ReactNode } from 'react'
import { Translate } from 'react-redux-i18n'
import Icon from '../Icon'
import { IconType } from '../Icon'

type Props = {
  title: string | ReactNode
  description?: string | ReactNode
  icon?: IconType
  action?: ReactNode
  className?: string
}

const EmptyState = ({
  title,
  description,
  icon,
  action,
  className = ''
}: Props) => {
  return (
    <div className={`flex flex-col h-full w-full max-w-screen-lg mx-auto ${className}`}>
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          {icon && (
            <div className='flex justify-center'>
              <Icon icon={icon} className='w-16 h-16 text-base-300' />
            </div>
          )}
          <h3 className='text-xl font-semibold'>
            {typeof title === 'string' ? <Translate value={title} /> : title}
          </h3>
          {description && (
            <p className='text-base-content/70'>
              {typeof description === 'string' ? <Translate value={description} /> : description}
            </p>
          )}
          {action && (
            <div className='pt-2'>
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmptyState 