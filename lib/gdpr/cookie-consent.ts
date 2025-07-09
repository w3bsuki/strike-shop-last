/**
 * Cookie Consent Management
 * Handles cookie consent UI and preference management
 */

import { COOKIE_CATEGORIES } from './middleware';

export interface ConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentState {
  hasConsented: boolean;
  preferences: ConsentPreferences;
  consentDate?: string;
  lastUpdated?: string;
}

/**
 * Default consent state
 */
export const DEFAULT_CONSENT_STATE: ConsentState = {
  hasConsented: false,
  preferences: {
    necessary: true, // Always required
    functional: false,
    analytics: false,
    marketing: false,
  },
};

/**
 * Parse consent from cookie value
 */
export function parseConsentCookie(cookieValue: string | undefined): ConsentState {
  if (!cookieValue) {
    return DEFAULT_CONSENT_STATE;
  }
  
  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue));
    return {
      hasConsented: true,
      preferences: {
        necessary: true,
        functional: parsed.functional || false,
        analytics: parsed.analytics || false,
        marketing: parsed.marketing || false,
      },
      consentDate: parsed.consentDate,
      lastUpdated: parsed.lastUpdated,
    };
  } catch {
    return DEFAULT_CONSENT_STATE;
  }
}

/**
 * Serialize consent for cookie storage
 */
export function serializeConsent(state: ConsentState): string {
  const data = {
    functional: state.preferences.functional,
    analytics: state.preferences.analytics,
    marketing: state.preferences.marketing,
    consentDate: state.consentDate || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
  
  return encodeURIComponent(JSON.stringify(data));
}

/**
 * Get script blocking patterns based on consent
 */
export function getBlockedScripts(preferences: ConsentPreferences): string[] {
  const blocked: string[] = [];
  
  if (!preferences.analytics) {
    blocked.push(
      'google-analytics.com',
      'googletagmanager.com',
      'segment.com',
      'mixpanel.com',
      'amplitude.com',
      'heap.io',
      'hotjar.com',
      'fullstory.com',
    );
  }
  
  if (!preferences.marketing) {
    blocked.push(
      'doubleclick.net',
      'facebook.com/tr',
      'connect.facebook.net',
      'google-analytics.com/collect',
      'googlesyndication.com',
      'googleadservices.com',
      'pinterest.com',
      'twitter.com/i/adsct',
      'linkedin.com/li',
      'bing.com/bat',
    );
  }
  
  return blocked;
}

/**
 * Check if a script should be blocked
 */
export function shouldBlockScript(
  scriptUrl: string,
  preferences: ConsentPreferences,
): boolean {
  const blockedPatterns = getBlockedScripts(preferences);
  
  return blockedPatterns.some(pattern => 
    scriptUrl.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Generate consent banner HTML
 */
export function generateConsentBannerHTML(options: {
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
}): string {
  const privacyUrl = options.privacyPolicyUrl || '/privacy-policy';
  const cookieUrl = options.cookiePolicyUrl || '/cookie-policy';
  
  return `
    <div id="cookie-consent-banner" class="cookie-consent-banner">
      <div class="cookie-consent-content">
        <h3>We value your privacy</h3>
        <p>
          We use cookies to enhance your browsing experience, serve personalized content, 
          and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
        </p>
        <div class="cookie-consent-categories">
          ${Object.entries(COOKIE_CATEGORIES).map(([key, category]) => `
            <label class="cookie-category">
              <input 
                type="checkbox" 
                name="cookie-${key}" 
                value="${key}"
                ${category.required ? 'checked disabled' : ''}
                data-category="${key}"
              />
              <span class="cookie-category-name">${category.name}</span>
              <span class="cookie-category-desc">${category.description}</span>
            </label>
          `).join('')}
        </div>
        <div class="cookie-consent-actions">
          <button id="cookie-accept-all" class="btn-primary">Accept All</button>
          <button id="cookie-accept-selected" class="btn-secondary">Accept Selected</button>
          <button id="cookie-reject-all" class="btn-tertiary">Reject All</button>
        </div>
        <div class="cookie-consent-links">
          <a href="${privacyUrl}" target="_blank">Privacy Policy</a>
          <a href="${cookieUrl}" target="_blank">Cookie Policy</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate consent management script
 */
export function generateConsentScript(): string {
  return `
    (function() {
      // Cookie consent management
      const CookieConsent = {
        // Get current consent state
        getConsent: function() {
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('gdpr-consent='));
          
          if (!cookie) return null;
          
          try {
            return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          } catch {
            return null;
          }
        },
        
        // Set consent
        setConsent: function(preferences) {
          const data = {
            functional: preferences.functional || false,
            analytics: preferences.analytics || false,
            marketing: preferences.marketing || false,
            consentDate: new Date().toISOString(),
          };
          
          document.cookie = 'gdpr-consent=' + encodeURIComponent(JSON.stringify(data)) + 
            '; path=/; max-age=' + (365 * 24 * 60 * 60) + '; secure; samesite=strict';
          
          // Reload to apply consent
          window.location.reload();
        },
        
        // Show banner
        showBanner: function() {
          const banner = document.getElementById('cookie-consent-banner');
          if (banner) {
            banner.style.display = 'block';
          }
        },
        
        // Hide banner
        hideBanner: function() {
          const banner = document.getElementById('cookie-consent-banner');
          if (banner) {
            banner.style.display = 'none';
          }
        },
        
        // Initialize
        init: function() {
          const consent = this.getConsent();
          
          if (!consent) {
            this.showBanner();
            this.attachEventListeners();
          }
        },
        
        // Attach event listeners
        attachEventListeners: function() {
          // Accept all
          document.getElementById('cookie-accept-all')?.addEventListener('click', () => {
            this.setConsent({
              functional: true,
              analytics: true,
              marketing: true,
            });
          });
          
          // Accept selected
          document.getElementById('cookie-accept-selected')?.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('[data-category]');
            const preferences = {};
            
            checkboxes.forEach(cb => {
              if (cb.checked) {
                preferences[cb.dataset.category] = true;
              }
            });
            
            this.setConsent(preferences);
          });
          
          // Reject all
          document.getElementById('cookie-reject-all')?.addEventListener('click', () => {
            this.setConsent({
              functional: false,
              analytics: false,
              marketing: false,
            });
          });
        }
      };
      
      // Initialize on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CookieConsent.init());
      } else {
        CookieConsent.init();
      }
      
      // Export for global use
      window.CookieConsent = CookieConsent;
    })();
  `;
}

/**
 * Generate GTM consent mode script
 */
export function generateGTMConsentScript(preferences: ConsentPreferences): string {
  return `
    // Google Consent Mode
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    
    gtag('consent', 'default', {
      'ad_storage': '${preferences.marketing ? 'granted' : 'denied'}',
      'ad_user_data': '${preferences.marketing ? 'granted' : 'denied'}',
      'ad_personalization': '${preferences.marketing ? 'granted' : 'denied'}',
      'analytics_storage': '${preferences.analytics ? 'granted' : 'denied'}',
      'functionality_storage': '${preferences.functional ? 'granted' : 'denied'}',
      'personalization_storage': '${preferences.functional ? 'granted' : 'denied'}',
      'security_storage': 'granted',
      'wait_for_update': 500
    });
  `;
}

/**
 * Cookie consent CSS styles
 */
export const COOKIE_CONSENT_STYLES = `
  .cookie-consent-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e5e5e5;
    padding: 20px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    display: none;
  }
  
  .cookie-consent-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .cookie-consent-content h3 {
    margin: 0 0 10px;
    font-size: 20px;
  }
  
  .cookie-consent-content p {
    margin: 0 0 20px;
    color: #666;
  }
  
  .cookie-consent-categories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .cookie-category {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
  }
  
  .cookie-category input[type="checkbox"] {
    margin-top: 2px;
  }
  
  .cookie-category-name {
    font-weight: 600;
    display: block;
  }
  
  .cookie-category-desc {
    font-size: 14px;
    color: #666;
    display: block;
  }
  
  .cookie-consent-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .cookie-consent-actions button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
  
  .btn-primary {
    background: #000;
    color: white;
  }
  
  .btn-secondary {
    background: #666;
    color: white;
  }
  
  .btn-tertiary {
    background: #f5f5f5;
    color: #333;
  }
  
  .cookie-consent-links {
    display: flex;
    gap: 20px;
    font-size: 14px;
  }
  
  .cookie-consent-links a {
    color: #666;
    text-decoration: underline;
  }
  
  @media (max-width: 768px) {
    .cookie-consent-categories {
      grid-template-columns: 1fr;
    }
    
    .cookie-consent-actions {
      flex-direction: column;
    }
    
    .cookie-consent-actions button {
      width: 100%;
    }
  }
`;