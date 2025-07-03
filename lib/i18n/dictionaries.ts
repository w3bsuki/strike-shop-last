// Translation dictionary management for Strike Shop
import type { Locale } from './config';

// Dictionary type definition - covers all translatable content
export type Dictionary = {
  // Navigation
  nav: {
    men: string;
    women: string;
    accessories: string;
    sale: string;
    about: string;
    contact: string;
    search: string;
    cart: string;
    account: string;
    signin: string;
    signup: string;
    signout: string;
  };
  
  // Product catalog
  products: {
    title: string;
    addToCart: string;
    addToWishlist: string;
    quickView: string;
    outOfStock: string;
    sale: string;
    new: string;
    colors: string;
    sizes: string;
    quantity: string;
    description: string;
    details: string;
    shipping: string;
    returns: string;
    sizeGuide: string;
    shareProduct: string;
    relatedProducts: string;
    youMayAlsoLike: string;
    recentlyViewed: string;
    price: string;
    compareAt: string;
    from: string;
    to: string;
    filters: string;
    sort: string;
    sortBy: string;
    priceAsc: string;
    priceDesc: string;
    newest: string;
    bestSelling: string;
    featured: string;
    clearFilters: string;
    noProducts: string;
    loading: string;
    showMore: string;
    showLess: string;
  };
  
  // Cart & Checkout
  cart: {
    title: string;
    empty: string;
    emptyDescription: string;
    continueShopping: string;
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
    checkout: string;
    remove: string;
    updateQuantity: string;
    proceedToCheckout: string;
    estimatedShipping: string;
    freeShipping: string;
    itemsInCart: string;
    viewCart: string;
    addedToCart: string;
    cartError: string;
    quantityError: string;
  };
  
  // User Account
  account: {
    profile: string;
    orders: string;
    addresses: string;
    wishlist: string;
    settings: string;
    orderHistory: string;
    orderNumber: string;
    orderDate: string;
    orderStatus: string;
    orderTotal: string;
    trackOrder: string;
    reorder: string;
    orderDetails: string;
    shippingAddress: string;
    billingAddress: string;
    paymentMethod: string;
    editProfile: string;
    changePassword: string;
    addAddress: string;
    editAddress: string;
    deleteAddress: string;
    setDefault: string;
    personalInfo: string;
    contactInfo: string;
    preferences: string;
  };
  
  // Authentication
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    forgotPassword: string;
    resetPassword: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    welcomeBack: string;
    welcome: string;
    emailRequired: string;
    passwordRequired: string;
    invalidEmail: string;
    passwordTooShort: string;
    passwordsDontMatch: string;
    accountCreated: string;
    signInError: string;
    signUpError: string;
    resetPasswordSent: string;
    continueAsGuest: string;
  };
  
  // General UI
  common: {
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    ok: string;
    cancel: string;
    confirm: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    continue: string;
    save: string;
    edit: string;
    delete: string;
    remove: string;
    add: string;
    update: string;
    submit: string;
    reset: string;
    clear: string;
    select: string;
    selectAll: string;
    deselectAll: string;
    search: string;
    searchPlaceholder: string;
    noResults: string;
    tryAgain: string;
    somethingWentWrong: string;
    pageNotFound: string;
    goHome: string;
    learnMore: string;
    readMore: string;
    showMore: string;
    showLess: string;
    seeAll: string;
    viewAll: string;
    required: string;
    optional: string;
    comingSoon: string;
  };
  
  // Homepage
  home: {
    heroTitle: string;
    heroSubtitle: string;
    featuredProducts: string;
    newArrivals: string;
    bestSellers: string;
    shopNow: string;
    exploreCollection: string;
    discoverMore: string;
    trendingNow: string;
    limitedTime: string;
    exclusiveOffer: string;
    newsletter: string;
    newsletterDescription: string;
    emailPlaceholder: string;
    subscribe: string;
    subscribeSuccess: string;
    subscribeError: string;
  };
  
  // Footer
  footer: {
    company: string;
    aboutUs: string;
    careers: string;
    press: string;
    contact: string;
    customer: string;
    customerService: string;
    faq: string;
    shippingInfo: string;
    returnPolicy: string;
    sizeGuide: string;
    trackOrder: string;
    legal: string;
    privacyPolicy: string;
    termsOfService: string;
    cookies: string;
    accessibility: string;
    connect: string;
    followUs: string;
    newsletter: string;
    paymentMethods: string;
    securePayment: string;
    freeShipping: string;
    easyReturns: string;
    customerSupport: string;
    allRightsReserved: string;
  };
  
  // Currency & Region
  region: {
    language: string;
    currency: string;
    region: string;
    changeLanguage: string;
    changeCurrency: string;
    country: string;
    shippingTo: string;
    availableIn: string;
    notAvailable: string;
    selectRegion: string;
    currentRegion: string;
    pricesIn: string;
    convertedFrom: string;
    exchangeRate: string;
    lastUpdated: string;
  };
  
  // Search
  search: {
    searchProducts: string;
    searchPlaceholder: string;
    recentSearches: string;
    popularSearches: string;
    suggestions: string;
    categories: string;
    brands: string;
    searchResults: string;
    resultsFound: string;
    noResultsFound: string;
    searchError: string;
    clearSearch: string;
    viewAllResults: string;
    searching: string;
  };
  
  // Notifications
  notifications: {
    itemAdded: string;
    itemRemoved: string;
    cartUpdated: string;
    wishlistAdded: string;
    wishlistRemoved: string;
    orderPlaced: string;
    orderShipped: string;
    orderDelivered: string;
    paymentSuccess: string;
    paymentFailed: string;
    accountUpdated: string;
    passwordChanged: string;
    addressAdded: string;
    addressUpdated: string;
    errorOccurred: string;
    networkError: string;
    sessionExpired: string;
    pleaseSignIn: string;
    permissionDenied: string;
  };
  
  // SEO & Meta
  meta: {
    siteTitle: string;
    siteDescription: string;
    homeTitle: string;
    homeDescription: string;
    productsTitle: string;
    productsDescription: string;
    aboutTitle: string;
    aboutDescription: string;
    contactTitle: string;
    contactDescription: string;
    notFoundTitle: string;
    notFoundDescription: string;
  };
};

// Load dictionary for a specific locale
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  try {
    const dict = await import(`./dictionaries/${locale}.json`);
    return dict.default;
  } catch (error) {
    console.warn(`Failed to load dictionary for locale: ${locale}, falling back to English`);
    // Fallback to English if locale not found
    const fallback = await import('./dictionaries/en.json');
    return fallback.default;
  }
}

// Type-safe translation hook
export function createTranslator(dictionary: Dictionary) {
  return function t(
    path: string,
    params?: Record<string, string | number>
  ): string {
    // Navigate through nested object using dot notation
    const keys = path.split('.');
    let value: any = dictionary;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        console.warn(`Translation key not found: ${path}`);
        return path; // Return key if not found
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${path}`);
      return path;
    }
    
    // Handle parameter interpolation
    if (params) {
      return Object.entries(params).reduce(
        (str, [key, val]) => str.replace(new RegExp(`{${key}}`, 'g'), String(val)),
        value
      );
    }
    
    return value;
  };
}

// Utility for pluralization
export function pluralize(
  count: number,
  dictionary: Dictionary,
  key: string
): string {
  // Simple English pluralization - extend for other languages
  const translator = createTranslator(dictionary);
  
  if (count === 1) {
    return translator(`${key}.singular`, { count });
  } else {
    return translator(`${key}.plural`, { count });
  }
}