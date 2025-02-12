import CollectionService from "./CollectionService";
import ProvidersService from "./ProvidersService";
import Media from "../entities/Media";
import logger from "../utils/logger";

export interface SearchOptions {
  noRedirect?: boolean;
  providers?: Record<string, boolean>;
}

export class SearchService {
  private collectionService: CollectionService;
  private providersService: ProvidersService;

  constructor(
    collectionService: CollectionService,
    providersService: ProvidersService
  ) {
    this.collectionService = collectionService;
    this.providersService = providersService;
  }

  async searchAll(
    searchTerm: string,
  ): Promise<Media[]> {
    logger.debug("Starting search with term:", searchTerm);

    // First perform local search
    const localResults = await this.collectionService.search(searchTerm);
    logger.debug("Local search results:", localResults);

    // If no providers or providers are disabled, return local results only
    const hasProviders =
      Object.keys(this.providersService.providers).length > 0;
    if (!hasProviders) {
      return localResults;
    }

    try {
      // Search in each provider
      const providerSearches = Object.keys(this.providersService.providers).map(
        (provider) =>
          this.providersService.searchForProvider(searchTerm, provider)
      );

      const providerResults = await Promise.all(providerSearches);
      const allProviderResults = providerResults.flat();

      // Add provider results to collection
      if (allProviderResults.length > 0) {
        await this.collectionService.bulkSave(allProviderResults, { rows: {} });
      }

      // Get final results from collection after saving provider results
      const finalResults = await this.collectionService.search(searchTerm);
      logger.debug("Final search results:", finalResults);

      return finalResults;
    } catch (error) {
      logger.error("Error during provider search:", error);
      // If provider search fails, return local results
      return localResults;
    }
  }
}
