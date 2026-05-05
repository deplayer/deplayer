import { NormalizedMedia } from '../utils/normalizeMedia'

export interface ISearchService {
  search(searchTerm: string): Array<Promise<NormalizedMedia[]>>
}
