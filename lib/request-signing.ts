/**
 * Request Signing for Internal API Security
 * Implements HMAC-based request signing for API authentication
 */

import { createHmac } from 'crypto';

// Signing configuration
const SIGNING_CONFIG = {
  ALGORITHM: 'sha256',
  TIMESTAMP_TOLERANCE: 300000, // 5 minutes
  REPLAY_WINDOW: 300000, // 5 minutes
  HEADER_PREFIX: 'X-Strike-',
};

// Request signature interface
export interface SignedRequest {
  signature: string;
  timestamp: string;
  nonce: string;
  contentHash?: string;
}

// Nonce store to prevent replay attacks
class NonceStore {
  private static instance: NonceStore;
  private nonces = new Map<string, number>();

  static getInstance(): NonceStore {
    if (!NonceStore.instance) {
      NonceStore.instance = new NonceStore();
    }
    return NonceStore.instance;
  }

  // Check if nonce has been used
  hasNonce(nonce: string): boolean {
    return this.nonces.has(nonce);
  }

  // Add nonce with expiration
  addNonce(nonce: string): void {
    const now = Date.now();
    this.nonces.set(nonce, now);
    
    // Clean up expired nonces
    if (Math.random() < 0.01) {
      this.cleanup();
    }
  }

  // Clean up expired nonces
  private cleanup(): void {
    const cutoff = Date.now() - SIGNING_CONFIG.REPLAY_WINDOW;
    for (const [nonce, timestamp] of this.nonces.entries()) {
      if (timestamp < cutoff) {
        this.nonces.delete(nonce);
      }
    }
  }
}

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

/**
 * Calculate content hash for request body
 */
export function calculateContentHash(content: string | Buffer): string {
  const hash = createHmac(SIGNING_CONFIG.ALGORITHM, '')
    .update(content)
    .digest('base64url');
  return hash;
}

/**
 * Create canonical request string for signing
 */
export function createCanonicalRequest(
  method: string,
  path: string,
  timestamp: string,
  nonce: string,
  contentHash?: string
): string {
  const parts = [
    method.toUpperCase(),
    path,
    timestamp,
    nonce,
  ];
  
  if (contentHash) {
    parts.push(contentHash);
  }
  
  return parts.join('\n');
}

/**
 * Sign a request
 */
export function signRequest(
  secret: string,
  method: string,
  path: string,
  body?: string | Buffer
): SignedRequest {
  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  const contentHash = body ? calculateContentHash(body) : undefined;
  
  const canonicalRequest = createCanonicalRequest(
    method,
    path,
    timestamp,
    nonce,
    contentHash
  );
  
  const signature = createHmac(SIGNING_CONFIG.ALGORITHM, secret)
    .update(canonicalRequest)
    .digest('base64url');
  
  return {
    signature,
    timestamp,
    nonce,
    contentHash,
  };
}

/**
 * Verify request signature
 */
export function verifySignature(
  secret: string,
  method: string,
  path: string,
  signature: string,
  timestamp: string,
  nonce: string,
  contentHash?: string,
  body?: string | Buffer
): { isValid: boolean; error?: string } {
  const nonceStore = NonceStore.getInstance();
  
  // Check timestamp tolerance
  const requestTime = parseInt(timestamp);
  const now = Date.now();
  if (isNaN(requestTime) || Math.abs(now - requestTime) > SIGNING_CONFIG.TIMESTAMP_TOLERANCE) {
    return { isValid: false, error: 'Request timestamp out of tolerance' };
  }
  
  // Check nonce for replay attack
  if (nonceStore.hasNonce(nonce)) {
    return { isValid: false, error: 'Nonce already used (replay attack)' };
  }
  
  // Verify content hash if provided
  if (contentHash && body) {
    const expectedHash = calculateContentHash(body);
    if (contentHash !== expectedHash) {
      return { isValid: false, error: 'Content hash mismatch' };
    }
  }
  
  // Recreate signature
  const canonicalRequest = createCanonicalRequest(
    method,
    path,
    timestamp,
    nonce,
    contentHash
  );
  
  const expectedSignature = createHmac(SIGNING_CONFIG.ALGORITHM, secret)
    .update(canonicalRequest)
    .digest('base64url');
  
  // Timing-safe comparison
  const signatureValid = timingSafeEqual(signature, expectedSignature);
  
  if (signatureValid) {
    // Mark nonce as used
    nonceStore.addNonce(nonce);
    return { isValid: true };
  }
  
  return { isValid: false, error: 'Invalid signature' };
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Express/Next.js middleware for request signing
 */
export function createSigningMiddleware(getSecret: (req: any) => string | Promise<string>) {
  return async (req: any, res: any, next: any) => {
    const signature = req.headers[`${SIGNING_CONFIG.HEADER_PREFIX}signature`];
    const timestamp = req.headers[`${SIGNING_CONFIG.HEADER_PREFIX}timestamp`];
    const nonce = req.headers[`${SIGNING_CONFIG.HEADER_PREFIX}nonce`];
    const contentHash = req.headers[`${SIGNING_CONFIG.HEADER_PREFIX}content-hash`];
    
    if (!signature || !timestamp || !nonce) {
      return res.status(401).json({ error: 'Missing signature headers' });
    }
    
    try {
      const secret = await getSecret(req);
      const body = req.body ? JSON.stringify(req.body) : undefined;
      
      const verification = verifySignature(
        secret,
        req.method,
        req.path || req.url,
        signature,
        timestamp,
        nonce,
        contentHash,
        body
      );
      
      if (!verification.isValid) {
        return res.status(401).json({ error: verification.error || 'Invalid signature' });
      }
      
      next();
    } catch (error) {
      console.error('Signature verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Client helper for making signed requests
 */
export class SignedApiClient {
  constructor(
    private baseUrl: string,
    private secret: string
  ) {}
  
  async request(
    method: string,
    path: string,
    options?: {
      body?: any;
      headers?: Record<string, string>;
    }
  ): Promise<Response> {
    const body = options?.body ? JSON.stringify(options.body) : undefined;
    const signed = signRequest(this.secret, method, path, body);
    
    const headers: Record<string, string> = {
      ...options?.headers,
      [`${SIGNING_CONFIG.HEADER_PREFIX}Signature`]: signed.signature,
      [`${SIGNING_CONFIG.HEADER_PREFIX}Timestamp`]: signed.timestamp,
      [`${SIGNING_CONFIG.HEADER_PREFIX}Nonce`]: signed.nonce,
    };
    
    if (signed.contentHash) {
      headers[`${SIGNING_CONFIG.HEADER_PREFIX}Content-Hash`] = signed.contentHash;
    }
    
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    
    return fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body,
    });
  }
  
  get(path: string, options?: { headers?: Record<string, string> }) {
    return this.request('GET', path, options);
  }
  
  post(path: string, body?: any, options?: { headers?: Record<string, string> }) {
    return this.request('POST', path, { ...options, body });
  }
  
  put(path: string, body?: any, options?: { headers?: Record<string, string> }) {
    return this.request('PUT', path, { ...options, body });
  }
  
  delete(path: string, options?: { headers?: Record<string, string> }) {
    return this.request('DELETE', path, options);
  }
}

/**
 * Generate API key pair for internal services
 */
export function generateApiKeyPair(): { apiKey: string; apiSecret: string } {
  const apiKey = generateNonce();
  const apiSecret = generateNonce() + generateNonce(); // Longer secret
  
  return { apiKey, apiSecret };
}