import * as React from 'react'
import { connect } from 'react-redux'
import Icon fom '../common/Icon'

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

const RoutedButton = props => <BackButton {...props} />

export default connect()(RoutedButton)
