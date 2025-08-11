// Sync Service - Advanced data synchronization with conflict resolution
import { indexedDBService } from './indexeddb.service';
import { offlineService } from './offline.service';

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private syncQueue: SyncOperation[] = [];
  private conflictResolver: ConflictResolver;

  private constructor() {
    this.conflictResolver = new ConflictResolver();
    this.initializeSync();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Initialize sync service
  private async initializeSync(): Promise<void> {
    try {
      await indexedDBService.initialize();
      await this.loadSyncQueue();
      this.setupPeriodicSync();
      console.log('Sync service initialized');
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
    }
  }

  // Load pending sync operations from IndexedDB
  private async loadSyncQueue(): Promise<void> {
    try {
      this.syncQueue = await indexedDBService.getSyncQueue();
      console.log(`Loaded ${this.syncQueue.length} pending sync operations`);
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Setup periodic sync (every 5 minutes when online)
  private setupPeriodicSync(): void {
    setInterval(() => {
      if (offlineService.isAppOnline() && !this.syncInProgress) {
        this.performSync();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Add operation to sync queue
  public async queueOperation(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    try {
      await indexedDBService.addToSyncQueue(operation);
      this.syncQueue.push({
        ...operation,
        id: this.generateId(),
        createdAt: Date.now(),
        retryCount: 0,
      });

      // Try immediate sync if online
      if (offlineService.isAppOnline()) {
        this.performSync();
      }
    } catch (error) {
      console.error('Failed to queue sync operation:', error);
    }
  }

  // Perform synchronization
  public async performSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, message: 'Sync already in progress' };
    }

    this.syncInProgress = true;
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      console.log('Starting sync process...');

      // Reload queue from database to get latest operations
      await this.loadSyncQueue();

      if (this.syncQueue.length === 0) {
        console.log('No operations to sync');
        return { success: true, message: 'No operations to sync' };
      }

      // Process operations in priority order
      for (const operation of this.syncQueue) {
        try {
          await this.processOperation(operation);
          await indexedDBService.removeSyncOperation(operation.id!);
          successCount++;
          console.log(`Successfully synced operation: ${operation.entity}/${operation.operation}`);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          errorCount++;
          errors.push(`${operation.entity}/${operation.operation}: ${error}`);

          // Increment retry count
          await indexedDBService.incrementRetryCount(operation.id!);

          // Remove operation if max retries exceeded
          if ((operation.retryCount || 0) >= 3) {
            console.warn(`Removing operation ${operation.id} after 3 failed attempts`);
            await indexedDBService.removeSyncOperation(operation.id!);
          }
        }
      }

      // Update local queue
      await this.loadSyncQueue();

      const duration = Date.now() - startTime;
      const message = `Sync completed: ${successCount} success, ${errorCount} errors (${duration}ms)`;
      console.log(message);

      return {
        success: errorCount === 0,
        message,
        successCount,
        errorCount,
        errors,
        duration,
      };

    } catch (error) {
      console.error('Sync process failed:', error);
      return {
        success: false,
        message: `Sync failed: ${error}`,
        errors: [String(error)],
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual sync operation
  private async processOperation(operation: SyncOperation): Promise<void> {
    switch (operation.entity) {
      case 'assessment':
        await this.syncAssessment(operation);
        break;
      case 'profile':
        await this.syncProfile(operation);
        break;
      case 'session':
        await this.syncSession(operation);
        break;
      case 'setting':
        await this.syncSetting(operation);
        break;
      default:
        throw new Error(`Unknown entity type: ${operation.entity}`);
    }
  }

  // Sync assessment result
  private async syncAssessment(operation: SyncOperation): Promise<void> {
    const { operation: op, data } = operation;

    switch (op) {
      case 'CREATE':
      case 'UPDATE':
        // Check for conflicts
        const serverData = await this.fetchFromServer(`/api/assessments/${data.id}`);
        if (serverData && serverData.lastModified > data.lastModified) {
          // Conflict detected - resolve it
          const resolved = await this.conflictResolver.resolveAssessmentConflict(data, serverData);
          await this.sendToServer(`/api/assessments/${data.id}`, 'PUT', resolved);
          await indexedDBService.saveAssessmentResult(resolved);
        } else {
          // No conflict - send to server
          await this.sendToServer(`/api/assessments`, op === 'CREATE' ? 'POST' : 'PUT', data);
        }
        await indexedDBService.markAssessmentResultSynced(data.id);
        break;

      case 'DELETE':
        await this.sendToServer(`/api/assessments/${data.id}`, 'DELETE');
        break;
    }
  }

  // Sync user profile
  private async syncProfile(operation: SyncOperation): Promise<void> {
    const { operation: op, data } = operation;

    switch (op) {
      case 'CREATE':
      case 'UPDATE':
        const serverData = await this.fetchFromServer(`/api/profiles/${data.userId}`);
        if (serverData && serverData.lastModified > data.lastModified) {
          const resolved = await this.conflictResolver.resolveProfileConflict(data, serverData);
          await this.sendToServer(`/api/profiles/${data.userId}`, 'PUT', resolved);
          await indexedDBService.saveUserProfile(resolved);
        } else {
          await this.sendToServer(`/api/profiles`, op === 'CREATE' ? 'POST' : 'PUT', data);
        }
        await indexedDBService.markUserProfileSynced(data.userId);
        break;

      case 'DELETE':
        await this.sendToServer(`/api/profiles/${data.userId}`, 'DELETE');
        break;
    }
  }

  // Sync assessment session
  private async syncSession(operation: SyncOperation): Promise<void> {
    const { operation: op, data } = operation;

    switch (op) {
      case 'CREATE':
      case 'UPDATE':
        await this.sendToServer(`/api/sessions`, op === 'CREATE' ? 'POST' : 'PUT', data);
        break;

      case 'DELETE':
        await this.sendToServer(`/api/sessions/${data.id}`, 'DELETE');
        await indexedDBService.deleteAssessmentSession(data.id);
        break;
    }
  }

  // Sync setting
  private async syncSetting(operation: SyncOperation): Promise<void> {
    const { operation: op, data } = operation;

    switch (op) {
      case 'CREATE':
      case 'UPDATE':
        await this.sendToServer(`/api/settings`, op === 'CREATE' ? 'POST' : 'PUT', data);
        await indexedDBService.markSettingSynced(data.key);
        break;

      case 'DELETE':
        await this.sendToServer(`/api/settings/${data.key}`, 'DELETE');
        break;
    }
  }

  // Fetch data from server
  private async fetchFromServer(endpoint: string): Promise<any> {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (response.status === 404) {
        return null; // Resource doesn't exist on server
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch from ${endpoint}:`, error);
      throw error;
    }
  }

  // Send data to server
  private async sendToServer(endpoint: string, method: string, data?: any): Promise<any> {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return method !== 'DELETE' ? await response.json() : null;
    } catch (error) {
      console.error(`Failed to send to ${endpoint}:`, error);
      throw error;
    }
  }

  // Get authentication token
  private getAuthToken(): string {
    // This would normally get the token from your auth service
    return localStorage.getItem('auth_token') || '';
  }

  // Download data from server (full sync)
  public async downloadFromServer(userId: string): Promise<void> {
    try {
      console.log('Starting full download from server...');

      // Download assessments
      const assessments = await this.fetchFromServer(`/api/users/${userId}/assessments`);
      for (const assessment of assessments || []) {
        await indexedDBService.saveAssessmentResult({
          ...assessment,
          synced: true,
          syncedAt: Date.now(),
        });
      }

      // Download profile
      const profile = await this.fetchFromServer(`/api/users/${userId}/profile`);
      if (profile) {
        await indexedDBService.saveUserProfile({
          ...profile,
          synced: true,
          syncedAt: Date.now(),
        });
      }

      // Download settings
      const settings = await this.fetchFromServer(`/api/users/${userId}/settings`);
      for (const setting of settings || []) {
        await indexedDBService.saveSetting(setting.key, setting.value);
        await indexedDBService.markSettingSynced(setting.key);
      }

      console.log('Full download completed');
    } catch (error) {
      console.error('Full download failed:', error);
      throw error;
    }
  }

  // Get sync status
  public getSyncStatus(): SyncStatus {
    return {
      inProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      lastSync: this.getLastSyncTime(),
      isOnline: offlineService.isAppOnline(),
    };
  }

  // Get last sync time from localStorage
  private getLastSyncTime(): number | null {
    const stored = localStorage.getItem('last_sync_time');
    return stored ? parseInt(stored, 10) : null;
  }

  // Set last sync time
  private setLastSyncTime(): void {
    localStorage.setItem('last_sync_time', Date.now().toString());
  }

  // Clear all local data and re-download
  public async resetAndResync(userId: string): Promise<void> {
    try {
      console.log('Resetting local data and resyncing...');

      // Clear all local data
      await indexedDBService.clearStore('assessmentResults');
      await indexedDBService.clearStore('userProfiles');
      await indexedDBService.clearStore('assessmentSessions');
      await indexedDBService.clearStore('settings');
      await indexedDBService.clearStore('syncQueue');

      // Clear sync queue
      this.syncQueue = [];

      // Download fresh data from server
      await this.downloadFromServer(userId);

      console.log('Reset and resync completed');
    } catch (error) {
      console.error('Reset and resync failed:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Conflict Resolution Service
class ConflictResolver {
  // Resolve assessment result conflicts
  async resolveAssessmentConflict(local: any, server: any): Promise<any> {
    console.log('Resolving assessment conflict...');

    // Strategy: Use the most recent version, but preserve local changes if they're newer
    if (local.lastModified > server.lastModified) {
      console.log('Local version is newer, keeping local changes');
      return local;
    } else {
      console.log('Server version is newer, using server version');
      return {
        ...server,
        // Preserve any local-only fields that might exist
        localNotes: local.localNotes,
      };
    }
  }

  // Resolve profile conflicts
  async resolveProfileConflict(local: any, server: any): Promise<any> {
    console.log('Resolving profile conflict...');

    // Strategy: Merge changes, with server taking precedence for most fields
    return {
      ...server,
      // Keep local accessibility settings
      accessibilitySettings: local.accessibilitySettings || server.accessibilitySettings,
      // Keep local preferences
      preferences: {
        ...server.preferences,
        ...local.preferences,
      },
      lastModified: Math.max(local.lastModified, server.lastModified),
    };
  }
}

// Types
interface SyncOperation {
  id?: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'assessment' | 'profile' | 'session' | 'setting';
  data: any;
  priority: number;
  createdAt?: number;
  retryCount?: number;
  lastRetryAt?: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  successCount?: number;
  errorCount?: number;
  errors?: string[];
  duration?: number;
}

interface SyncStatus {
  inProgress: boolean;
  queueLength: number;
  lastSync: number | null;
  isOnline: boolean;
}

// Export singleton instance
export const syncService = SyncService.getInstance();