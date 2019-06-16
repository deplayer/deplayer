import * as React from 'react'

const Title = (props) => {
  return (
    <div>
      <h2 onClick={props.onClick}>
        { props.title }
      </h2>
    </div>
  )
}

export default Title
