import WebTorrent from "webtorrent";
import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "WebtorrentService" });

class WebtorrentService {
  private static instance: WebtorrentService;
  private client: WebTorrent.Instance;
  private serverInitialized: boolean = false;

  private constructor() {
    this.client = new WebTorrent();
  }

  static getInstance(): WebtorrentService {
    if (!WebtorrentService.instance) {
      WebtorrentService.instance = new WebtorrentService();
    }
    return WebtorrentService.instance;
  }

  getClient(): WebTorrent.Instance {
    return this.client;
  }

  isServerInitialized(): boolean {
    return this.serverInitialized;
  }

  initializeServer(registration: ServiceWorkerRegistration) {
    if (!this.serverInitialized && registration?.active) {
      this.client.createServer({ controller: registration });
      this.serverInitialized = true;
      logger.info("WebTorrent server initialized successfully");
    }
  }
}

export default WebtorrentService;
