import {
  pageview,
  event,
  trackPurchase,
  trackAddToCart,
  trackViewItem,
  trackSearch,
  identifyUser,
  trackWebVitals,
  initializeAnalytics,
  GA_MEASUREMENT_ID,
  GTM_ID,
  FB_PIXEL_ID,
  POSTHOG_KEY,
} from './analytics';

// Mock environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'GA-TEST-ID';
process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST-ID';
process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = 'FB-TEST-ID';
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'PH-TEST-KEY';

describe('Analytics', () => {
  let mockGtag: jest.Mock;
  let mockFbq: jest.Mock;
  let mockPosthog: any;

  beforeEach(() => {
    // Reset window object
    mockGtag = jest.fn();
    mockFbq = jest.fn();
    mockPosthog = {
      capture: jest.fn(),
      identify: jest.fn(),
      reset: jest.fn(),
    };

    // @ts-ignore
    global.window = {
      gtag: mockGtag,
      fbq: mockFbq,
      posthog: mockPosthog,
      dataLayer: [],
    };

    // Mock document methods
    document.createElement = jest.fn(() => ({
      setAttribute: jest.fn(),
      appendChild: jest.fn(),
    })) as any;
    document.head = { appendChild: jest.fn() } as any;
    document.body = { 
      appendChild: jest.fn(),
      insertBefore: jest.fn(),
      firstChild: null,
    } as any;

    jest.clearAllMocks();
  });

  describe('pageview', () => {
    it('tracks pageview across all analytics platforms', () => {
      pageview('/test-page');

      expect(mockGtag).toHaveBeenCalledWith('config', GA_MEASUREMENT_ID, {
        page_path: '/test-page',
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView');

      expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview');
    });

    it('does not track in non-production environment', () => {
      process.env.NODE_ENV = 'development';

      pageview('/test-page');

      expect(mockGtag).not.toHaveBeenCalled();
      expect(mockFbq).not.toHaveBeenCalled();
      expect(mockPosthog.capture).not.toHaveBeenCalled();

      process.env.NODE_ENV = 'production';
    });

    it('handles missing analytics providers gracefully', () => {
      // @ts-ignore
      window.gtag = undefined;
      // @ts-ignore
      window.fbq = undefined;
      // @ts-ignore
      window.posthog = undefined;

      expect(() => pageview('/test-page')).not.toThrow();
    });
  });

  describe('event', () => {
    it('tracks custom events with all parameters', () => {
      event({
        action: 'button_click',
        category: 'engagement',
        label: 'header_cta',
        value: 10,
        custom_param: 'test',
      });

      expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', {
        event_category: 'engagement',
        event_label: 'header_cta',
        value: 10,
        custom_param: 'test',
      });

      expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'button_click', {
        category: 'engagement',
        label: 'header_cta',
        value: 10,
        custom_param: 'test',
      });

      expect(mockPosthog.capture).toHaveBeenCalledWith('button_click', {
        category: 'engagement',
        label: 'header_cta',
        value: 10,
        custom_param: 'test',
      });
    });
  });

  describe('trackPurchase', () => {
    it('tracks purchase event with transaction details', () => {
      const transactionData = {
        transactionId: 'TXN-123',
        value: 299.99,
        currency: 'EUR',
        tax: 50,
        shipping: 10,
        items: [
          {
            id: 'PROD-1',
            name: 'Test Product',
            category: 'Electronics',
            quantity: 2,
            price: 144.995,
          },
        ],
      };

      trackPurchase(transactionData);

      expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
        transaction_id: 'TXN-123',
        value: 299.99,
        currency: 'EUR',
        tax: 50,
        shipping: 10,
        items: transactionData.items,
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 299.99,
        currency: 'EUR',
        content_ids: ['PROD-1'],
        content_type: 'product',
        num_items: 2,
      });

      expect(mockPosthog.capture).toHaveBeenCalledWith('purchase', transactionData);
    });
  });

  describe('trackAddToCart', () => {
    it('tracks add to cart event', () => {
      const item = {
        id: 'PROD-1',
        name: 'Test Product',
        category: 'Clothing',
        price: 49.99,
        quantity: 1,
      };

      trackAddToCart(item);

      expect(mockGtag).toHaveBeenCalledWith('event', 'add_to_cart', {
        currency: 'USD',
        value: 49.99,
        items: [item],
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'AddToCart', {
        content_ids: ['PROD-1'],
        content_name: 'Test Product',
        content_category: 'Clothing',
        value: 49.99,
        currency: 'USD',
      });

      expect(mockPosthog.capture).toHaveBeenCalledWith('add_to_cart', item);
    });
  });

  describe('trackViewItem', () => {
    it('tracks view item event', () => {
      const item = {
        id: 'PROD-1',
        name: 'Test Product',
        category: 'Accessories',
        price: 29.99,
      };

      trackViewItem(item);

      expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', {
        currency: 'USD',
        value: 29.99,
        items: [item],
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', {
        content_ids: ['PROD-1'],
        content_name: 'Test Product',
        content_category: 'Accessories',
        value: 29.99,
        currency: 'USD',
      });

      expect(mockPosthog.capture).toHaveBeenCalledWith('view_item', item);
    });
  });

  describe('trackSearch', () => {
    it('tracks search event with results count', () => {
      trackSearch('winter jackets', 15);

      expect(mockGtag).toHaveBeenCalledWith('event', 'search', {
        search_term: 'winter jackets',
        results_count: 15,
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Search', {
        search_string: 'winter jackets',
        content_category: 'product',
      });

      expect(mockPosthog.capture).toHaveBeenCalledWith('search', {
        search_term: 'winter jackets',
        results_count: 15,
      });
    });
  });

  describe('identifyUser', () => {
    it('identifies user across platforms', () => {
      const traits = {
        email: 'test@example.com',
        plan: 'premium',
        created_at: '2024-01-01',
      };

      identifyUser('USER-123', traits);

      expect(mockGtag).toHaveBeenCalledWith('config', GA_MEASUREMENT_ID, {
        user_id: 'USER-123',
      });

      expect(mockPosthog.identify).toHaveBeenCalledWith('USER-123', traits);
    });
  });

  describe('trackWebVitals', () => {
    it('tracks web vitals metrics', () => {
      const metric = {
        name: 'LCP',
        value: 2500,
        rating: 'needs-improvement' as const,
        delta: 100,
        id: 'v1-123456789',
      };

      trackWebVitals(metric);

      expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'LCP',
        value: 2500,
        metric_id: 'v1-123456789',
        metric_value: 2500,
        metric_delta: 100,
        metric_rating: 'needs-improvement',
        non_interaction: true,
      });

      expect(mockPosthog.capture).toHaveBeenCalledWith('web_vitals', {
        metric_name: 'LCP',
        metric_value: 2500,
        metric_rating: 'needs-improvement',
        metric_delta: 100,
        metric_id: 'v1-123456789',
      });
    });

    it('rounds CLS values correctly', () => {
      const clsMetric = {
        name: 'CLS',
        value: 0.123,
        rating: 'good' as const,
        delta: 0.01,
        id: 'v1-987654321',
      };

      trackWebVitals(clsMetric);

      const gtagCall = mockGtag.mock.calls[0];
      expect(gtagCall[2].value).toBe(123); // 0.123 * 1000
    });
  });

  describe('initializeAnalytics', () => {
    it('initializes all analytics scripts', () => {
      initializeAnalytics();

      // Check that scripts were created
      const createElementCalls = (document.createElement as jest.Mock).mock.calls;
      expect(createElementCalls.length).toBeGreaterThan(0);

      // Check that scripts were appended
      expect(document.head.appendChild).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('does not initialize in non-production', () => {
      process.env.NODE_ENV = 'development';

      initializeAnalytics();

      expect(document.createElement).not.toHaveBeenCalled();

      process.env.NODE_ENV = 'production';
    });

    it('handles missing configuration gracefully', () => {
      // Remove some env vars
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      delete process.env.NEXT_PUBLIC_FB_PIXEL_ID;

      expect(() => initializeAnalytics()).not.toThrow();

      // Restore for other tests
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'GA-TEST-ID';
      process.env.NEXT_PUBLIC_FB_PIXEL_ID = 'FB-TEST-ID';
    });
  });
});