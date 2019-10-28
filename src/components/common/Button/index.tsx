/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import fonts from '../../../styles/fonts'
import colors from '../../../styles/colors'
import distances from '../../../styles/distances'

type Props = {
  onClick?: () => any,
  children: any,
  className?: string
}

const styles = css`
  border: none;
  cursor: pointer;
  padding: ${distances.base};
  font-family: ${fonts.fontFamily};
  color: ${colors.primary100};
  background-color: ${colors.primary};
`

const Button = (props: Props) => {
  return (
    <button
      css={styles}
      className={props.className}
      onClick={props.onClick}
    >
      { props.children }
    </button>
  )
}

export default Button