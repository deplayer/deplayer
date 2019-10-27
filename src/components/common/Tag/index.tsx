/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import fonts from '../../../styles/fonts'

type Props = {
  children: any
  type?: 'primary'
}

const style = css`
  padding: 4px;
  font-family: ${fonts.fontFamily};
  font-size: ${fonts.small};
  border: solid 1px;
`

const Tag = (props: Props) => {
  return (
    <span css={style}>
      { props.children }
    </span>
  )
}

export default Tag
