import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "WakeLock" });

class WakeLock {
  private static instance: WakeLock;
  private wakeLock: any = null;
  private visibilityChangeHandler: ((event: Event) => Promise<void>) | null = null;

  private constructor() {
    // Private constructor to enforce singleton
    this.requestWakeLock = this.requestWakeLock.bind(this);
    this.releaseWakeLock = this.releaseWakeLock.bind(this);
  }

  public static getInstance(): WakeLock {
    if (!WakeLock.instance) {
      WakeLock.instance = new WakeLock();
    }
    return WakeLock.instance;
  }

  async requestWakeLock() {
    try {
      // @ts-ignore
      this.wakeLock = await navigator.wakeLock.request("screen");
      
      this.wakeLock.addEventListener("release", () => {
        logger.info("Wake Lock was released");
        this.wakeLock = null;
      });

      // Remove previous event listener if it exists
      if (this.visibilityChangeHandler) {
        document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      }

      // Create and store the visibility change handler
      this.visibilityChangeHandler = async () => {
        if (document.visibilityState === "visible" && !this.wakeLock) {
          try {
            // @ts-ignore
            this.wakeLock = await navigator.wakeLock.request("screen");
            logger.info("Wake Lock is active");
          } catch (e: any) {
            logger.error(`${e.name}, ${e.message}`);
          }
        }
      };

      document.addEventListener("visibilitychange", this.visibilityChangeHandler);

      logger.info("Wake Lock is active");
    } catch (error) {
      logger.error("Failed to request wake lock:", error instanceof Error ? error.message : String(error));
    }
  }

  async releaseWakeLock() {
    try {
      if (this.wakeLock) {
        await this.wakeLock.release();
        this.wakeLock = null;
      }
      
      // Clean up the visibility change handler
      if (this.visibilityChangeHandler) {
        document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
        this.visibilityChangeHandler = null;
      }
    } catch (error) {
      logger.error("Failed to release wake lock:", error instanceof Error ? error.message : String(error));
    }
  }
}

export default WakeLock.getInstance();
