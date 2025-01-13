import CenteredMessage from './common/CenteredMessage'

type Props = {
  message: React.ReactNode
  showFooter?: boolean
}

const BodyMessage = ({ message, showFooter = true }: Props) => {
  return (
    <CenteredMessage showFooter={showFooter}>
      <div className='text-center'>
        {message}
      </div>
    </CenteredMessage>
  )
}

export default BodyMessage
