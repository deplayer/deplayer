import React from 'react'
import Footer from '../../Footer'

type Props = {
  children: React.ReactNode
  showFooter?: boolean
}

const CenteredMessage = ({ children, showFooter = true }: Props) => {
  return (
    <div className='flex flex-col h-full w-full max-w-screen-lg mx-auto'>
      <div className='flex-1 flex items-center justify-center'>
        {children}
      </div>
      {showFooter && (
        <Footer />
      )}
    </div>
  )
}

export default CenteredMessage 