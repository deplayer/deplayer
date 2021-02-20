import { IAdapter } from './IAdapter'
import * as db from './PouchdbDatabase'
import logger from '../../utils/logger'

export default class PouchdbAdapter implements IAdapter {
  initialize = async () => {
    await db.get()
  }

  save = async (model: string, id: string, payload: any): Promise<any> => {
    const fixedPayload = {_id: id, ...payload, type: model}

    const instance = await db.get()

    try {
      const prev = await instance.get(id)
      await instance.put({...prev, ...fixedPayload})
    } catch {
      await instance.put(fixedPayload)
    }

    return fixedPayload
  }

  addMany = async (model: string, payload: Array<any>): Promise<any> => {
    const inserts: Array<any> = []
    payload.forEach((item) => {
      const insertPromise = this.addItem(model, item)

      inserts.push(insertPromise)
    })

    const results = await Promise.all(inserts)
    return results
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

    return this.getDocObj(model, id)
  }

  getDocObj = async (model: string, id: string): Promise<any> => {
    const instance = await db.get()

    return instance.get(id, {attachments: true})
  }

  removeCollection = async (model: string): Promise<any> => {
    const dbInst  = await db.get()
    await dbInst[model].remove()
  }

  getAll = (model: string, conditions: any = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      return db.get().then(async (instance) => {

        logger.log('RxdbDatabase', 'Querying all database')
        const result = await instance.query((doc: any, emit: any) => {
          if (doc.type === model) {
            emit(doc)
          }
        }, {type: model}, {attachments: true})

        if (result) {
          // FIXME: This elem.key should be elem.value maybe?
          resolve(result.rows.map((elem: any) => elem.key))
        }

        resolve(null)
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
