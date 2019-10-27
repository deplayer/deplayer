/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import fonts from '../../../styles/fonts'
import colors from '../../../styles/colors'

type Props = {
  children: any
  type?: 'primary'
}

const style = css`
  line-height: 1.5;
  padding: 4px;
  color: white;
  background-color: ${colors.primary};
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
