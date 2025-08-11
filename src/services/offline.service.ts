// Offline Service - Manages offline functionality and data synchronization
export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = navigator.onLine;
  private pendingOperations: PendingOperation[] = [];
  private syncInProgress: boolean = false;

  private constructor() {
    this.setupEventListeners();
    this.loadPendingOperations();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // Setup online/offline event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onConnectionRestored();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onConnectionLost();
    });

    // Listen for visibility change to sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingOperations();
      }
    });
  }

  // Check if the app is currently online
  public isAppOnline(): boolean {
    return this.isOnline;
  }

  // Store data locally when offline
  public async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      const offlineData = {
        data,
        timestamp: Date.now(),
        synced: false,
      };
      localStorage.setItem(`offline_${key}`, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error storing offline data:', error);
      throw new Error('Failed to store data offline');
    }
  }

  // Retrieve data from local storage
  public async getOfflineData(key: string): Promise<any> {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const offlineData = JSON.parse(stored);
        return offlineData.data;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  }

  // Add operation to pending queue
  public async addPendingOperation(operation: PendingOperation): Promise<void> {
    this.pendingOperations.push({
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0,
    });
    await this.savePendingOperations();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  // Load pending operations from storage
  private async loadPendingOperations(): Promise<void> {
    try {
      const stored = localStorage.getItem('pending_operations');
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
      this.pendingOperations = [];
    }
  }

  // Save pending operations to storage
  private async savePendingOperations(): Promise<void> {
    try {
      localStorage.setItem('pending_operations', JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }

  // Sync pending operations when connection is restored
  public async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Syncing ${this.pendingOperations.length} pending operations...`);

    const operationsToSync = [...this.pendingOperations];
    const successfulOperations: string[] = [];

    for (const operation of operationsToSync) {
      try {
        await this.executeOperation(operation);
        successfulOperations.push(operation.id);
        console.log(`Successfully synced operation: ${operation.type}`);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.type}:`, error);
        
        // Increment retry count
        operation.retryCount = (operation.retryCount || 0) + 1;
        
        // Remove operation if it has exceeded max retries
        if (operation.retryCount >= 3) {
          console.warn(`Removing operation ${operation.id} after 3 failed attempts`);
          successfulOperations.push(operation.id);
        }
      }
    }

    // Remove successfully synced operations
    this.pendingOperations = this.pendingOperations.filter(
      op => !successfulOperations.includes(op.id)
    );

    await this.savePendingOperations();
    this.syncInProgress = false;

    console.log(`Sync completed. ${successfulOperations.length} operations synced.`);
  }

  // Execute a pending operation
  private async executeOperation(operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case 'SAVE_ASSESSMENT':
        await this.syncAssessmentResult(operation.data);
        break;
      case 'UPDATE_PROFILE':
        await this.syncProfileUpdate(operation.data);
        break;
      case 'SAVE_SETTINGS':
        await this.syncSettings(operation.data);
        break;
      default:
        console.warn(`Unknown operation type: ${operation.type}`);
    }
  }

  // Sync assessment result to server
  private async syncAssessmentResult(data: any): Promise<void> {
    // This would normally make an API call to save the assessment
    // For now, we'll simulate the API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Assessment result synced to server:', data);
  }

  // Sync profile update to server
  private async syncProfileUpdate(data: any): Promise<void> {
    // This would normally make an API call to update the profile
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Profile update synced to server:', data);
  }

  // Sync settings to server
  private async syncSettings(data: any): Promise<void> {
    // This would normally make an API call to save settings
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Settings synced to server:', data);
  }

  // Handle connection restored
  private onConnectionRestored(): void {
    console.log('Connection restored - starting sync...');
    this.syncPendingOperations();
    
    // Notify user
    this.showConnectionStatus('Conexión restaurada. Sincronizando datos...', 'success');
  }

  // Handle connection lost
  private onConnectionLost(): void {
    console.log('Connection lost - switching to offline mode');
    this.showConnectionStatus('Sin conexión. Los datos se guardarán localmente.', 'warning');
  }

  // Show connection status to user
  private showConnectionStatus(message: string, type: 'success' | 'warning' | 'error'): void {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `offline-toast offline-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background-color: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
    `;

    document.body.appendChild(toast);

    // Remove toast after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  // Generate unique operation ID
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get sync status
  public getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.pendingOperations.length,
      syncInProgress: this.syncInProgress,
      lastSyncAttempt: this.getLastSyncAttempt(),
    };
  }

  // Get last sync attempt timestamp
  private getLastSyncAttempt(): number | null {
    const stored = localStorage.getItem('last_sync_attempt');
    return stored ? parseInt(stored, 10) : null;
  }

  // Clear all offline data (for testing or reset)
  public async clearOfflineData(): Promise<void> {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('offline_') || key === 'pending_operations') {
        localStorage.removeItem(key);
      }
    });
    this.pendingOperations = [];
    console.log('All offline data cleared');
  }

  // Get storage usage information
  public getStorageInfo(): StorageInfo {
    let totalSize = 0;
    let offlineDataSize = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length;
        totalSize += size;
        
        if (key.startsWith('offline_')) {
          offlineDataSize += size;
        }
      }
    }

    return {
      totalSize,
      offlineDataSize,
      availableSpace: 5 * 1024 * 1024 - totalSize, // Assume 5MB limit
      pendingOperations: this.pendingOperations.length,
    };
  }
}

// Types
interface PendingOperation {
  id: string;
  type: 'SAVE_ASSESSMENT' | 'UPDATE_PROFILE' | 'SAVE_SETTINGS';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncStatus {
  isOnline: boolean;
  pendingOperations: number;
  syncInProgress: boolean;
  lastSyncAttempt: number | null;
}

interface StorageInfo {
  totalSize: number;
  offlineDataSize: number;
  availableSpace: number;
  pendingOperations: number;
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();