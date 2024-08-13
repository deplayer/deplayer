import Icon from './common/Icon'

export default function ServiceIcon({ service }: { service: string }): React.ReactNode {
  switch (service) {
    case 'filesystem':
      return <Icon className='mr-2' icon='faHardDrive' />
    default:
      return <Icon className='mr-2' icon='faGlobe' />
  }
}

