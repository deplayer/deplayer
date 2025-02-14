import { PGlite } from "@electric-sql/pglite";
import { worker } from "@electric-sql/pglite/worker";
import { electricSync } from "@electric-sql/pglite-sync";
import { OpfsAhpFS } from "@electric-sql/pglite/opfs-ahp";

const debugLevel = 0;
const DB_NAME = "deplayer-pglite";

// Check if OPFS is available
const isOpfsSupported = () => {
  try {
    return 'storage' in navigator && 
           'getDirectory' in navigator.storage &&
           // Safari has a limit of 252 open sync access handles which is too low for Postgres
           !navigator.userAgent.includes('Safari');
  } catch {
    return false;
  }
};

worker({
  async init(options) {
    const isTest = process.env.NODE_ENV === "test";
    
    if (isTest) {
      return new PGlite(undefined, {
        debug: debugLevel,
        extensions: { 
          electric: electricSync()
        },
        ...options
      });
    }

    // Try to use OPFS if available
    if (isOpfsSupported()) {
      try {
        return new PGlite({
          fs: new OpfsAhpFS(`opfs-ahp://${DB_NAME}`),
          debug: debugLevel,
          extensions: { 
            electric: electricSync()
          },
          ...options
        });
      } catch (error) {
        console.warn("Failed to initialize OPFS, falling back to IndexedDB:", error);
      }
    }

    // Fallback to IndexedDB
    return new PGlite(`idb://${DB_NAME}`, {
      debug: debugLevel,
      extensions: { 
        electric: electricSync()
      },
      ...options
    });
  },
}); 