/**
 * API KEY MANAGEMENT SYSTEM
 * Secure API key generation, rotation, and permission management
 */

import crypto from 'crypto'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// API Key configuration
const API_KEY_CONFIG = {
  PREFIX: 'sk_', // Secret key prefix
  LENGTH: 32, // Key length in bytes
  HASH_ALGORITHM: 'sha256',
  DEFAULT_EXPIRY_DAYS: 90,
  MAX_EXPIRY_DAYS: 365,
  ROTATION_WARNING_DAYS: 14
}

// Permission scopes
export enum ApiKeyScope {
  // Read permissions
  READ_PRODUCTS = 'read:products',
  READ_ORDERS = 'read:orders',
  READ_USERS = 'read:users',
  READ_ANALYTICS = 'read:analytics',
  
  // Write permissions
  WRITE_PRODUCTS = 'write:products',
  WRITE_ORDERS = 'write:orders',
  WRITE_USERS = 'write:users',
  
  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_BILLING = 'admin:billing',
  
  // Special permissions
  WEBHOOKS = 'webhooks',
  INTERNAL_API = 'internal:api',
  THIRD_PARTY = 'third_party'
}

// Predefined permission sets
export const PERMISSION_SETS = {
  READ_ONLY: [
    ApiKeyScope.READ_PRODUCTS,
    ApiKeyScope.READ_ORDERS,
    ApiKeyScope.READ_ANALYTICS
  ],
  STANDARD: [
    ApiKeyScope.READ_PRODUCTS,
    ApiKeyScope.READ_ORDERS,
    ApiKeyScope.WRITE_ORDERS,
    ApiKeyScope.READ_USERS
  ],
  ADMIN: Object.values(ApiKeyScope),
  WEBHOOK: [ApiKeyScope.WEBHOOKS],
  INTERNAL: [ApiKeyScope.INTERNAL_API]
}

// API Key metadata interface
interface ApiKeyMetadata {
  id: string
  name: string
  keyHash: string
  userId: string
  scopes: ApiKeyScope[]
  expiresAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  usageCount: number
  ipWhitelist?: string[]
  metadata?: Record<string, any>
}

// API Key creation options
interface CreateApiKeyOptions {
  name: string
  userId: string
  scopes: ApiKeyScope[]
  expiresInDays?: number
  ipWhitelist?: string[]
  metadata?: Record<string, any>
}

// API Key validation schemas
export const apiKeySchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    scopes: z.array(z.nativeEnum(ApiKeyScope)).min(1),
    expiresInDays: z.number().int().positive().max(API_KEY_CONFIG.MAX_EXPIRY_DAYS).optional(),
    ipWhitelist: z.array(z.string().ip()).optional(),
    metadata: z.record(z.any()).optional()
  }),
  
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    scopes: z.array(z.nativeEnum(ApiKeyScope)).min(1).optional(),
    ipWhitelist: z.array(z.string().ip()).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.any()).optional()
  }),
  
  rotate: z.object({
    currentKeyId: z.string().uuid(),
    expiresInDays: z.number().int().positive().max(API_KEY_CONFIG.MAX_EXPIRY_DAYS).optional()
  })
}

export class ApiKeyManager {
  /**
   * Generate a new API key
   */
  static generateApiKey(): { key: string; hash: string } {
    // Generate random bytes
    const randomBytes = crypto.randomBytes(API_KEY_CONFIG.LENGTH)
    const key = API_KEY_CONFIG.PREFIX + randomBytes.toString('base64url')
    
    // Create hash for storage
    const hash = crypto
      .createHash(API_KEY_CONFIG.HASH_ALGORITHM)
      .update(key)
      .digest('hex')
    
    return { key, hash }
  }

  /**
   * Create a new API key
   */
  static async createApiKey(options: CreateApiKeyOptions): Promise<{
    key: string
    metadata: ApiKeyMetadata
  }> {
    // Validate options
    const validated = apiKeySchemas.create.parse(options)
    
    // Generate key
    const { key, hash } = this.generateApiKey()
    
    // Calculate expiry
    const expiresAt = validated.expiresInDays
      ? new Date(Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000)
      : null
    
    // Save to database
    const metadata = await prisma.apiKey.create({
      data: {
        name: validated.name,
        keyHash: hash,
        userId: options.userId,
        scopes: validated.scopes,
        expiresAt,
        ipWhitelist: validated.ipWhitelist,
        metadata: validated.metadata,
        isActive: true,
        usageCount: 0
      }
    })
    
    // Log key creation
    await this.logApiKeyEvent(metadata.id, 'created', options.userId)
    
    return { key, metadata }
  }

  /**
   * Validate an API key
   */
  static async validateApiKey(key: string): Promise<{
    valid: boolean
    metadata?: ApiKeyMetadata
    error?: string
  }> {
    try {
      // Check key format
      if (!key.startsWith(API_KEY_CONFIG.PREFIX)) {
        return { valid: false, error: 'Invalid key format' }
      }
      
      // Hash the key
      const hash = crypto
        .createHash(API_KEY_CONFIG.HASH_ALGORITHM)
        .update(key)
        .digest('hex')
      
      // Find key in database
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          keyHash: hash,
          isActive: true
        }
      })
      
      if (!apiKey) {
        return { valid: false, error: 'Invalid or inactive API key' }
      }
      
      // Check expiry
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { valid: false, error: 'API key expired' }
      }
      
      // Update usage
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 }
        }
      })
      
      return { valid: true, metadata: apiKey }
      
    } catch (error) {
      console.error('API key validation error:', error)
      return { valid: false, error: 'Validation error' }
    }
  }

  /**
   * Check if API key has required scope
   */
  static hasScope(metadata: ApiKeyMetadata, requiredScope: ApiKeyScope): boolean {
    return metadata.scopes.includes(requiredScope)
  }

  /**
   * Check if API key has any of the required scopes
   */
  static hasAnyScope(metadata: ApiKeyMetadata, requiredScopes: ApiKeyScope[]): boolean {
    return requiredScopes.some(scope => this.hasScope(metadata, scope))
  }

  /**
   * Check if API key has all required scopes
   */
  static hasAllScopes(metadata: ApiKeyMetadata, requiredScopes: ApiKeyScope[]): boolean {
    return requiredScopes.every(scope => this.hasScope(metadata, scope))
  }

  /**
   * Validate IP whitelist
   */
  static validateIpWhitelist(metadata: ApiKeyMetadata, clientIp: string): boolean {
    if (!metadata.ipWhitelist || metadata.ipWhitelist.length === 0) {
      return true // No whitelist means all IPs allowed
    }
    
    return metadata.ipWhitelist.includes(clientIp)
  }

  /**
   * Rotate an API key
   */
  static async rotateApiKey(
    currentKeyId: string,
    userId: string,
    expiresInDays?: number
  ): Promise<{ newKey: string; oldKeyId: string }> {
    // Get current key metadata
    const currentKey = await prisma.apiKey.findFirst({
      where: {
        id: currentKeyId,
        userId,
        isActive: true
      }
    })
    
    if (!currentKey) {
      throw new Error('API key not found or inactive')
    }
    
    // Create new key with same permissions
    const { key: newKey, metadata: newMetadata } = await this.createApiKey({
      name: `${currentKey.name} (Rotated)`,
      userId,
      scopes: currentKey.scopes as ApiKeyScope[],
      expiresInDays,
      ipWhitelist: currentKey.ipWhitelist || undefined,
      metadata: {
        ...currentKey.metadata,
        rotatedFrom: currentKeyId,
        rotatedAt: new Date().toISOString()
      }
    })
    
    // Schedule old key for deactivation
    const deactivationDate = new Date(Date.now() + API_KEY_CONFIG.ROTATION_WARNING_DAYS * 24 * 60 * 60 * 1000)
    await prisma.apiKey.update({
      where: { id: currentKeyId },
      data: {
        metadata: {
          ...currentKey.metadata,
          rotatedTo: newMetadata.id,
          scheduledDeactivation: deactivationDate.toISOString()
        }
      }
    })
    
    // Log rotation
    await this.logApiKeyEvent(currentKeyId, 'rotated', userId, {
      newKeyId: newMetadata.id
    })
    
    return { newKey, oldKeyId: currentKeyId }
  }

  /**
   * Revoke an API key
   */
  static async revokeApiKey(keyId: string, userId: string, reason?: string): Promise<void> {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId
      }
    })
    
    if (!apiKey) {
      throw new Error('API key not found')
    }
    
    // Deactivate key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        metadata: {
          ...apiKey.metadata,
          revokedAt: new Date().toISOString(),
          revokedReason: reason
        }
      }
    })
    
    // Log revocation
    await this.logApiKeyEvent(keyId, 'revoked', userId, { reason })
  }

  /**
   * List API keys for a user
   */
  static async listApiKeys(
    userId: string,
    options?: {
      includeInactive?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<ApiKeyMetadata[]> {
    const keys = await prisma.apiKey.findMany({
      where: {
        userId,
        ...(options?.includeInactive ? {} : { isActive: true })
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' }
    })
    
    return keys
  }

  /**
   * Get API key usage statistics
   */
  static async getApiKeyStats(keyId: string): Promise<{
    totalRequests: number
    lastUsed: Date | null
    averageRequestsPerDay: number
    daysUntilExpiry: number | null
  }> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId }
    })
    
    if (!apiKey) {
      throw new Error('API key not found')
    }
    
    const createdDays = Math.ceil((Date.now() - apiKey.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    const averageRequestsPerDay = apiKey.usageCount / Math.max(1, createdDays)
    
    const daysUntilExpiry = apiKey.expiresAt
      ? Math.ceil((apiKey.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null
    
    return {
      totalRequests: apiKey.usageCount,
      lastUsed: apiKey.lastUsedAt,
      averageRequestsPerDay,
      daysUntilExpiry
    }
  }

  /**
   * Check for keys needing rotation
   */
  static async getKeysNeedingRotation(userId: string): Promise<ApiKeyMetadata[]> {
    const warningDate = new Date(Date.now() + API_KEY_CONFIG.ROTATION_WARNING_DAYS * 24 * 60 * 60 * 1000)
    
    const keys = await prisma.apiKey.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          lte: warningDate
        }
      }
    })
    
    return keys
  }

  /**
   * Log API key events
   */
  private static async logApiKeyEvent(
    keyId: string,
    event: string,
    userId: string,
    metadata?: any
  ): Promise<void> {
    await prisma.apiKeyEvent.create({
      data: {
        keyId,
        event,
        userId,
        metadata,
        timestamp: new Date()
      }
    })
  }
}

/**
 * Express/Connect middleware for API key authentication
 */
export function requireApiKey(requiredScopes?: ApiKeyScope[]) {
  return async (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key
    
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key required'
        }
      })
    }
    
    // Validate key
    const { valid, metadata, error } = await ApiKeyManager.validateApiKey(apiKey)
    
    if (!valid || !metadata) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: error || 'Invalid API key'
        }
      })
    }
    
    // Check IP whitelist
    const clientIp = req.ip || req.connection.remoteAddress
    if (!ApiKeyManager.validateIpWhitelist(metadata, clientIp)) {
      return res.status(403).json({
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'IP address not whitelisted'
        }
      })
    }
    
    // Check required scopes
    if (requiredScopes && requiredScopes.length > 0) {
      if (!ApiKeyManager.hasAnyScope(metadata, requiredScopes)) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'API key lacks required permissions',
            requiredScopes
          }
        })
      }
    }
    
    // Attach metadata to request
    req.apiKey = metadata
    
    next()
  }
}

/**
 * Next.js API route wrapper with API key authentication
 */
export function withApiKey(
  handler: (req: any, res: any) => Promise<void>,
  requiredScopes?: ApiKeyScope[]
) {
  return async (req: any, res: any) => {
    const middleware = requireApiKey(requiredScopes)
    
    return new Promise((resolve) => {
      middleware(req, res, async () => {
        await handler(req, res)
        resolve(undefined)
      })
    })
  }
}