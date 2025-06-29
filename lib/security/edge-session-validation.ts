/**
 * Edge Runtime compatible session validation
 * Uses JWT tokens instead of Redis for Edge Runtime compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface EdgeSession {
  userId: string;
  email: string;
  role?: string;
  createdAt: number;
  expiresAt: number;
}

export async function createEdgeSession(
  userId: string,
  email: string,
  role?: string
): Promise<string> {
  const now = Date.now();
  const expiresAt = now + (4 * 60 * 60 * 1000); // 4 hours

  const jwt = await new SignJWT({
    userId,
    email,
    role,
    createdAt: now,
    expiresAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('4h')
    .sign(JWT_SECRET);

  return jwt;
}

export async function validateEdgeSession(
  token: string
): Promise<EdgeSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Additional validation
    const now = Date.now();
    if (payload.expiresAt && Number(payload.expiresAt) < now) {
      return null;
    }

    const session: any = {
      userId: payload.userId as string,
      email: payload.email as string,
      createdAt: Number(payload.createdAt),
      expiresAt: Number(payload.expiresAt),
    };
    
    if (payload.role) {
      session.role = payload.role as string;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}

export async function validateSessionMiddleware(request: NextRequest) {
  // Get session token from cookies
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    return {
      valid: false,
      session: null,
      response: null,
    };
  }

  const session = await validateEdgeSession(sessionToken);

  if (!session) {
    return {
      valid: false,
      session: null,
      response: null,
    };
  }

  // Check if session needs rotation (every hour)
  const sessionAge = Date.now() - session.createdAt;
  const shouldRotate = sessionAge > (60 * 60 * 1000); // 1 hour

  if (shouldRotate) {
    // Create new session with same data
    const newToken = await createEdgeSession(
      session.userId,
      session.email,
      session.role
    );

    const response = NextResponse.next();
    response.cookies.set('session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60, // 4 hours
      path: '/',
    });

    return {
      valid: true,
      session: {
        ...session,
        id: crypto.randomUUID(),
        metadata: { role: session.role },
      },
      response,
    };
  }

  return {
    valid: true,
    session: {
      ...session,
      id: crypto.randomUUID(),
      metadata: { role: session.role },
    },
    response: null,
  };
}