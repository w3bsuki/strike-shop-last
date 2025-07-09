/**
 * GDPR Data Deletion Utilities
 * Implements right to erasure (right to be forgotten) under GDPR Article 17
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Data retention policies
 */
const RETENTION_POLICIES = {
  // Legal requirements
  financial_records: 7 * 365, // 7 years for tax purposes
  order_records: 6 * 365, // 6 years for warranty/returns
  
  // Business requirements  
  analytics_data: 90, // 90 days
  activity_logs: 30, // 30 days
  abandoned_carts: 7, // 7 days
  
  // Immediate deletion
  marketing_data: 0,
  wishlist_data: 0,
  review_data: 0,
} as const;

/**
 * Delete user data (right to be forgotten)
 */
export async function deleteUserData(
  userId: string,
  options: {
    immediate?: boolean;
    reason?: string;
    excludeCategories?: string[];
  } = {},
): Promise<{
  success: boolean;
  deletedCategories: string[];
  retainedCategories: string[];
  scheduledDeletions: Array<{ category: string; deleteAfter: Date }>;
  error?: string;
}> {
  try {
    const deletedCategories: string[] = [];
    const retainedCategories: string[] = [];
    const scheduledDeletions: Array<{ category: string; deleteAfter: Date }> = [];
    
    // Log deletion request
    await logDeletionRequest(userId, options.reason);
    
    // 1. Immediate deletions (non-essential data)
    if (!options.excludeCategories?.includes('marketing')) {
      await deleteMarketingData(userId);
      deletedCategories.push('marketing');
    }
    
    if (!options.excludeCategories?.includes('wishlist')) {
      await deleteWishlistData(userId);
      deletedCategories.push('wishlist');
    }
    
    if (!options.excludeCategories?.includes('reviews')) {
      await anonymizeReviews(userId);
      deletedCategories.push('reviews');
    }
    
    if (!options.excludeCategories?.includes('preferences')) {
      await deletePreferences(userId);
      deletedCategories.push('preferences');
    }
    
    if (!options.excludeCategories?.includes('sessions')) {
      await deleteSessions(userId);
      deletedCategories.push('sessions');
    }
    
    // 2. Anonymize personal data in retained records
    if (!options.immediate) {
      // Orders - anonymize but retain for legal requirements
      await anonymizeOrders(userId);
      retainedCategories.push('orders');
      scheduledDeletions.push({
        category: 'orders',
        deleteAfter: new Date(Date.now() + RETENTION_POLICIES.order_records * 24 * 60 * 60 * 1000),
      });
      
      // Financial records
      await anonymizeFinancialRecords(userId);
      retainedCategories.push('financial');
      scheduledDeletions.push({
        category: 'financial',
        deleteAfter: new Date(Date.now() + RETENTION_POLICIES.financial_records * 24 * 60 * 60 * 1000),
      });
    }
    
    // 3. Delete or anonymize profile
    if (options.immediate) {
      await deleteProfile(userId);
      deletedCategories.push('profile');
    } else {
      await anonymizeProfile(userId);
      deletedCategories.push('profile-anonymized');
    }
    
    // 4. Clear all cookies and tokens
    await clearAllTokens(userId);
    
    // 5. Remove from mailing lists
    await removeFromMailingLists(userId);
    
    // 6. Delete from third-party services
    await deleteFromThirdPartyServices(userId);
    
    return {
      success: true,
      deletedCategories,
      retainedCategories,
      scheduledDeletions,
    };
  } catch (error) {
    console.error('Data deletion error:', error);
    return {
      success: false,
      deletedCategories: [],
      retainedCategories: [],
      scheduledDeletions: [],
      error: error instanceof Error ? error.message : 'Deletion failed',
    };
  }
}

/**
 * Delete marketing data
 */
async function deleteMarketingData(userId: string): Promise<void> {
  await supabase.from('marketing_preferences').delete().eq('user_id', userId);
  await supabase.from('email_subscriptions').delete().eq('user_id', userId);
  await supabase.from('campaign_interactions').delete().eq('user_id', userId);
}

/**
 * Delete wishlist data
 */
async function deleteWishlistData(userId: string): Promise<void> {
  await supabase.from('wishlists').delete().eq('user_id', userId);
}

/**
 * Anonymize reviews (keep for product stats)
 */
async function anonymizeReviews(userId: string): Promise<void> {
  await supabase
    .from('reviews')
    .update({
      user_id: null,
      user_name: 'Anonymous',
      user_email: null,
    })
    .eq('user_id', userId);
}

/**
 * Delete preferences
 */
async function deletePreferences(userId: string): Promise<void> {
  await supabase.from('user_preferences').delete().eq('user_id', userId);
}

/**
 * Delete sessions
 */
async function deleteSessions(userId: string): Promise<void> {
  await supabase.from('sessions').delete().eq('user_id', userId);
  await supabase.from('refresh_tokens').delete().eq('user_id', userId);
}

/**
 * Anonymize orders (retain for legal requirements)
 */
async function anonymizeOrders(userId: string): Promise<void> {
  const anonymizedEmail = `deleted-${userId.substring(0, 8)}@anonymized.local`;
  
  // Get user's orders from Shopify and anonymize
  // This is a placeholder - implement actual Shopify integration
  
  // Update local order records
  await supabase
    .from('order_records')
    .update({
      customer_email: anonymizedEmail,
      customer_name: 'Deleted User',
      shipping_address: {
        name: 'Deleted User',
        line1: 'Address Removed',
        city: 'Unknown',
        country: 'XX',
      },
      billing_address: {
        name: 'Deleted User',
        line1: 'Address Removed',
        city: 'Unknown',
        country: 'XX',
      },
    })
    .eq('user_id', userId);
}

/**
 * Anonymize financial records
 */
async function anonymizeFinancialRecords(userId: string): Promise<void> {
  await supabase
    .from('payment_records')
    .update({
      customer_name: 'Deleted User',
      customer_email: null,
      metadata: {},
    })
    .eq('user_id', userId);
}

/**
 * Delete profile completely
 */
async function deleteProfile(userId: string): Promise<void> {
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.auth.admin.deleteUser(userId);
}

/**
 * Anonymize profile
 */
async function anonymizeProfile(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      email: `deleted-${userId.substring(0, 8)}@anonymized.local`,
      name: 'Deleted User',
      phone: null,
      date_of_birth: null,
      metadata: {},
    })
    .eq('id', userId);
}

/**
 * Clear all tokens
 */
async function clearAllTokens(userId: string): Promise<void> {
  // Implementation depends on your token storage
  await supabase.from('tokens').delete().eq('user_id', userId);
}

/**
 * Remove from mailing lists
 */
async function removeFromMailingLists(userId: string): Promise<void> {
  // Integrate with email service provider
  // Example: SendGrid, Mailchimp, etc.
}

/**
 * Delete from third-party services
 */
async function deleteFromThirdPartyServices(userId: string): Promise<void> {
  // Google Analytics
  // Facebook Pixel
  // Other analytics services
}

/**
 * Log deletion request
 */
async function logDeletionRequest(userId: string, reason?: string): Promise<void> {
  await supabase.from('deletion_requests').insert({
    user_id: userId,
    reason,
    requested_at: new Date().toISOString(),
    status: 'processing',
  });
}

/**
 * Verify deletion completion
 */
export async function verifyDeletion(userId: string): Promise<{
  complete: boolean;
  remainingData: string[];
}> {
  const remainingData: string[] = [];
  
  // Check each data category
  const checks = [
    { table: 'profiles', field: 'id' },
    { table: 'wishlists', field: 'user_id' },
    { table: 'marketing_preferences', field: 'user_id' },
    { table: 'user_preferences', field: 'user_id' },
    { table: 'sessions', field: 'user_id' },
  ];
  
  for (const check of checks) {
    const { count } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true })
      .eq(check.field, userId);
    
    if (count && count > 0) {
      remainingData.push(check.table);
    }
  }
  
  return {
    complete: remainingData.length === 0,
    remainingData,
  };
}

/**
 * Schedule deletion after retention period
 */
export async function scheduleDeletion(
  userId: string,
  category: string,
  deleteAfter: Date,
): Promise<void> {
  await supabase.from('scheduled_deletions').insert({
    user_id: userId,
    category,
    delete_after: deleteAfter.toISOString(),
    created_at: new Date().toISOString(),
  });
}

/**
 * Process scheduled deletions
 */
export async function processScheduledDeletions(): Promise<{
  processed: number;
  errors: string[];
}> {
  const now = new Date();
  let processed = 0;
  const errors: string[] = [];
  
  try {
    // Get due deletions
    const { data: dueDeletions } = await supabase
      .from('scheduled_deletions')
      .select('*')
      .lte('delete_after', now.toISOString())
      .eq('processed', false);
    
    if (!dueDeletions) return { processed, errors };
    
    for (const deletion of dueDeletions) {
      try {
        // Process deletion based on category
        switch (deletion.category) {
          case 'orders':
            await deleteOrderData(deletion.user_id);
            break;
          case 'financial':
            await deleteFinancialData(deletion.user_id);
            break;
          default:
            console.warn(`Unknown deletion category: ${deletion.category}`);
        }
        
        // Mark as processed
        await supabase
          .from('scheduled_deletions')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', deletion.id);
        
        processed++;
      } catch (error) {
        errors.push(`Failed to process deletion ${deletion.id}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to fetch scheduled deletions: ${error}`);
  }
  
  return { processed, errors };
}

/**
 * Delete order data (after retention period)
 */
async function deleteOrderData(userId: string): Promise<void> {
  await supabase.from('order_records').delete().eq('user_id', userId);
}

/**
 * Delete financial data (after retention period)
 */
async function deleteFinancialData(userId: string): Promise<void> {
  await supabase.from('payment_records').delete().eq('user_id', userId);
}