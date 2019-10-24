import * as React from 'react'

import styles from './index.module.scss'

type Props = {
  children: any
}

const Tag = (props: Props) => {
  return (
    <span className={styles.tag}>
      { props.children }
    </span>
  )
}

export default Tag
