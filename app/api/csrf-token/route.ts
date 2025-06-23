/**
 * CSRF Token API Route
 * Provides CSRF tokens for client-side requests
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf-protection';

export async function GET(_request: NextRequest) {
  try {
    // Generate a new CSRF token
    const token = generateCSRFToken();

    // Create response with token
    const response = NextResponse.json({
      csrfToken: token,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Set token as HTTP-only cookie for security
    response.cookies.set('__csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (_error) {
    // Error generating token
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
