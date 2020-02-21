type Action = any

const alerts = store => next => (action: Action) => {
  return next(action)
}

export default alerts
