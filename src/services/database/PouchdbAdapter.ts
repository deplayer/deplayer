import { IAdapter } from './IAdapter'
import * as db from './PouchdbDatabase'
import logger from '../../utils/logger'

export default class PouchdbAdapter implements IAdapter {
  initialize = async () => {
    await db.get()
  }

  save = async (model: string, id: string, payload: any): Promise<any> => {
    const fixedPayload = {_id: id, ...payload}

    const instance = await db.get()
    return instance[model].atomicUpsert(fixedPayload)
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
          logger.log('RxdbDatabase', e)
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
          logger.log('RxdbDatabase', e)
          reject(e)
        })
    })
  }

  addItem = (model: string, item: any): Promise<any> => {
    return this.save(model, item.id, item)
  }

  get = async (model: string, id: string): Promise<any> => {
    await db.get()

    const result = await this.getDocObj(model, id)
    if (!result) {
      logger.log('RxdbAdapter', 'Result for %s with id %s not found', model, id)
      return
    }

    return result.get()
  }

  getDocObj = async (model: string, id: string): Promise<any> => {
    const instance = await db.get()

    if (!instance[model]) {
      logger.log('RxdbAdapter', 'no instance model found for', model)
      return
    }

    return instance[model].findOne({_id: id}).exec()
  }

  removeCollection = async (model: string): Promise<any> => {
    const dbInst  = await db.get()
    await dbInst[model].remove()
  }

  getAll = (model: string, conditions: any = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      return db.get().then((instance) => {

        const query = instance[model].find()

        query.exec().then((result) => {
          if (result) {
            resolve(Promise.all(result))
          }

          resolve(null)
        })
          .catch((err: Error) => {
            logger.warn('RxdbDatabase', err)
            reject(err)
          })
      })
    })
  }

  getQueryObj = (model: string): Promise<any> => {
    const instance = db.get()
    return instance[model].find()
  }

  exportCollection = async (model: string): Promise<any> => {
    const instance = await db.get()
    return instance[model].dump()
  }

  importCollection = async (model: string, data: any): Promise<any> => {
    const instance = await db.get()
    await db.createCollections(instance, [model])
    return instance[model].importDump(data)
  }

  getDb = (): Promise<any> => {
    return db.get()
  }
}
