import { createLogger } from "../utils/logger";

// Create a logger specifically for tests that only logs in test environment
export const createTestLogger = (namespace: string) => {
  return createLogger({
    namespace,
    enabled: process.env.NODE_ENV === "test",
    level: "debug",
  });
};

// Example usage in tests:
// const logger = createTestLogger('TestName')
// logger.debug('Test debug message')
// logger.info('Test info message')
// logger.warn('Test warning message')
// logger.error('Test error message')
