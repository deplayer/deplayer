import * as uuidv4 from 'uuid'

export default class Artist {
  id: string
  name: string

  constructor(articleParams: any = {}) {
    const { id } = articleParams
    this.id = id ? id : uuidv4()
  }

  static toSchema(): any {
    return {
      id: {
        type: 'string'
      },
      name: {
        type: 'string'
      }
    }
  }

  toDocument(): any {
    return {
      id: '' + this.id,
      name: this.name
    }
  }
}
