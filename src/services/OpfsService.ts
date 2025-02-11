/**
 * Service to handle Origin Private File System (OPFS) operations
 */
export const isOpfsReady = async (): Promise<boolean> => {
  try {
    // Check if OPFS is supported
    if (!('storage' in navigator && 'getDirectory' in navigator.storage)) {
      console.warn('OPFS is not supported in this browser');
      return false;
    }

    // Try to get the root directory to verify access
    const root = await navigator.storage.getDirectory();
    
    // Verify we can write to OPFS by attempting to create a test file
    try {
      const testFileName = 'test-opfs-access';
      await root.getFileHandle(testFileName, { create: true });
      await root.removeEntry(testFileName);
    } catch (writeError) {
      console.error('OPFS write access test failed:', writeError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('OPFS initialization failed:', error);
    return false;
  }
}; 