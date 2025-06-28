/**
 * Security Monitoring API
 * Admin endpoint for security statistics and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { securityMonitor } from '@/lib/security-monitoring';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check when available
    // For now, we'll assume authenticated users can access this in development
    if (process.env.NODE_ENV === 'production') {
      // In production, implement proper admin role checking
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get time window from query params (default 1 hour)
    const timeWindow = parseInt(
      request.nextUrl.searchParams.get('window') || '3600000'
    );

    // Get security statistics
    const stats = securityMonitor.getStatistics(timeWindow);

    // Get specific IP details if requested
    const ip = request.nextUrl.searchParams.get('ip');
    let ipDetails = null;
    if (ip) {
      ipDetails = {
        events: securityMonitor.getEventsByIP(ip, timeWindow),
        reputation: securityMonitor.getIPReputation(ip),
        shouldBlock: securityMonitor.shouldBlockIP(ip)
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        statistics: stats,
        ipDetails,
        timeWindow,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Security monitoring API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Block IP endpoint (POST)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Add admin role check using user.id
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ip, action } = body;

    if (!ip || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, just log the action
    // In production, integrate with your IP blocking mechanism
    console.log(`Security action requested: ${action} for IP ${ip}`);

    return NextResponse.json({
      success: true,
      message: `Action ${action} queued for IP ${ip}`
    });
  } catch (error) {
    console.error('Security action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}