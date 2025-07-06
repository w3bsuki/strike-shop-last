// Analytics Integration for Production
// Supports Google Analytics, Google Tag Manager, Facebook Pixel, and PostHog

// Type definitions for analytics libraries
type GtagCommand = 'config' | 'event' | 'js' | 'set';

interface GtagConfigParams {
  page_path?: string;
  page_title?: string;
  page_location?: string;
  [key: string]: unknown;
}

interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

type FbqCommand = 'init' | 'track' | 'trackCustom' | 'trackSingle' | 'trackSingleCustom';

interface PostHogInstance {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    posthog?: PostHogInstance;
  }
}

// Google Analytics
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Google Tag Manager
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

// Facebook Pixel
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

// PostHog
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Helper to check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Page view tracking
export const pageview = (url: string) => {
  if (!isProduction) return;
  
  // Google Analytics
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
  
  // Facebook Pixel
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'PageView');
  }
  
  // PostHog
  if (window.posthog && POSTHOG_KEY) {
    window.posthog.capture('$pageview');
  }
};

// Event tracking
interface EventParams {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
}

export const event = ({ action, category, label, value, ...otherParams }: EventParams) => {
  if (!isProduction) return;
  
  // Google Analytics
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...otherParams,
    });
  }
  
  // Facebook Pixel custom events
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('trackCustom', action, {
      category,
      label,
      value,
      ...otherParams,
    });
  }
  
  // PostHog
  if (window.posthog && POSTHOG_KEY) {
    window.posthog.capture(action, {
      category,
      label,
      value,
      ...otherParams,
    });
  }
};

// E-commerce tracking
export const trackPurchase = (transactionData: {
  transactionId: string;
  value: number;
  currency: string;
  tax?: number;
  shipping?: number;
  items: Array<{
    id: string;
    name: string;
    category?: string;
    quantity: number;
    price: number;
  }>;
}) => {
  if (!isProduction) return;
  
  // Google Analytics E-commerce
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionData.transactionId,
      value: transactionData.value,
      currency: transactionData.currency,
      tax: transactionData.tax,
      shipping: transactionData.shipping,
      items: transactionData.items,
    });
  }
  
  // Facebook Pixel Purchase
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'Purchase', {
      value: transactionData.value,
      currency: transactionData.currency,
      content_ids: transactionData.items.map(item => item.id),
      content_type: 'product',
      num_items: transactionData.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }
  
  // PostHog
  if (window.posthog && POSTHOG_KEY) {
    window.posthog.capture('purchase', transactionData);
  }
};

// Add to cart tracking
export const trackAddToCart = (item: {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}) => {
  if (!isProduction) return;
  
  // Google Analytics
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: item.price * item.quantity,
      items: [item],
    });
  }
  
  // Facebook Pixel
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'AddToCart', {
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      value: item.price * item.quantity,
      currency: 'USD',
    });
  }
  
  // PostHog
  if (window.posthog && POSTHOG_KEY) {
    window.posthog.capture('add_to_cart', item);
  }
};

// View item tracking
export const trackViewItem = (item: {
  id: string;
  name: string;
  category?: string;
  price: number;
}) => {
  if (!isProduction) return;
  
  // Google Analytics
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', 'view_item', {
      currency: 'USD',
      value: item.price,
      items: [item],
    });
  }
  
  // Facebook Pixel
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'ViewContent', {
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      value: item.price,
      currency: 'USD',
    });
  }
  
  // PostHog
  if (window.posthog && POSTHOG_KEY) {
    window.posthog.capture('view_item', item);
  }
};

// Search tracking
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  if (!isProduction) return;
  
  // Google Analytics
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }
  
  // Facebook Pixel
  if (window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'Search', {
      search_string: searchTerm,
      content_category: 'product',
    });
  }
  
  // PostHog
  if (window.posthog && POSTHOG_KEY) {
    window.posthog.capture('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }
};

// User identification (for logged-in users)
export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  if (!isProduction) return;
  
  // Google Analytics User ID
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
    });
  }
  
  // PostHog Identify
  if (window.posthog && POSTHOG_KEY) {
    window.posthog.identify(userId, traits);
  }
};

// Performance tracking
export const trackWebVitals = (metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}) => {
  if (!isProduction) return;
  
  // Google Analytics
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }
  
  // PostHog
  if (window.posthog && POSTHOG_KEY) {
    window.posthog.capture('web_vitals', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      metric_id: metric.id,
    });
  }
};

// Initialize analytics scripts
export const initializeAnalytics = () => {
  if (!isProduction) return;
  
  // Google Analytics
  if (GA_MEASUREMENT_ID) {
    const script1 = document.createElement('script');
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script1.async = true;
    document.head.appendChild(script1);
    
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);
  }
  
  // Google Tag Manager
  if (GTM_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${GTM_ID}');
    `;
    document.head.appendChild(script);
    
    // GTM noscript
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);
  }
  
  // Facebook Pixel
  if (FB_PIXEL_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FB_PIXEL_ID}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
    
    // Facebook Pixel noscript
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1" />`;
    document.body.appendChild(noscript);
  }
  
  // PostHog
  if (POSTHOG_KEY) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${POSTHOG_KEY}',{api_host:'${POSTHOG_HOST}'})
    `;
    document.head.appendChild(script);
  }
};

// Hotjar tracking (if needed)
export const initializeHotjar = (hjid: string, hjsv: number = 6) => {
  if (!isProduction) return;
  
  const script = document.createElement('script');
  script.innerHTML = `
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${hjid},hjsv:${hjsv}};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `;
  document.head.appendChild(script);
};