// @flow

import { IAdapter } from './IAdapter'
import * as db from './RxdbDatabase'

export default class RxdbAdapter implements IAdapter {
  initialize = () => {
    db.get()
  }

  save = (model: string, id: string, payload: any): Promise<any> => {
    const doc = {...payload, _id: id}
    return db.get().then((instance) => {
      console.log('Upserting: ', doc)
      return instance[model].upsert(doc)
    })
  }

  addMany(model: string, payload: Array<any>): Promise<any> {
    const inserts = []
    payload.forEach((item) => {
      const insertPromise = this.addItem(item)

      inserts.push(insertPromise)
    })

    return new Promise((resolve, reject) => {
      Promise.all(inserts).then((results) => {
        console.log(results)
        resolve(results)
      })
        .catch((e) => {
          console.log(e)
          reject(e)
        })
    })
  }

  addItem = (item: any): Promise<any> => {
    return this.save('media', item.id, item)
  }

  get = (model: string, id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      return db.get().then((instance) => {

        const query = instance[model].findOne({_id: id})

        query.exec().then((result) => {
          if (result) {
            resolve(result.get())
          }

          resolve(null)
        })
          .catch((err) => {
            console.warn(err)
            reject(err)
          })
      })
    })
  }
}
