import * as React from 'react'
import { react as Index } from '../../README.md'
import MainContainer from '../common/MainContainer'

const Wiki = () => {
  return (
    <MainContainer centerContents>
      <div className='markdown'>
        <Index />
      </div>
    </MainContainer>
  )
}

export default Wiki
