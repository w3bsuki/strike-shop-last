import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';

// Generate a secure CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

// Validate CSRF token from request
export async function validateCSRF(req: NextRequest): Promise<boolean> {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return true;
  }

  // Skip for webhook endpoints (they have their own signature validation)
  if (req.nextUrl.pathname.startsWith('/api/webhooks/')) {
    return true;
  }

  // Get token from header
  const headerToken = req.headers.get(CSRF_HEADER);
  if (!headerToken) {
    throw new Error('CSRF token missing from request headers');
  }

  // Get token from cookie
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  if (!cookieToken) {
    throw new Error('CSRF token missing from cookies');
  }

  // Constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken)
  );

  if (!isValid) {
    // Potential CSRF attack detected

    throw new Error('Invalid CSRF token');
  }

  return true;
}

// Double Submit Cookie Pattern implementation
export class CSRFProtection {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || process.env.CSRF_SECRET || generateCSRFToken();
  }

  // Generate a signed token
  generateToken(sessionId: string): string {
    const timestamp = Date.now();
    const payload = `${sessionId}.${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    return `${payload}.${signature}`;
  }

  // Validate a signed token
  validateToken(token: string, sessionId: string, maxAge = 3600000): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const [tokenSessionId, timestamp, signature] = parts;

      // Verify session ID matches
      if (tokenSessionId !== sessionId) return false;

      // Check token age
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > maxAge) return false;

      // Verify signature
      const payload = `${tokenSessionId}.${timestamp}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {

      return false;
    }
  }
}

// Synchronizer Token Pattern implementation
export class SynchronizerTokenPattern {
  private tokens: Map<string, { token: string; createdAt: number }>;
  private maxAge: number;

  constructor(maxAge = 3600000) {
    // 1 hour default
    this.tokens = new Map();
    this.maxAge = maxAge;

    // Clean up expired tokens periodically
    setInterval(() => this.cleanup(), 300000); // Every 5 minutes
  }

  generateToken(sessionId: string): string {
    const token = generateCSRFToken();
    this.tokens.set(sessionId, {
      token,
      createdAt: Date.now(),
    });
    return token;
  }

  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);

    if (!stored) return false;

    // Check if token expired
    if (Date.now() - stored.createdAt > this.maxAge) {
      this.tokens.delete(sessionId);
      return false;
    }

    // Validate token
    const isValid = crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(stored.token)
    );

    // Single-use: delete token after validation
    if (isValid) {
      this.tokens.delete(sessionId);
    }

    return isValid;
  }

  private cleanup() {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now - data.createdAt > this.maxAge) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

// Export singleton instances
export const csrfProtection = new CSRFProtection();
export const synchronizerToken = new SynchronizerTokenPattern();
