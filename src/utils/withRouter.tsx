import React from 'react'
import { useNavigate } from 'react-router'

export const withRouter = (Component: React.FC) => {
  const Wrapper = (props: any) => {
    const history = useNavigate();
    return <Component history={history} {...props} />
  }
  return Wrapper;
}
