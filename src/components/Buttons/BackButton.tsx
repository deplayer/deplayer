import { connect } from 'react-redux'
import Icon from '../common/Icon'

type Props = {
  history: any
}

const BackButton = (props: Props) => {
  const goBack = () => {
    props.history.goBack()
  }
  return (
    <button
      className='back-button button'
      onClick={goBack}
    >
      <Icon icon='faTimes' />
    </button>
  )
}

const RoutedButton = (props: Props) => <BackButton {...props} />

export default connect()(RoutedButton)
