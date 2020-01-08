import { spawn, Worker } from 'threads'

const workers = (store: any) => (next: any) => async (action: any) => {
  const collection = await spawn(new Worker('./exposed-collection'))
  const newState = await collection(
    store.getState().collection,
    action
  )

  console.log('newState: ', newState)
  return next(action)
}

export default workers
