import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "WakeLock" });

export class WakeLock {
  private wakeLock: any = null;

  async requestWakeLock() {
    try {
      // @ts-ignore
      this.wakeLock = await navigator.wakeLock.request("screen");
      this.wakeLock.addEventListener("release", () => {
        logger.info("Wake Lock was released");
      });

      // Add event listener for page visibility change
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible") {
          try {
            await this.requestWakeLock();
            logger.info("Wake Lock is active");
          } catch (e: any) {
            logger.error(`${e.name}, ${e.message}`);
          }
        }
      });

      logger.info("Wake Lock is active");
    } catch (error) {
      logger.error("Failed to request wake lock:", error instanceof Error ? error.message : String(error));
    }
  }

  async releaseWakeLock() {
    try {
      await this.wakeLock.release();
      this.wakeLock = null;
    } catch (error) {
      logger.error("Failed to release wake lock:", error instanceof Error ? error.message : String(error));
    }
  }
}

export default new WakeLock();
