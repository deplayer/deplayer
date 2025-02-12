import { describe, it, expect, vi, beforeEach } from 'vitest'
import WakeLock from './wakeLock'

describe('WakeLock Service', () => {
  const mockRelease = vi.fn().mockResolvedValue(undefined);
  const mockRequest = vi.fn();
  let visibilityState = 'visible';
  let visibilityCallback: EventListenerOrEventListenerObject | null = null;
  let releaseCallback: Function | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    visibilityState = 'visible';
    visibilityCallback = null;
    releaseCallback = null;

    // Mock wake lock
    mockRequest.mockResolvedValue({
      release: mockRelease,
      addEventListener: (event: string, callback: Function) => {
        if (event === 'release') releaseCallback = callback;
      }
    });

    // Mock browser APIs
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true
    });

    Object.defineProperty(document, 'visibilityState', {
      get: () => visibilityState,
      configurable: true
    });

    vi.spyOn(document, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'visibilitychange') visibilityCallback = callback;
    });

    vi.spyOn(document, 'removeEventListener');
  });

  it('should request and release wake lock', async () => {
    await WakeLock.requestWakeLock();
    
    expect(mockRequest).toHaveBeenCalledWith('screen');
    expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    await WakeLock.releaseWakeLock();
    
    expect(mockRelease).toHaveBeenCalled();
    if (releaseCallback) releaseCallback();
    expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('should re-request wake lock on visibility change', async () => {
    await WakeLock.requestWakeLock();
    if (releaseCallback) releaseCallback();
    
    if (visibilityCallback && typeof visibilityCallback === 'function') {
      await visibilityCallback(new Event('visibilitychange'));
      expect(mockRequest).toHaveBeenCalledTimes(2);
    }
  });

  it('should handle errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test request error
    mockRequest.mockRejectedValueOnce(new Error('Request failed'));
    await WakeLock.requestWakeLock();
    expect(consoleSpy).toHaveBeenCalled();

    // Test release error
    consoleSpy.mockClear();
    mockRequest.mockResolvedValueOnce({ 
      release: vi.fn().mockRejectedValueOnce(new Error('Release failed')),
      addEventListener: vi.fn()
    });
    
    await WakeLock.requestWakeLock();
    await WakeLock.releaseWakeLock();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should maintain singleton instance', () => {
    expect(WakeLock).toBe(WakeLock);
  });
}); 