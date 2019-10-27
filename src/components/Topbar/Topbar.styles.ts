import styled from '@emotion/styled'

const TopbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  z-index: 1;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 10px;
  padding-right: 10px;
  grid-area: topbar;
  align-items: center;
  color: ${(props: any) =>
    props.primary ? 'hotpink' : 'turquoise'};
`

const TopbarContents = styled.div`
  display: flex;
  justify-content: flex-end;
`

export {
  TopbarContainer,
  TopbarContents
}
