/**
 * CSP Violation Report Handler
 * Receives and processes Content Security Policy violation reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseCSPViolationReport, shouldIgnoreCSPViolation, formatCSPViolation } from '@/lib/security/csp';

export async function POST(request: NextRequest) {
  try {
    // Parse the CSP report
    const body = await request.json();
    const report = parseCSPViolationReport(body);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Invalid CSP report format' },
        { status: 400 }
      );
    }
    
    // Check if we should ignore this violation
    if (shouldIgnoreCSPViolation(report)) {
      return NextResponse.json({ status: 'ignored' });
    }
    
    // Log the violation
    const formattedViolation = formatCSPViolation(report);
    console.error('[CSP Violation]', formattedViolation);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, DataDog, or other monitoring service
      await sendToMonitoring(report);
    }
    
    // Store violation for analysis (optional)
    await storeViolation(report);
    
    return NextResponse.json({ status: 'reported' });
  } catch (error) {
    console.error('CSP report handler error:', error);
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 500 }
    );
  }
}

/**
 * Send violation to monitoring service
 */
async function sendToMonitoring(report: any): Promise<void> {
  // Example: Send to Sentry
  if (process.env.SENTRY_DSN) {
    // Sentry integration would go here
  }
  
  // Example: Send to custom monitoring endpoint
  if (process.env.MONITORING_ENDPOINT) {
    try {
      await fetch(process.env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`,
        },
        body: JSON.stringify({
          type: 'csp-violation',
          timestamp: new Date().toISOString(),
          report,
        }),
      });
    } catch (error) {
      console.error('Failed to send to monitoring:', error);
    }
  }
}

/**
 * Store violation for analysis
 */
async function storeViolation(report: any): Promise<void> {
  // In production, store in database for analysis
  // This helps identify patterns and false positives
  
  try {
    // Example: Store in Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      
      await supabase.from('csp_violations').insert({
        document_uri: report['csp-report']['document-uri'],
        violated_directive: report['csp-report']['violated-directive'],
        blocked_uri: report['csp-report']['blocked-uri'],
        source_file: report['csp-report']['source-file'],
        line_number: report['csp-report']['line-number'],
        column_number: report['csp-report']['column-number'],
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Failed to store violation:', error);
  }
}

// Disable body parsing for CSP reports (they can be large)
export const runtime = 'edge';