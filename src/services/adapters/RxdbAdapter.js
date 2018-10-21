// @flow

import { IAdapter } from './IAdapter'
import * as db from './RxdbDatabase'

export default class RxdbAdapter implements IAdapter {
  initialize = () => {
    db.get()
  }

  save = (model: string, id: string, payload: any): Promise<any> => {
    const doc = {...payload, _id: id}
    return new Promise((resolve, reject) => {
      db.get().then((instance) => {

        instance[model].upsert(doc).then((result) => {
          resolve(result)
        })
          .catch((err) => {
            reject(err)
          })
      })
    })
  }

  get = (model: string, id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      db.get().then((instance) => {

        const query = instance[model].findOne({_id: id})

        query.exec().then((result) => {
          resolve(result.get())
        })
          .catch((err) => {
            console.warn(err)
            reject(err)
          })
      })
    })
  }
}
