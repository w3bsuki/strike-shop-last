/**
 * GDPR Data Export Utilities
 * Implements data portability rights under GDPR Article 20
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Export all user data in a portable format (JSON)
 */
export async function exportUserData(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Collect all user data from different sources
    const userData: any = {
      exportDate: new Date().toISOString(),
      userId,
      dataCategories: {},
    };
    
    // 1. Profile data from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    userData.dataCategories.profile = profile;
    
    // 2. Order history from Shopify
    const orders = await exportShopifyOrders(profile.email);
    userData.dataCategories.orders = orders;
    
    // 3. Cart data
    const { data: carts } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId);
    
    userData.dataCategories.carts = carts || [];
    
    // 4. Wishlist data
    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId);
    
    userData.dataCategories.wishlist = wishlist || [];
    
    // 5. Reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId);
    
    userData.dataCategories.reviews = reviews || [];
    
    // 6. Preferences and settings
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);
    
    userData.dataCategories.preferences = preferences || [];
    
    // 7. Activity logs (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: activities } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString());
    
    userData.dataCategories.activities = activities || [];
    
    // 8. Consent history
    const { data: consents } = await supabase
      .from('consent_logs')
      .select('*')
      .eq('user_id', userId);
    
    userData.dataCategories.consents = consents || [];
    
    // 9. Support tickets
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId);
    
    userData.dataCategories.supportTickets = tickets || [];
    
    // Add metadata
    userData.metadata = {
      exportFormat: 'JSON',
      exportVersion: '1.0',
      dataRetentionPolicy: 'https://strike-shop.com/data-retention',
      privacyPolicy: 'https://strike-shop.com/privacy',
    };
    
    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error('Data export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Export Shopify order data
 */
async function exportShopifyOrders(email: string): Promise<any[]> {
  try {
    // This would integrate with Shopify Admin API
    // For now, returning mock structure
    const shopifyOrders: any[] = []; // Fetch from Shopify
    
    return shopifyOrders.map(order => ({
      // Sanitize order data
      orderId: order,
      // ... other non-sensitive order fields
    }));
  } catch (error) {
    console.error('Shopify export error:', error);
    return [];
  }
}

/**
 * Generate data export in different formats
 */
export async function generateDataExport(
  userId: string,
  format: 'json' | 'csv' | 'pdf' = 'json',
): Promise<{
  success: boolean;
  data?: Buffer;
  filename?: string;
  mimeType?: string;
  error?: string;
}> {
  try {
    const exportResult = await exportUserData(userId);
    
    if (!exportResult.success || !exportResult.data) {
      throw new Error(exportResult.error || 'Export failed');
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'json': {
        const jsonData = JSON.stringify(exportResult.data, null, 2);
        return {
          success: true,
          data: Buffer.from(jsonData),
          filename: `user-data-export-${timestamp}.json`,
          mimeType: 'application/json',
        };
      }
      
      case 'csv': {
        const csvData = await convertToCSV(exportResult.data);
        return {
          success: true,
          data: Buffer.from(csvData),
          filename: `user-data-export-${timestamp}.csv`,
          mimeType: 'text/csv',
        };
      }
      
      case 'pdf': {
        const pdfData = await generatePDFReport(exportResult.data);
        return {
          success: true,
          data: pdfData,
          filename: `user-data-export-${timestamp}.pdf`,
          mimeType: 'application/pdf',
        };
      }
      
      default:
        throw new Error('Invalid format');
    }
  } catch (error) {
    console.error('Generate export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export generation failed',
    };
  }
}

/**
 * Convert data to CSV format
 */
async function convertToCSV(data: any): Promise<string> {
  // Simplified CSV conversion
  // In production, use a proper CSV library
  const lines: string[] = ['Category,Field,Value'];
  
  for (const [category, items] of Object.entries(data.dataCategories)) {
    if (Array.isArray(items)) {
      items.forEach((item, index) => {
        for (const [key, value] of Object.entries(item)) {
          lines.push(`${category}[${index}],${key},"${value}"`);
        }
      });
    } else if (typeof items === 'object' && items !== null) {
      for (const [key, value] of Object.entries(items)) {
        lines.push(`${category},${key},"${value}"`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate PDF report
 */
async function generatePDFReport(data: any): Promise<Buffer> {
  // In production, use a PDF generation library like puppeteer or pdfkit
  // For now, return a placeholder
  const pdfContent = `
    User Data Export Report
    Generated: ${data.exportDate}
    
    ${JSON.stringify(data, null, 2)}
  `;
  
  return Buffer.from(pdfContent);
}

/**
 * Schedule automatic data export
 */
export async function scheduleDataExport(
  userId: string,
  frequency: 'monthly' | 'quarterly' | 'yearly',
  email: string,
): Promise<{
  success: boolean;
  scheduleId?: string;
  error?: string;
}> {
  try {
    // Store export schedule
    const { data, error } = await supabase
      .from('data_export_schedules')
      .insert({
        user_id: userId,
        frequency,
        email,
        next_export: calculateNextExportDate(frequency),
        active: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      scheduleId: data.id,
    };
  } catch (error) {
    console.error('Schedule export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Scheduling failed',
    };
  }
}

/**
 * Calculate next export date
 */
function calculateNextExportDate(frequency: 'monthly' | 'quarterly' | 'yearly'): Date {
  const date = new Date();
  
  switch (frequency) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date;
}

/**
 * Get data categories and descriptions
 */
export function getDataCategories() {
  return {
    profile: {
      name: 'Profile Information',
      description: 'Your account details and personal information',
      fields: ['name', 'email', 'phone', 'addresses'],
    },
    orders: {
      name: 'Order History',
      description: 'Your purchase history and order details',
      fields: ['order_id', 'date', 'items', 'total', 'status'],
    },
    carts: {
      name: 'Shopping Carts',
      description: 'Saved and abandoned cart data',
      fields: ['items', 'created_at', 'updated_at'],
    },
    wishlist: {
      name: 'Wishlist',
      description: 'Products you have saved for later',
      fields: ['product_id', 'added_at'],
    },
    reviews: {
      name: 'Product Reviews',
      description: 'Reviews and ratings you have submitted',
      fields: ['product_id', 'rating', 'comment', 'created_at'],
    },
    preferences: {
      name: 'Preferences',
      description: 'Your settings and communication preferences',
      fields: ['language', 'currency', 'notifications', 'marketing'],
    },
    activities: {
      name: 'Activity Logs',
      description: 'Your recent activity on the site',
      fields: ['action', 'timestamp', 'ip_address'],
    },
    consents: {
      name: 'Consent History',
      description: 'Your privacy and cookie consent history',
      fields: ['type', 'granted', 'timestamp'],
    },
    supportTickets: {
      name: 'Support Tickets',
      description: 'Your customer support interactions',
      fields: ['ticket_id', 'subject', 'status', 'created_at'],
    },
  };
}