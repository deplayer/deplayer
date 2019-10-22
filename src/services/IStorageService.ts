export interface IStorageService {
  save(id: string, payload: any): Promise<any>
}
