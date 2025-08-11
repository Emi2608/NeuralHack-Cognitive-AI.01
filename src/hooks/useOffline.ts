// useOffline Hook - React hook for offline functionality
import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '../services/offline.service';
import { syncService } from '../services/sync.service';
import { indexedDBService } from '../services/indexeddb.service';

interface OfflineState {
  isOnline: boolean;
  pendingOperations: number;
  syncInProgress: boolean;
  lastSyncAttempt: number | null;
  storageInfo: {
    totalSize: number;
    offlineDataSize: number;
    availableSpace: number;
    pendingOperations: number;
  };
}

export const useOffline = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    pendingOperations: 0,
    syncInProgress: false,
    lastSyncAttempt: null,
    storageInfo: {
      totalSize: 0,
      offlineDataSize: 0,
      availableSpace: 0,
      pendingOperations: 0,
    },
  });

  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Update offline state
  const updateOfflineState = useCallback(() => {
    const syncStatus = offlineService.getSyncStatus();
    const storageInfo = offlineService.getStorageInfo();
    
    setOfflineState({
      isOnline: syncStatus.isOnline,
      pendingOperations: syncStatus.pendingOperations,
      syncInProgress: syncStatus.syncInProgress,
      lastSyncAttempt: syncStatus.lastSyncAttempt,
      storageInfo,
    });
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      try {
        // Use simple service worker in production to avoid errors
        const registration = await navigator.serviceWorker.register('/sw-simple.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        setServiceWorkerRegistration(registration);
        console.log('Service Worker registered successfully:', registration);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available');
                // You could show a notification to the user here
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.warn('Service Worker registration failed (non-critical):', error);
        // Don't fail the app if SW registration fails
        return null;
      }
    } else if (!import.meta.env.PROD) {
      console.log('Service Worker disabled in development');
      return null;
    } else {
      console.warn('Service Workers are not supported in this browser');
      return null;
    }
  }, []);

  // Initialize offline functionality
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Update state initially
    updateOfflineState();

    // Listen for online/offline events
    const handleOnline = () => updateOfflineState();
    const handleOffline = () => updateOfflineState();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC') {
        if (event.data.action === 'SYNC_PENDING_OPERATIONS') {
          offlineService.syncPendingOperations().then(() => {
            updateOfflineState();
          });
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    // Update state periodically
    const interval = setInterval(updateOfflineState, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [registerServiceWorker, updateOfflineState]);

  // Store data offline
  const storeOfflineData = useCallback(async (key: string, data: any) => {
    try {
      await offlineService.storeOfflineData(key, data);
      updateOfflineState();
      return true;
    } catch (error) {
      console.error('Failed to store offline data:', error);
      return false;
    }
  }, [updateOfflineState]);

  // Get offline data
  const getOfflineData = useCallback(async (key: string) => {
    try {
      return await offlineService.getOfflineData(key);
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }, []);

  // Add pending operation
  const addPendingOperation = useCallback(async (type: string, data: any) => {
    try {
      await offlineService.addPendingOperation({
        id: '',
        type: type as any,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      });
      updateOfflineState();
      return true;
    } catch (error) {
      console.error('Failed to add pending operation:', error);
      return false;
    }
  }, [updateOfflineState]);

  // Manually trigger sync
  const syncNow = useCallback(async () => {
    try {
      await offlineService.syncPendingOperations();
      updateOfflineState();
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  }, [updateOfflineState]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineService.clearOfflineData();
      updateOfflineState();
      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }, [updateOfflineState]);

  // Request background sync (if supported)
  const requestBackgroundSync = useCallback(async () => {
    if (serviceWorkerRegistration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        // Background sync registration (if supported)
        if ('sync' in serviceWorkerRegistration) {
          await (serviceWorkerRegistration as any).sync.register('background-sync');
        }
        console.log('Background sync registered');
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }, [serviceWorkerRegistration]);

  // Get formatted storage info
  const getFormattedStorageInfo = useCallback(() => {
    const { storageInfo } = offlineState;
    
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      totalSize: formatBytes(storageInfo.totalSize),
      offlineDataSize: formatBytes(storageInfo.offlineDataSize),
      availableSpace: formatBytes(storageInfo.availableSpace),
      usagePercentage: Math.round((storageInfo.totalSize / (5 * 1024 * 1024)) * 100), // Assuming 5MB limit
    };
  }, [offlineState]);

  // Check if storage is nearly full
  const isStorageNearlyFull = useCallback(() => {
    const { storageInfo } = offlineState;
    const usagePercentage = (storageInfo.totalSize / (5 * 1024 * 1024)) * 100;
    return usagePercentage > 80; // Consider 80% as nearly full
  }, [offlineState]);

  return {
    // State
    isOnline: offlineState.isOnline,
    pendingOperations: offlineState.pendingOperations,
    syncInProgress: offlineState.syncInProgress,
    lastSyncAttempt: offlineState.lastSyncAttempt,
    storageInfo: offlineState.storageInfo,
    serviceWorkerRegistration,

    // Actions
    storeOfflineData,
    getOfflineData,
    addPendingOperation,
    syncNow,
    clearOfflineData,
    requestBackgroundSync,
    updateOfflineState,

    // Utilities
    getFormattedStorageInfo,
    isStorageNearlyFull,
  };
};