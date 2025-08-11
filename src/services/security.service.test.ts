import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityService } from './security.service';
import CryptoJS from 'crypto-js';

// Mock CryptoJS
vi.mock('crypto-js', () => ({
  default: {
    AES: {
      encrypt: vi.fn(),
      decrypt: vi.fn()
    },
    enc: {
      Utf8: {
        stringify: vi.fn()
      }
    },
    SHA256: vi.fn(),
    lib: {
      WordArray: {
        random: vi.fn()
      }
    }
  }
}));

describe('SecurityService', () => {
  let securityService: SecurityService;

  beforeEach(() => {
    securityService = new SecurityService();
    vi.clearAllMocks();
  });

  describe('encryptData', () => {
    it('should encrypt data successfully', () => {
      const mockEncrypted = { toString: vi.fn().mockReturnValue('encrypted-data') };
      vi.mocked(CryptoJS.AES.encrypt).mockReturnValue(mockEncrypted as any);

      const data = { sensitive: 'information' };
      const key = 'encryption-key';

      const result = securityService.encryptData(data, key);

      expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(
        JSON.stringify(data),
        key
      );
      expect(result).toBe('encrypted-data');
    });

    it('should handle encryption errors', () => {
      vi.mocked(CryptoJS.AES.encrypt).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const data = { sensitive: 'information' };
      const key = 'encryption-key';

      expect(() => securityService.encryptData(data, key)).toThrow('Encryption failed');
    });
  });

  describe('decryptData', () => {
    it('should decrypt data successfully', () => {
      const mockDecrypted = {
        toString: vi.fn().mockReturnValue('{"sensitive":"information"}')
      };
      vi.mocked(CryptoJS.AES.decrypt).mockReturnValue(mockDecrypted as any);
      vi.mocked(CryptoJS.enc.Utf8.stringify).mockReturnValue('{"sensitive":"information"}');

      const encryptedData = 'encrypted-data';
      const key = 'encryption-key';

      const result = securityService.decryptData(encryptedData, key);

      expect(CryptoJS.AES.decrypt).toHaveBeenCalledWith(encryptedData, key);
      expect(result).toEqual({ sensitive: 'information' });
    });

    it('should handle decryption errors', () => {
      vi.mocked(CryptoJS.AES.decrypt).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const encryptedData = 'encrypted-data';
      const key = 'encryption-key';

      expect(() => securityService.decryptData(encryptedData, key)).toThrow('Decryption failed');
    });

    it('should handle invalid JSON after decryption', () => {
      const mockDecrypted = {
        toString: vi.fn().mockReturnValue('invalid-json')
      };
      vi.mocked(CryptoJS.AES.decrypt).mockReturnValue(mockDecrypted as any);
      vi.mocked(CryptoJS.enc.Utf8.stringify).mockReturnValue('invalid-json');

      const encryptedData = 'encrypted-data';
      const key = 'encryption-key';

      expect(() => securityService.decryptData(encryptedData, key)).toThrow();
    });
  });

  describe('hashData', () => {
    it('should hash data successfully', () => {
      const mockHash = { toString: vi.fn().mockReturnValue('hashed-data') };
      vi.mocked(CryptoJS.SHA256).mockReturnValue(mockHash as any);

      const data = 'sensitive-data';

      const result = securityService.hashData(data);

      expect(CryptoJS.SHA256).toHaveBeenCalledWith(data);
      expect(result).toBe('hashed-data');
    });
  });

  describe('generateSecureKey', () => {
    it('should generate a secure key', () => {
      const mockWordArray = { toString: vi.fn().mockReturnValue('secure-key-123') };
      vi.mocked(CryptoJS.lib.WordArray.random).mockReturnValue(mockWordArray as any);

      const result = securityService.generateSecureKey(32);

      expect(CryptoJS.lib.WordArray.random).toHaveBeenCalledWith(32);
      expect(result).toBe('secure-key-123');
    });

    it('should use default key length if not specified', () => {
      const mockWordArray = { toString: vi.fn().mockReturnValue('secure-key-default') };
      vi.mocked(CryptoJS.lib.WordArray.random).mockReturnValue(mockWordArray as any);

      const result = securityService.generateSecureKey();

      expect(CryptoJS.lib.WordArray.random).toHaveBeenCalledWith(16);
      expect(result).toBe('secure-key-default');
    });
  });

  describe('validateDataIntegrity', () => {
    it('should validate data integrity successfully', () => {
      const data = { test: 'data' };
      const originalHash = 'original-hash';

      // Mock hash generation to return the same hash
      const mockHash = { toString: vi.fn().mockReturnValue(originalHash) };
      vi.mocked(CryptoJS.SHA256).mockReturnValue(mockHash as any);

      const result = securityService.validateDataIntegrity(data, originalHash);

      expect(result).toBe(true);
    });

    it('should detect data tampering', () => {
      const data = { test: 'modified-data' };
      const originalHash = 'original-hash';

      // Mock hash generation to return a different hash
      const mockHash = { toString: vi.fn().mockReturnValue('different-hash') };
      vi.mocked(CryptoJS.SHA256).mockReturnValue(mockHash as any);

      const result = securityService.validateDataIntegrity(data, originalHash);

      expect(result).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML input', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = securityService.sanitizeInput(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello World');
    });

    it('should handle null and undefined input', () => {
      expect(securityService.sanitizeInput(null)).toBe('');
      expect(securityService.sanitizeInput(undefined)).toBe('');
    });

    it('should preserve safe content', () => {
      const input = 'This is safe content with numbers 123 and symbols !@#';
      const result = securityService.sanitizeInput(input);

      expect(result).toBe(input);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'StrongP@ssw0rd123';
      const result = securityService.validatePassword(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const weakPassword = '123';
      const result = securityService.validatePassword(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should identify medium strength passwords', () => {
      const mediumPassword = 'Password123';
      const result = securityService.validatePassword(mediumPassword);

      expect(result.strength).toBe('medium');
    });

    it('should check for minimum length', () => {
      const shortPassword = 'Aa1!';
      const result = securityService.validatePassword(shortPassword);

      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should check for uppercase letters', () => {
      const noUppercase = 'password123!';
      const result = securityService.validatePassword(noUppercase);

      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should check for lowercase letters', () => {
      const noLowercase = 'PASSWORD123!';
      const result = securityService.validatePassword(noLowercase);

      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should check for numbers', () => {
      const noNumbers = 'Password!';
      const result = securityService.validatePassword(noNumbers);

      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should check for special characters', () => {
      const noSpecial = 'Password123';
      const result = securityService.validatePassword(noSpecial);

      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('generateCSRFToken', () => {
    it('should generate a CSRF token', () => {
      const mockWordArray = { toString: vi.fn().mockReturnValue('csrf-token-123') };
      vi.mocked(CryptoJS.lib.WordArray.random).mockReturnValue(mockWordArray as any);

      const result = securityService.generateCSRFToken();

      expect(CryptoJS.lib.WordArray.random).toHaveBeenCalledWith(32);
      expect(result).toBe('csrf-token-123');
    });
  });

  describe('validateCSRFToken', () => {
    it('should validate CSRF token successfully', () => {
      const token = 'valid-csrf-token';
      const storedToken = 'valid-csrf-token';

      const result = securityService.validateCSRFToken(token, storedToken);

      expect(result).toBe(true);
    });

    it('should reject invalid CSRF token', () => {
      const token = 'invalid-csrf-token';
      const storedToken = 'valid-csrf-token';

      const result = securityService.validateCSRFToken(token, storedToken);

      expect(result).toBe(false);
    });

    it('should handle null or undefined tokens', () => {
      expect(securityService.validateCSRFToken(null, 'stored-token')).toBe(false);
      expect(securityService.validateCSRFToken('token', null)).toBe(false);
      expect(securityService.validateCSRFToken(undefined, 'stored-token')).toBe(false);
    });
  });
});