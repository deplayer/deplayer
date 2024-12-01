export interface IMusicProvider {
  providerKey: string;
  search(searchTerm: string): Promise<Array<any>>;
  fullSync?(): Promise<Array<any>>;
}
