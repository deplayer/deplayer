import * as React from 'react'

import styles from './index.module.scss'

type Props = {
  onClick?: () => any,
  children: any
}

const Button = (props: Props) => {
  return (
    <button
      className={styles.button}
      onClick={props.onClick}
    >
      { props.children }
    </button>
  )
}

export default Button
