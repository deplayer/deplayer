import Reduxie from './Reduxie';
import { Dispatch } from 'redux';

const getReduxieState = async (dbName: string, dispatch: Dispatch) => {
  const db = new Reduxie(dbName)
  console.log('reduxie db ', db)
  try {
    await db.open()
    console.log('database opened ')
    const table = db.table('state')
    const collection = table.toCollection()
    const last = collection.last()
    return last
  } catch (e) {
    console.error(e)
  }
}

export const invalidateReduxie = async (dbName: string) => {
  const db = new Reduxie(dbName)
  await db.delete()
}

export default getReduxieState;
