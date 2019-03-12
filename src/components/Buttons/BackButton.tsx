import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

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
      <i className='fa fa-times'></i>
    </button>
  )
}

const RoutedButton = withRouter(props => <BackButton {...props}/>)

export default connect()(RoutedButton)
