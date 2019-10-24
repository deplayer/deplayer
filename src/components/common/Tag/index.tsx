import * as React from 'react'
import classNames from 'classnames/bind'

import styles from './index.module.scss'

const cx = classNames.bind(styles)

type Props = {
  children: any
  type?: 'primary'
}

const Tag = (props: Props) => {
  return (
    <span className={cx(styles.tag, props.type)}>
      { props.children }
    </span>
  )
}

export default Tag
