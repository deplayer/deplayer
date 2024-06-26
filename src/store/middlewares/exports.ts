import { Middleware } from 'redux'
import { State as RootState } from '../../reducers'
import * as types from '../../constants/ActionTypes'

const exportMiddleware: Middleware<{}, RootState> = _store => next => (action: any) => {
  if (action.type === types.EXPORT_COLLECTION_FINISHED) {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(action.exported)))
    element.setAttribute('download', 'collection-export.json')

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }
  return next(action)
}

export default exportMiddleware
