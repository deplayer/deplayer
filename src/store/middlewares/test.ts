import { expose } from 'threads'

expose(() => {
  console.log('running in worker')
})
