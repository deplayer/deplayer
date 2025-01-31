/**
 * Service to handle Origin Private File System (OPFS) operations
 */
export const isOpfsReady = async (): Promise<boolean> => {
  try {
    // Check if OPFS is supported
    if (!('storage' in navigator && 'getDirectory' in navigator.storage)) {
      return false;
    }

    // Try to get the root directory to verify access
    const root = await navigator.storage.getDirectory();
    return !!root;
  } catch (error) {
    console.error('OPFS not ready:', error);
    return false;
  }
}; 