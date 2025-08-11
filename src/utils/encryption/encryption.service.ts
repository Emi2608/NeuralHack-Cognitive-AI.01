/**
 * Encryption Service - AES-256 encryption for sensitive data
 * Implements client-side encryption for PII and sensitive assessment data
 */

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  /**
   * Generate a new encryption key
   */
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive key from password using PBKDF2
   */
  static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt sensitive data
   */
  static async encrypt(
    data: string,
    key: CryptoKey
  ): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      encoder.encode(data)
    );

    return { encrypted, iv };
  }

  /**
   * Decrypt sensitive data
   */
  static async decrypt(
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Encrypt object data for storage
   */
  static async encryptObject<T>(
    obj: T,
    key: CryptoKey
  ): Promise<{ data: string; iv: string }> {
    const jsonString = JSON.stringify(obj);
    const { encrypted, iv } = await this.encrypt(jsonString, key);
    
    return {
      data: this.arrayBufferToBase64(encrypted),
      iv: this.uint8ArrayToBase64(iv),
    };
  }

  /**
   * Decrypt object data from storage
   */
  static async decryptObject<T>(
    encryptedData: string,
    ivString: string,
    key: CryptoKey
  ): Promise<T> {
    const encrypted = this.base64ToArrayBuffer(encryptedData);
    const iv = this.base64ToUint8Array(ivString);
    
    const decryptedString = await this.decrypt(encrypted, key, iv);
    return JSON.parse(decryptedString);
  }

  /**
   * Generate salt for key derivation
   */
  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Hash data using SHA-256
   */
  static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Generate secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Utility methods for base64 conversion
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private static uint8ArrayToBase64(array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < array.byteLength; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Encrypted storage wrapper for sensitive data
 */
export class SecureStorage {
  private static encryptionKey: CryptoKey | null = null;

  /**
   * Initialize secure storage with user password
   */
  static async initialize(userPassword: string): Promise<void> {
    const salt = this.getOrCreateSalt();
    this.encryptionKey = await EncryptionService.deriveKeyFromPassword(
      userPassword,
      salt
    );
  }

  /**
   * Store encrypted data
   */
  static async setItem(key: string, value: any): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('SecureStorage not initialized');
    }

    const encrypted = await EncryptionService.encryptObject(
      value,
      this.encryptionKey
    );

    localStorage.setItem(`secure_${key}`, JSON.stringify(encrypted));
  }

  /**
   * Retrieve and decrypt data
   */
  static async getItem<T>(key: string): Promise<T | null> {
    if (!this.encryptionKey) {
      throw new Error('SecureStorage not initialized');
    }

    const encryptedString = localStorage.getItem(`secure_${key}`);
    if (!encryptedString) {
      return null;
    }

    try {
      const encrypted = JSON.parse(encryptedString);
      return await EncryptionService.decryptObject<T>(
        encrypted.data,
        encrypted.iv,
        this.encryptionKey
      );
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  /**
   * Remove encrypted data
   */
  static removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  /**
   * Clear all encrypted data
   */
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  }

  private static getOrCreateSalt(): Uint8Array {
    const saltString = localStorage.getItem('encryption_salt');
    if (saltString) {
      return new Uint8Array(JSON.parse(saltString));
    }

    const salt = EncryptionService.generateSalt();
    localStorage.setItem('encryption_salt', JSON.stringify(Array.from(salt)));
    return salt;
  }
}