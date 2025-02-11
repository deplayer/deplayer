import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "WakeLock" });

let wakeLockController: AbortController | null = null;

export const requestWakeLock = async () => {
  try {
    if ("wakeLock" in navigator) {
      const wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        logger.info("Wake Lock was released");
      });

      // Add event listener for page visibility change
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible") {
          try {
            await requestWakeLock();
            logger.info("Wake Lock is active");
          } catch (e) {
            logger.error(`${e.name}, ${e.message}`);
          }
        }
      });

      logger.info("Wake Lock is active");
    } else {
      logger.warn("Wake Lock API not supported.");
    }
  } catch (e) {
    logger.error(`${e.name}, ${e.message}`);
  }
};

export const releaseWakeLock = () => {
  if (wakeLockController) {
    if (wakeLockController.abort) {
      wakeLockController.abort();
    }

    if ("release" in wakeLockController && wakeLockController.release) {
      (wakeLockController as any).release();
    }

    wakeLockController = null;
  }
};
