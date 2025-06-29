import Redis from 'ioredis';
import { z } from 'zod';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
  historySize: number;
  adminRotationDays: number;
}

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  historySize: 5,
  adminRotationDays: 90
};

export interface PasswordStrength {
  score: number; // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  meetsPolicy: boolean;
}

export class PasswordSecurity {
  private redis: Redis;
  private policy: PasswordPolicy;
  private commonPasswords: Set<string>;

  constructor(policy: Partial<PasswordPolicy> = {}) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.policy = { ...DEFAULT_POLICY, ...policy };
    this.commonPasswords = new Set();
    this.loadCommonPasswords();
  }

  // Load common passwords list
  private async loadCommonPasswords(): Promise<void> {
    // Top 1000 most common passwords
    const commonList = [
      'password', '123456', 'password123', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'qwerty', 'abc123',
      'Password1', 'password1', '123456789', 'welcome123',
      'admin123', 'root', 'toor', 'pass', 'test', 'guest',
      '12345', '1234', '123', '1', 'password1234', 'admin1234',
      'qwerty123', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
      // Add more from a comprehensive list
    ];
    
    commonList.forEach(pwd => this.commonPasswords.add(pwd.toLowerCase()));
  }

  // Validate password against policy
  async validatePassword(
    password: string,
    userInfo?: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
    }
  ): Promise<{
    valid: boolean;
    errors: string[];
    strength: PasswordStrength;
  }> {
    const errors: string[] = [];
    const strength = this.calculateStrength(password);

    // Check minimum length
    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters long`);
    }

    // Check character requirements
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check common passwords
    if (this.policy.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more unique password');
    }

    // Check user info
    if (this.policy.preventUserInfo && userInfo) {
      if (this.containsUserInfo(password, userInfo)) {
        errors.push('Password should not contain personal information');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      strength
    };
  }

  // Calculate password strength
  private calculateStrength(password: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];

    // Length score (max 30 points)
    const lengthScore = Math.min(30, password.length * 2);
    score += lengthScore;

    // Character diversity (max 40 points)
    let diversity = 0;
    if (/[a-z]/.test(password)) diversity++;
    if (/[A-Z]/.test(password)) diversity++;
    if (/[0-9]/.test(password)) diversity++;
    if (/[^a-zA-Z0-9]/.test(password)) diversity++;
    score += diversity * 10;

    // Pattern penalty
    if (this.hasRepeatingPatterns(password)) {
      score -= 10;
      feedback.push('Avoid repeating patterns');
    }

    if (this.hasSequentialPatterns(password)) {
      score -= 10;
      feedback.push('Avoid sequential characters');
    }

    // Common patterns penalty
    if (this.hasCommonPatterns(password)) {
      score -= 15;
      feedback.push('Avoid common patterns like "123" or "abc"');
    }

    // Entropy bonus (max 30 points)
    const entropy = this.calculateEntropy(password);
    score += Math.min(30, Math.floor(entropy / 2));

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine level
    let level: PasswordStrength['level'];
    if (score < 20) level = 'very-weak';
    else if (score < 40) level = 'weak';
    else if (score < 60) level = 'fair';
    else if (score < 80) level = 'good';
    else if (score < 95) level = 'strong';
    else level = 'very-strong';

    // Add feedback based on score
    if (score < 60) {
      if (password.length < 12) {
        feedback.push('Use at least 12 characters');
      }
      if (diversity < 3) {
        feedback.push('Mix uppercase, lowercase, numbers, and symbols');
      }
    }

    return {
      score,
      level,
      feedback,
      meetsPolicy: score >= 60
    };
  }

  // Calculate password entropy
  private calculateEntropy(password: string): number {
    const charSpace = this.getCharacterSpace(password);
    return password.length * Math.log2(charSpace);
  }

  // Get character space size
  private getCharacterSpace(password: string): number {
    let space = 0;
    if (/[a-z]/.test(password)) space += 26;
    if (/[A-Z]/.test(password)) space += 26;
    if (/[0-9]/.test(password)) space += 10;
    if (/[^a-zA-Z0-9]/.test(password)) space += 32;
    return space;
  }

  // Check for repeating patterns
  private hasRepeatingPatterns(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }

  // Check for sequential patterns
  private hasSequentialPatterns(password: string): boolean {
    const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const lowerPassword = password.toLowerCase();
    
    for (const seq of sequences) {
      for (let i = 0; i < lowerPassword.length - 2; i++) {
        const substr = lowerPassword.substring(i, i + 3);
        if (seq.includes(substr) || seq.split('').reverse().join('').includes(substr)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Check for common patterns
  private hasCommonPatterns(password: string): boolean {
    const patterns = [
      /^[a-zA-Z]+[0-9]+$/, // letters followed by numbers
      /^[0-9]+[a-zA-Z]+$/, // numbers followed by letters
      /^[a-zA-Z]+[!@#$%^&*]+$/, // letters followed by symbols
      /^.+123$/, // ends with 123
      /^.+[0-9]{4}$/, // ends with 4 digits (like year)
    ];
    
    return patterns.some(pattern => pattern.test(password));
  }

  // Check if password is common
  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    
    // Check exact match
    if (this.commonPasswords.has(lowerPassword)) {
      return true;
    }
    
    // Check variations (with numbers/symbols at end)
    const basePattern = /^([a-zA-Z]+)[0-9!@#$%^&*]+$/;
    const match = lowerPassword.match(basePattern);
    if (match && match[1] && this.commonPasswords.has(match[1])) {
      return true;
    }
    
    return false;
  }

  // Check if password contains user info
  private containsUserInfo(password: string, userInfo: any): boolean {
    const lowerPassword = password.toLowerCase();
    const infoValues = Object.values(userInfo)
      .filter((v): v is string => v !== null && v !== undefined && typeof v === 'string' && v.length > 2)
      .map(v => v.toLowerCase());
    
    return infoValues.some(info => {
      // Check if password contains the info
      if (lowerPassword.includes(info)) return true;
      
      // Check if info is part of password with modifications
      const infoVariations = [
        info,
        info.replace(/[aeiou]/g, ''), // Remove vowels
        info.split('').reverse().join(''), // Reversed
      ];
      
      return infoVariations.some(variation => 
        lowerPassword.includes(variation) && variation.length > 2
      );
    });
  }

  // Store password in history
  async addToPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    const historyKey = `password:history:${userId}`;
    
    // Add to history
    await this.redis.lpush(historyKey, passwordHash);
    
    // Trim to keep only last N passwords
    await this.redis.ltrim(historyKey, 0, this.policy.historySize - 1);
    
    // Set expiration to 1 year
    await this.redis.expire(historyKey, 365 * 24 * 60 * 60);
  }

  // Check if password was used before
  async isPasswordInHistory(userId: string, passwordHash: string): Promise<boolean> {
    const historyKey = `password:history:${userId}`;
    const history = await this.redis.lrange(historyKey, 0, -1);
    
    return history.includes(passwordHash);
  }

  // Check if admin password needs rotation
  async checkAdminPasswordRotation(userId: string, isAdmin: boolean): Promise<{
    needsRotation: boolean;
    lastChanged?: Date;
    daysOverdue?: number;
  }> {
    if (!isAdmin) {
      return { needsRotation: false };
    }

    const lastChangedKey = `password:lastchanged:${userId}`;
    const lastChangedStr = await this.redis.get(lastChangedKey);
    
    if (!lastChangedStr) {
      // No record of password change, needs rotation
      return { needsRotation: true };
    }

    const lastChanged = new Date(lastChangedStr);
    const daysSinceChange = Math.floor(
      (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const needsRotation = daysSinceChange >= this.policy.adminRotationDays;
    
    return {
      needsRotation,
      lastChanged,
      daysOverdue: needsRotation ? daysSinceChange - this.policy.adminRotationDays : 0
    };
  }

  // Record password change
  async recordPasswordChange(userId: string): Promise<void> {
    const lastChangedKey = `password:lastchanged:${userId}`;
    await this.redis.set(lastChangedKey, new Date().toISOString());
  }

  // Generate secure password
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each required set
    if (this.policy.requireUppercase) {
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
    }
    if (this.policy.requireLowercase) {
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
    }
    if (this.policy.requireNumbers) {
      password += numbers[Math.floor(Math.random() * numbers.length)];
    }
    if (this.policy.requireSpecialChars) {
      password += symbols[Math.floor(Math.random() * symbols.length)];
    }
    
    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Close Redis connection
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let passwordSecurityInstance: PasswordSecurity | null = null;

export function getPasswordSecurity(): PasswordSecurity {
  if (!passwordSecurityInstance) {
    passwordSecurityInstance = new PasswordSecurity();
  }
  return passwordSecurityInstance;
}

// Zod schema for password validation
export const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

// Helper function for password validation in forms
export async function validatePasswordInput(
  password: string,
  userInfo?: any
): Promise<{ valid: boolean; errors: string[]; strength: PasswordStrength }> {
  const passwordSecurity = getPasswordSecurity();
  return passwordSecurity.validatePassword(password, userInfo);
}