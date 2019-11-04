import styled from '@emotion/styled'
import fonts from '../../../styles/fonts'
import colors from '../../../styles/colors'
import sizes from '../../../styles/sizes'

const Tag = styled.div`
  line-height: 1.5;
  padding: 4px;
  color: white;
  background-color: ${props => colors[props.type]};
  font-family: ${fonts.fontFamily};
  font-size: ${fonts.small};
  border-radius: ${sizes.base};
`

export {
  Tag
}
