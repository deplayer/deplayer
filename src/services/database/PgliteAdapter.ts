import { IAdapter, Models } from './IAdapter'
import * as db from './PgliteDatabase'
import { PgliteDatabase } from 'drizzle-orm/pglite'
import { eq } from 'drizzle-orm'
import { media, settings, queue, playlist } from '../../schema'

export default class Pglite implements IAdapter {
  initialize = async () => {
  }

  save = async (model: Models, id: string, payload: any): Promise<any> => {
    const fixedPayload = { id: id, ...payload }

    const instance = await db.get()
    console.log('instance:', instance)
    const prev = await this.getDocObj(model, id)

    switch (model) {
      case 'media':
        await instance.insert(media).values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: settings.id,
            set: payload,
          });
        break
      case 'settings':
        await instance.insert(settings)
          .values({ id: id, settings: payload })
          .onConflictDoUpdate({
            target: settings.id,
            set: { settings: payload },
          });
        break
      case 'queue':
        await instance.insert(queue)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: queue.id,
            set: payload,
          });
        break
      case 'playlist':
        await instance.insert(playlist)
          .values({ ...prev, ...fixedPayload })
          .onConflictDoUpdate({
            target: playlist.id,
            set: payload,
          });
        break
      default:
        console.log(`Model ${model} is not implemented for save method`)
        new Error(`Model ${model} not supported for save method`)
    }

    return fixedPayload
  }

  addMany = async (model: Models, payload: Array<any>): Promise<any> => {
    const inserts: Array<any> = []
    payload.forEach((item) => {
      const insertPromise = this.save(model, item.id, item)

      inserts.push(insertPromise)
    })

    const results = await Promise.all(inserts)
    return results
  }

  async removeMany(model: Models, payload: Array<string>): Promise<any> {
    for (let i = 0; i < payload.length; i++) {
      const object = await this.getDocObj(model, payload[i])
      object.remove()
    }
  }

  get = async (model: Models, id: string): Promise<any> => {
    return this.getDocObj(model, id)
  }

  getDocObj = async (model: Models, id: string): Promise<any> => {
    const instance = await db.get()

    switch (model) {
      case 'media':
        return instance.select().from(media).where(eq(media.id, id))
      case 'settings':
        return instance.select().from(settings).where(eq(settings.id, id))
      case 'queue':
        return instance.select().from(queue).where(eq(queue.id, id))
      case 'playlist':
        return instance.select().from(playlist).where(eq(playlist.id, id))
      default:
        console.log(`Model ${model} is not implemented for getDocObj method`)
        new Error('Model not supported')
    }
  }

  removeCollection = async (model: Models): Promise<any> => {
    throw new Error(`Remove collection for ${model} is not yet implemented`)
  }

  getAll = async (model: Models, _conditions: any = {}): Promise<any> => {
    const instance = await db.get()

    if (model === 'media') {
      const result = await instance.select().from(media)

      return result || []
    }
  }

  exportCollection = async (model: string): Promise<any> => {
    throw new Error(`Export collection for ${model} is not yet implemented`)
  }

  importCollection = async (model: string): Promise<any> => {
    throw new Error(`Import collection for ${model} is not yet implemented`)
  }

  getDb = (): Promise<PgliteDatabase> => {
    return db.get()
  }
}
