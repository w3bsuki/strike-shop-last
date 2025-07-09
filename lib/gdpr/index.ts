/**
 * GDPR Utilities Index
 * Central export for all GDPR-related functionality
 */

export * from './middleware';
export * from './cookie-consent';
export * from './data-export';
export * from './data-deletion';

// Re-export commonly used functions
export {
  hasGDPRConsent,
  hasAcceptedPrivacyPolicy,
  getConsentPreferences,
  setGDPRConsent,
  setPrivacyPolicyAcceptance,
} from './middleware';

export {
  parseConsentCookie,
  serializeConsent,
  shouldBlockScript,
  generateConsentBannerHTML,
  generateConsentScript,
  generateGTMConsentScript,
  COOKIE_CONSENT_STYLES,
} from './cookie-consent';

export {
  exportUserData,
  generateDataExport,
  scheduleDataExport,
  getDataCategories,
} from './data-export';

export {
  deleteUserData,
  verifyDeletion,
  scheduleDeletion,
  processScheduledDeletions,
} from './data-deletion';