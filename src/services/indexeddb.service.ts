// IndexedDB Service - Advanced local storage for offline functionality
export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'NeuralHackDB';
  private readonly dbVersion = 1;

  private constructor() {}

  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  // Initialize the database
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  // Create object stores (tables)
  private createObjectStores(db: IDBDatabase): void {
    // Assessment Results Store
    if (!db.objectStoreNames.contains('assessmentResults')) {
      const assessmentStore = db.createObjectStore('assessmentResults', {
        keyPath: 'id',
        autoIncrement: false,
      });
      assessmentStore.createIndex('userId', 'userId', { unique: false });
      assessmentStore.createIndex('testType', 'testType', { unique: false });
      assessmentStore.createIndex('completedAt', 'completedAt', { unique: false });
      assessmentStore.createIndex('synced', 'synced', { unique: false });
    }

    // User Profiles Store
    if (!db.objectStoreNames.contains('userProfiles')) {
      const profileStore = db.createObjectStore('userProfiles', {
        keyPath: 'userId',
        autoIncrement: false,
      });
      profileStore.createIndex('synced', 'synced', { unique: false });
      profileStore.createIndex('lastModified', 'lastModified', { unique: false });
    }

    // Assessment Sessions Store (for incomplete assessments)
    if (!db.objectStoreNames.contains('assessmentSessions')) {
      const sessionStore = db.createObjectStore('assessmentSessions', {
        keyPath: 'id',
        autoIncrement: false,
      });
      sessionStore.createIndex('userId', 'userId', { unique: false });
      sessionStore.createIndex('testType', 'testType', { unique: false });
      sessionStore.createIndex('status', 'status', { unique: false });
      sessionStore.createIndex('lastActivityAt', 'lastActivityAt', { unique: false });
    }

    // Settings Store
    if (!db.objectStoreNames.contains('settings')) {
      const settingsStore = db.createObjectStore('settings', {
        keyPath: 'key',
        autoIncrement: false,
      });
      settingsStore.createIndex('synced', 'synced', { unique: false });
    }

    // Sync Queue Store
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', {
        keyPath: 'id',
        autoIncrement: false,
      });
      syncStore.createIndex('operation', 'operation', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
      syncStore.createIndex('createdAt', 'createdAt', { unique: false });
      syncStore.createIndex('retryCount', 'retryCount', { unique: false });
    }

    console.log('IndexedDB object stores created');
  }

  // Generic method to add/update data
  public async put(storeName: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get data by key
  public async get(storeName: string, key: any): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get all data from a store
  public async getAll(storeName: string): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to delete data
  public async delete(storeName: string, key: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get data by index
  public async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Assessment Results specific methods
  public async saveAssessmentResult(result: AssessmentResultData): Promise<void> {
    const data = {
      ...result,
      synced: false,
      lastModified: Date.now(),
    };
    await this.put('assessmentResults', data);
  }

  public async getAssessmentResults(userId: string): Promise<AssessmentResultData[]> {
    return this.getByIndex('assessmentResults', 'userId', userId);
  }

  public async getUnsyncedAssessmentResults(): Promise<AssessmentResultData[]> {
    return this.getByIndex('assessmentResults', 'synced', false);
  }

  public async markAssessmentResultSynced(id: string): Promise<void> {
    const result = await this.get('assessmentResults', id);
    if (result) {
      result.synced = true;
      result.syncedAt = Date.now();
      await this.put('assessmentResults', result);
    }
  }

  // User Profile specific methods
  public async saveUserProfile(profile: UserProfileData): Promise<void> {
    const data = {
      ...profile,
      synced: false,
      lastModified: Date.now(),
    };
    await this.put('userProfiles', data);
  }

  public async getUserProfile(userId: string): Promise<UserProfileData | null> {
    return this.get('userProfiles', userId);
  }

  public async getUnsyncedUserProfiles(): Promise<UserProfileData[]> {
    return this.getByIndex('userProfiles', 'synced', false);
  }

  public async markUserProfileSynced(userId: string): Promise<void> {
    const profile = await this.get('userProfiles', userId);
    if (profile) {
      profile.synced = true;
      profile.syncedAt = Date.now();
      await this.put('userProfiles', profile);
    }
  }

  // Assessment Session specific methods
  public async saveAssessmentSession(session: AssessmentSessionData): Promise<void> {
    const data = {
      ...session,
      lastModified: Date.now(),
    };
    await this.put('assessmentSessions', data);
  }

  public async getAssessmentSession(id: string): Promise<AssessmentSessionData | null> {
    return this.get('assessmentSessions', id);
  }

  public async getAssessmentSessions(userId: string): Promise<AssessmentSessionData[]> {
    return this.getByIndex('assessmentSessions', 'userId', userId);
  }

  public async deleteAssessmentSession(id: string): Promise<void> {
    await this.delete('assessmentSessions', id);
  }

  // Settings specific methods
  public async saveSetting(key: string, value: any): Promise<void> {
    const data = {
      key,
      value,
      synced: false,
      lastModified: Date.now(),
    };
    await this.put('settings', data);
  }

  public async getSetting(key: string): Promise<any> {
    const setting = await this.get('settings', key);
    return setting ? setting.value : null;
  }

  public async getUnsyncedSettings(): Promise<SettingData[]> {
    return this.getByIndex('settings', 'synced', false);
  }

  public async markSettingSynced(key: string): Promise<void> {
    const setting = await this.get('settings', key);
    if (setting) {
      setting.synced = true;
      setting.syncedAt = Date.now();
      await this.put('settings', setting);
    }
  }

  // Sync Queue specific methods
  public async addToSyncQueue(operation: SyncOperation): Promise<void> {
    const data = {
      ...operation,
      id: this.generateId(),
      createdAt: Date.now(),
      retryCount: 0,
    };
    await this.put('syncQueue', data);
  }

  public async getSyncQueue(): Promise<SyncOperation[]> {
    const queue = await this.getAll('syncQueue');
    return queue.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  }

  public async removeSyncOperation(id: string): Promise<void> {
    await this.delete('syncQueue', id);
  }

  public async incrementRetryCount(id: string): Promise<void> {
    const operation = await this.get('syncQueue', id);
    if (operation) {
      operation.retryCount = (operation.retryCount || 0) + 1;
      operation.lastRetryAt = Date.now();
      await this.put('syncQueue', operation);
    }
  }

  // Utility methods
  public async clearStore(storeName: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getStorageUsage(): Promise<StorageUsage> {
    const stores = ['assessmentResults', 'userProfiles', 'assessmentSessions', 'settings', 'syncQueue'];
    const usage: StorageUsage = {
      total: 0,
      byStore: {},
    };

    for (const storeName of stores) {
      const data = await this.getAll(storeName);
      const size = JSON.stringify(data).length;
      usage.byStore[storeName] = {
        count: data.length,
        size,
      };
      usage.total += size;
    }

    return usage;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Close database connection
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Types
interface AssessmentResultData {
  id: string;
  userId: string;
  testType: string;
  score: number;
  completedAt: string;
  synced?: boolean;
  syncedAt?: number;
  lastModified?: number;
  [key: string]: any;
}

interface UserProfileData {
  userId: string;
  name: string;
  email: string;
  age: number;
  synced?: boolean;
  syncedAt?: number;
  lastModified?: number;
  [key: string]: any;
}

interface AssessmentSessionData {
  id: string;
  userId: string;
  testType: string;
  status: string;
  responses: any[];
  lastActivityAt: number;
  lastModified?: number;
  [key: string]: any;
}

interface SettingData {
  key: string;
  value: any;
  synced?: boolean;
  syncedAt?: number;
  lastModified?: number;
}

interface SyncOperation {
  id?: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'assessment' | 'profile' | 'session' | 'setting';
  data: any;
  priority: number; // Higher number = higher priority
  createdAt?: number;
  retryCount?: number;
  lastRetryAt?: number;
}

interface StorageUsage {
  total: number;
  byStore: {
    [storeName: string]: {
      count: number;
      size: number;
    };
  };
}

// Export singleton instance
export const indexedDBService = IndexedDBService.getInstance();