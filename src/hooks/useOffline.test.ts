import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffline } from './useOffline';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn(),
    ready: Promise.resolve({
      sync: {
        register: vi.fn()
      }
    })
  }
});

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: mockIndexedDB
});

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  it('should initialize with online state', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.pendingOperations).toEqual([]);
    expect(result.current.syncStatus).toBe('idle');
  });

  it('should detect offline state', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('should handle online/offline events', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);

    // Simulate going back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should register service worker', async () => {
    const mockRegistration = {
      addEventListener: vi.fn(),
      sync: {
        register: vi.fn()
      }
    };

    vi.mocked(navigator.serviceWorker.register).mockResolvedValue(mockRegistration as any);

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.registerServiceWorker();
    });

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    expect(result.current.serviceWorkerRegistration).toEqual(mockRegistration);
  });

  it('should handle service worker registration failure', async () => {
    const error = new Error('Service worker registration failed');
    vi.mocked(navigator.serviceWorker.register).mockRejectedValue(error);

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.registerServiceWorker();
    });

    expect(result.current.serviceWorkerRegistration).toBeNull();
  });

  it('should store data offline', async () => {
    const mockDB = {
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          add: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null
          })
        })
      })
    };

    const mockOpenRequest = {
      onsuccess: null,
      onerror: null,
      result: mockDB
    };

    vi.mocked(mockIndexedDB.open).mockReturnValue(mockOpenRequest as any);

    const { result } = renderHook(() => useOffline());

    const testData = { id: '1', name: 'Test Assessment' };

    await act(async () => {
      // Simulate successful DB open
      mockOpenRequest.onsuccess?.({ target: { result: mockDB } } as any);
      
      const storeResult = await result.current.storeOfflineData('assessments', testData);
      expect(storeResult).toBe(true);
    });
  });

  it('should retrieve offline data', async () => {
    const mockData = [
      { id: '1', name: 'Assessment 1' },
      { id: '2', name: 'Assessment 2' }
    ];

    const mockDB = {
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          getAll: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
            result: mockData
          })
        })
      })
    };

    const mockOpenRequest = {
      onsuccess: null,
      onerror: null,
      result: mockDB
    };

    vi.mocked(mockIndexedDB.open).mockReturnValue(mockOpenRequest as any);

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      mockOpenRequest.onsuccess?.({ target: { result: mockDB } } as any);
      
      const retrievedData = await result.current.getOfflineData('assessments');
      expect(retrievedData).toEqual(mockData);
    });
  });

  it('should add pending operations when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() => useOffline());

    const operation = {
      id: 'op-1',
      type: 'CREATE_ASSESSMENT',
      data: { name: 'Test Assessment' },
      timestamp: Date.now()
    };

    act(() => {
      result.current.addPendingOperation(operation);
    });

    expect(result.current.pendingOperations).toContain(operation);
  });

  it('should sync pending operations when online', async () => {
    const { result } = renderHook(() => useOffline());

    const operation = {
      id: 'op-1',
      type: 'CREATE_ASSESSMENT',
      data: { name: 'Test Assessment' },
      timestamp: Date.now()
    };

    // Add operation while offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      result.current.addPendingOperation(operation);
    });

    expect(result.current.pendingOperations).toHaveLength(1);

    // Mock successful sync
    const mockSyncFunction = vi.fn().mockResolvedValue(true);

    await act(async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      await result.current.syncPendingOperations(mockSyncFunction);
    });

    expect(mockSyncFunction).toHaveBeenCalledWith(operation);
    expect(result.current.pendingOperations).toHaveLength(0);
    expect(result.current.syncStatus).toBe('completed');
  });

  it('should handle sync failures', async () => {
    const { result } = renderHook(() => useOffline());

    const operation = {
      id: 'op-1',
      type: 'CREATE_ASSESSMENT',
      data: { name: 'Test Assessment' },
      timestamp: Date.now()
    };

    act(() => {
      result.current.addPendingOperation(operation);
    });

    // Mock failed sync
    const mockSyncFunction = vi.fn().mockRejectedValue(new Error('Sync failed'));

    await act(async () => {
      await result.current.syncPendingOperations(mockSyncFunction);
    });

    expect(result.current.pendingOperations).toHaveLength(1); // Operation should remain
    expect(result.current.syncStatus).toBe('error');
  });

  it('should clear offline data', async () => {
    const mockDB = {
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          clear: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null
          })
        })
      })
    };

    const mockOpenRequest = {
      onsuccess: null,
      onerror: null,
      result: mockDB
    };

    vi.mocked(mockIndexedDB.open).mockReturnValue(mockOpenRequest as any);

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      mockOpenRequest.onsuccess?.({ target: { result: mockDB } } as any);
      
      const clearResult = await result.current.clearOfflineData('assessments');
      expect(clearResult).toBe(true);
    });
  });

  it('should get storage usage', async () => {
    // Mock navigator.storage
    Object.defineProperty(navigator, 'storage', {
      writable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({
          usage: 1024 * 1024, // 1MB
          quota: 1024 * 1024 * 100 // 100MB
        })
      }
    });

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      const usage = await result.current.getStorageUsage();
      expect(usage.used).toBe(1024 * 1024);
      expect(usage.available).toBe(1024 * 1024 * 100);
      expect(usage.percentage).toBe(1);
    });
  });

  it('should handle background sync registration', async () => {
    const mockRegistration = {
      sync: {
        register: vi.fn().mockResolvedValue(undefined)
      }
    };

    const { result } = renderHook(() => useOffline());

    act(() => {
      result.current.setServiceWorkerRegistration(mockRegistration as any);
    });

    await act(async () => {
      await result.current.requestBackgroundSync('assessment-sync');
    });

    expect(mockRegistration.sync.register).toHaveBeenCalledWith('assessment-sync');
  });

  it('should handle background sync failure', async () => {
    const mockRegistration = {
      sync: {
        register: vi.fn().mockRejectedValue(new Error('Background sync not supported'))
      }
    };

    const { result } = renderHook(() => useOffline());

    act(() => {
      result.current.setServiceWorkerRegistration(mockRegistration as any);
    });

    await act(async () => {
      const syncResult = await result.current.requestBackgroundSync('assessment-sync');
      expect(syncResult).toBe(false);
    });
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOffline());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should detect connection quality', () => {
    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100
      }
    });

    const { result } = renderHook(() => useOffline());

    const connectionInfo = result.current.getConnectionInfo();

    expect(connectionInfo.effectiveType).toBe('4g');
    expect(connectionInfo.downlink).toBe(10);
    expect(connectionInfo.rtt).toBe(100);
  });

  it('should handle missing connection API', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: undefined
    });

    const { result } = renderHook(() => useOffline());

    const connectionInfo = result.current.getConnectionInfo();

    expect(connectionInfo.effectiveType).toBe('unknown');
    expect(connectionInfo.downlink).toBe(0);
    expect(connectionInfo.rtt).toBe(0);
  });
});