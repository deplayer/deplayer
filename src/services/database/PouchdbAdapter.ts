import { IAdapter } from './IAdapter'
import * as db from './PouchdbDatabase'
import logger from '../../utils/logger'

const cb = (_err: any) => {
}

export default class PouchdbAdapter implements IAdapter {
  initialize = async () => {
  }

  save = async (model: string, id: string, payload: any): Promise<any> => {
    const fixedPayload = { _id: id, ...payload, type: model }

    const instance = await db.get()

    try {
      const prev = await instance.get(id, {}, cb)
      await instance.put({ ...prev, ...fixedPayload })
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

  async removeMany(model: string, payload: Array<string>): Promise<any> {
    for (let i = 0; i < payload.length; i++) {
      const object = await this.getDocObj(model, payload[i])
      object.remove()
    }
  }

  addItem = (model: string, item: any): Promise<any> => {
    return this.save(model, item.id, item)
  }

  get = async (model: string, id: string): Promise<any> => {
    await db.get()

    return this.getDocObj(model, id)
  }

  getDocObj = async (_model: string, id: string): Promise<any> => {
    const instance = await db.get()

    return instance.get(id, { attachments: true }, cb)
  }

  removeCollection = async (model: string): Promise<any> => {
    const dbInst = await db.get()
    await dbInst[model].remove()
  }

  getAll = async (model: string, _conditions: any = {}): Promise<any> => {
    return new Promise(async (resolve, _reject) => {
      const instance = await db.get()

      logger.log('PouchDB', 'Querying all database')
      const result = await instance.query(
        'deplayer/by_type',
        { key: model, include_docs: true },
        {
          attachments: true
        }
      )

      if (result) {
        console.log('getAll result: ', result)

        // FIXME: This elem.key should be elem.value maybe?
        resolve(result.rows.map((elem: any) => elem.doc))
      }

      resolve(null)
    })
  }

  exportCollection = async (model: string): Promise<any> => {
    const instance = await db.get()
    return instance[model].dump()
  }

  importCollection = async (model: string, data: any): Promise<any> => {
    const instance = await db.get()
    return instance[model].importDump(data)
  }

  getDb = (): Promise<PouchDB.Database> => {
    return db.get()
  }
}
