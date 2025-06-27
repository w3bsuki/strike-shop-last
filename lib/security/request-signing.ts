/**
 * REQUEST SIGNING IMPLEMENTATION
 * HMAC-SHA256 based request signing for internal API communication
 */

import crypto from 'crypto'
import { NextRequest } from 'next/server'

// Configuration
const SIGNATURE_HEADER = 'x-api-signature'
const TIMESTAMP_HEADER = 'x-api-timestamp'
const REQUEST_ID_HEADER = 'x-request-id'
const SIGNATURE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

interface SignaturePayload {
  method: string
  path: string
  timestamp: number
  requestId: string
  body?: any
  queryParams?: Record<string, string>
}

export class RequestSigner {
  private static secret: string = process.env.INTERNAL_API_SECRET || ''

  /**
   * Sign a request payload using HMAC-SHA256
   */
  static sign(payload: SignaturePayload): string {
    if (!this.secret) {
      throw new Error('INTERNAL_API_SECRET not configured')
    }

    // Create deterministic string representation
    const signatureBase = this.createSignatureBase(payload)
    
    // Generate HMAC signature
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(signatureBase)
      .digest('hex')

    return signature
  }

  /**
   * Verify a request signature
   */
  static verify(request: NextRequest, body?: any): boolean {
    try {
      const signature = request.headers.get(SIGNATURE_HEADER)
      const timestamp = request.headers.get(TIMESTAMP_HEADER)
      const requestId = request.headers.get(REQUEST_ID_HEADER)

      if (!signature || !timestamp || !requestId) {
        return false
      }

      // Check timestamp expiry
      const timestampNum = parseInt(timestamp)
      if (isNaN(timestampNum) || Date.now() - timestampNum > SIGNATURE_EXPIRY_MS) {
        return false
      }

      // Extract query parameters
      const queryParams: Record<string, string> = {}
      request.nextUrl.searchParams.forEach((value, key) => {
        queryParams[key] = value
      })

      // Recreate signature payload
      const payload: SignaturePayload = {
        method: request.method,
        path: request.nextUrl.pathname,
        timestamp: timestampNum,
        requestId,
        body,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined
      }

      // Calculate expected signature
      const expectedSignature = this.sign(payload)

      // Constant-time comparison to prevent timing attacks
      return this.secureCompare(signature, expectedSignature)
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  /**
   * Create signature headers for a request
   */
  static createHeaders(
    method: string,
    path: string,
    body?: any,
    queryParams?: Record<string, string>
  ): Record<string, string> {
    const timestamp = Date.now()
    const requestId = crypto.randomUUID()

    const payload: SignaturePayload = {
      method,
      path,
      timestamp,
      requestId,
      body,
      queryParams
    }

    const signature = this.sign(payload)

    return {
      [SIGNATURE_HEADER]: signature,
      [TIMESTAMP_HEADER]: timestamp.toString(),
      [REQUEST_ID_HEADER]: requestId
    }
  }

  /**
   * Create deterministic signature base string
   */
  private static createSignatureBase(payload: SignaturePayload): string {
    const parts = [
      payload.method.toUpperCase(),
      payload.path,
      payload.timestamp.toString(),
      payload.requestId
    ]

    // Add sorted query parameters
    if (payload.queryParams) {
      const sortedParams = Object.keys(payload.queryParams)
        .sort()
        .map(key => `${key}=${payload.queryParams![key]}`)
        .join('&')
      parts.push(sortedParams)
    }

    // Add body hash if present
    if (payload.body !== undefined) {
      const bodyString = typeof payload.body === 'string' 
        ? payload.body 
        : JSON.stringify(payload.body)
      const bodyHash = crypto
        .createHash('sha256')
        .update(bodyString)
        .digest('hex')
      parts.push(bodyHash)
    }

    return parts.join('|')
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }
}

/**
 * Express/Connect middleware for request signature verification
 */
export function requireSignature(req: any, res: any, next: any) {
  const signature = req.headers[SIGNATURE_HEADER]
  const timestamp = req.headers[TIMESTAMP_HEADER]
  const requestId = req.headers[REQUEST_ID_HEADER]

  if (!signature || !timestamp || !requestId) {
    return res.status(401).json({
      error: {
        code: 'MISSING_SIGNATURE',
        message: 'Request signature required'
      }
    })
  }

  // Check timestamp
  const timestampNum = parseInt(timestamp)
  if (isNaN(timestampNum) || Date.now() - timestampNum > SIGNATURE_EXPIRY_MS) {
    return res.status(401).json({
      error: {
        code: 'EXPIRED_SIGNATURE',
        message: 'Request signature expired'
      }
    })
  }

  // Verify signature
  const payload: SignaturePayload = {
    method: req.method,
    path: req.path,
    timestamp: timestampNum,
    requestId,
    body: req.body,
    queryParams: req.query
  }

  const expectedSignature = RequestSigner.sign(payload)
  if (!RequestSigner.secureCompare(signature, expectedSignature)) {
    return res.status(401).json({
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Invalid request signature'
      }
    })
  }

  next()
}

/**
 * Next.js API route wrapper with signature verification
 */
export function withRequestSigning(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    // Parse body if needed
    let body
    if (req.headers.get('content-type')?.includes('application/json')) {
      try {
        body = await req.json()
      } catch (error) {
        // Body parsing error
      }
    }

    // Verify signature
    if (!RequestSigner.verify(req, body)) {
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Request signature verification failed'
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Call original handler
    return handler(req)
  }
}

/**
 * Client helper for making signed requests
 */
export class SignedApiClient {
  constructor(private baseUrl: string, private secret: string) {
    RequestSigner['secret'] = secret
  }

  async request(
    method: string,
    path: string,
    options?: {
      body?: any
      queryParams?: Record<string, string>
      headers?: Record<string, string>
    }
  ): Promise<Response> {
    const url = new URL(path, this.baseUrl)
    
    // Add query parameters
    if (options?.queryParams) {
      Object.entries(options.queryParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    // Create signature headers
    const signatureHeaders = RequestSigner.createHeaders(
      method,
      url.pathname,
      options?.body,
      options?.queryParams
    )

    // Make request
    return fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...signatureHeaders,
        ...options?.headers
      },
      body: options?.body ? JSON.stringify(options.body) : undefined
    })
  }

  get(path: string, options?: { queryParams?: Record<string, string> }) {
    return this.request('GET', path, options)
  }

  post(path: string, body: any, options?: { queryParams?: Record<string, string> }) {
    return this.request('POST', path, { body, ...options })
  }

  put(path: string, body: any, options?: { queryParams?: Record<string, string> }) {
    return this.request('PUT', path, { body, ...options })
  }

  delete(path: string, options?: { queryParams?: Record<string, string> }) {
    return this.request('DELETE', path, options)
  }
}