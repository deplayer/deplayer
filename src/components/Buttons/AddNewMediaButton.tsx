import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import * as React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  history: any
}

const AddNewMediaButton = (props: Props) => {
  const goBack = () => {
    props.history.push('/add-new-media')
  }

  return (
    <Button
      transparent
      onClick={goBack}
    >
      <Icon
        icon='faPlusCircle'
        className='mx-2'
      />
      <Translate value='buttons.addNewMedia' />
    </Button>
  )
}

const RoutedButton = withRouter(props => <AddNewMediaButton {...props}/>)
export default connect()(RoutedButton)
