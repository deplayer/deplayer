// @flow

import React from 'react'

type Props = {
  onClick: () => void,
  type: string
}

const SkipButton = (props: Props) => {
  return (
    <button
      onClick={props.onClick}
    >
      <i className={`icon step ${ props.type === 'next' ? 'forward': 'backward'}`}></i>
    </button>
  )
}

export default SkipButton
