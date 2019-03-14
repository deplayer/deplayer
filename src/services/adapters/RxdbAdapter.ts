import { IAdapter } from './IAdapter'
import * as db from './RxdbDatabase'

export default class RxdbAdapter implements IAdapter {
  initialize = () => {
    db.get()
  }

  save = (model: string, id: string, payload: any): Promise<any> => {
    const fixedPayload = {_id: id, ...payload}
    return db.get().then((instance) => {
      return instance[model].upsert(fixedPayload)
    })
  }

  addMany(model: string, payload: Array<any>): Promise<any> {
    const inserts: Array<any> = []
    payload.forEach((item) => {
      const insertPromise = this.addItem(model, item)

      inserts.push(insertPromise)
    })

    return new Promise((resolve, reject) => {
      Promise.all(inserts).then((results) => {
        resolve(results)
      })
        .catch((e) => {
          console.warn(e)
          reject(e)
        })
    })
  }

  removeMany(model: string, payload: Array<string>): Promise<any> {
    const removes: Array<any> = []
    payload.forEach((item) => {
      const removePromise = this.getDocObj(model, item).then((doc) => doc.remove() )

      removes.push(removePromise)
    })

    return new Promise((resolve, reject) => {
      Promise.all(removes).then((results) => {
        resolve(results)
      })
        .catch((e) => {
          console.warn(e)
          reject(e)
        })
    })
  }

  addItem = (model: string, item: any): Promise<any> => {
    return this.save(model, item.id, item)
  }

  get = (model: string, id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      return db.get().then((instance) => {
        this.getDocObj(model, id).then((result) => {
          if (!result) {
            console.log('Result for %s with id %s not found', model, id)
            return resolve()
          }

          return resolve(result.get())
        })
          .catch((err) => {
            console.warn(err)
            reject(err)
          })
      })
    })
  }

  getDocObj = (model: string, id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      return db.get().then((instance) => {

        const query = instance[model].findOne({_id: id})

        query.exec().then((result) => {
          if (result) {
            resolve(result)
          }

          resolve()
        })
          .catch((err) => {
            console.warn(err)
            reject(err)
          })
      })
    })
  }

  removeCollection = (model: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      return db.get().then((instance) => {
        return instance[model].remove()
      })
    })
  }

  getAll = (model: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      return db.get().then((instance) => {

        const query = instance[model].find()

        query.exec().then((result) => {
          if (result) {
            resolve(Promise.all(result))
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