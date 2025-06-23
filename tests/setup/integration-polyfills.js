// Polyfills for integration testing environment

// Enhanced fetch mock for integration tests
const originalFetch = global.fetch;

global.fetch = jest.fn((url, options = {}) => {
  const mockResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get: jest.fn((header) => {
        const headers = {
          'content-type': 'application/json',
          'authorization': 'Bearer mock-token',
        };
        return headers[header.toLowerCase()];
      }),
    },
    json: jest.fn(() => Promise.resolve({})),
    text: jest.fn(() => Promise.resolve('')),
    blob: jest.fn(() => Promise.resolve(new Blob())),
    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    clone: jest.fn(() => mockResponse),
  };

  return Promise.resolve(mockResponse);
});

// Mock WebSocket for real-time features
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    
    setTimeout(() => {
      this.onopen?.({ type: 'open' });
    }, 0);
  }

  send(data) {
    console.log('WebSocket send:', data);
  }

  close() {
    this.readyState = 3; // CLOSED
    this.onclose?.({ type: 'close' });
  }
};

// Mock EventSource for server-sent events
global.EventSource = class MockEventSource {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    
    setTimeout(() => {
      this.onopen?.({ type: 'open' });
    }, 0);
  }

  close() {
    this.readyState = 2; // CLOSED
  }
};

// Mock payment APIs
global.PaymentRequest = class MockPaymentRequest {
  constructor(methodData, details, options) {
    this.methodData = methodData;
    this.details = details;
    this.options = options;
  }

  async show() {
    return {
      details: { test: 'payment' },
      methodName: 'test-payment',
      complete: jest.fn(() => Promise.resolve()),
    };
  }

  async canMakePayment() {
    return true;
  }
};

// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });
    }),
    watchPosition: jest.fn(() => 1),
    clearWatch: jest.fn(),
  },
  writable: true,
});

// Mock push notifications
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      scope: 'mock-scope',
      update: jest.fn(),
      unregister: jest.fn(),
      pushManager: {
        subscribe: jest.fn(() => Promise.resolve({
          endpoint: 'mock-endpoint',
          getKey: jest.fn(),
        })),
      },
    })),
    ready: Promise.resolve({
      scope: 'mock-scope',
      pushManager: {
        subscribe: jest.fn(),
      },
    }),
  },
  writable: true,
});

// Mock network information
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

// Mock battery API
Object.defineProperty(navigator, 'getBattery', {
  value: jest.fn(() => Promise.resolve({
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
    level: 1,
    onchargingchange: null,
    onchargingtimechange: null,
    ondischargingtimechange: null,
    onlevelchange: null,
  })),
  writable: true,
});

// Mock IndexedDB for client-side storage testing
const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  result: null,
  error: null,
  readyState: 'done',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.indexedDB = {
  open: jest.fn(() => ({
    ...mockIDBRequest,
    onupgradeneeded: null,
    onblocked: null,
  })),
  deleteDatabase: jest.fn(() => mockIDBRequest),
  cmp: jest.fn(),
};

// Mock file system access API
if (typeof window !== 'undefined') {
  window.showOpenFilePicker = jest.fn(() => Promise.resolve([
    {
      getFile: jest.fn(() => Promise.resolve(new File(['test'], 'test.txt'))),
      name: 'test.txt',
      kind: 'file',
    },
  ]));

  window.showSaveFilePicker = jest.fn(() => Promise.resolve({
    createWritable: jest.fn(() => Promise.resolve({
      write: jest.fn(),
      close: jest.fn(),
    })),
    name: 'test.txt',
    kind: 'file',
  }));
}

// Mock broadcast channel for cross-tab communication
global.BroadcastChannel = class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
    this.onmessageerror = null;
  }

  postMessage(data) {
    console.log('BroadcastChannel message:', data);
  }

  close() {
    console.log('BroadcastChannel closed');
  }
};

// Mock shared worker
global.SharedWorker = class MockSharedWorker {
  constructor(scriptURL, options) {
    this.port = {
      postMessage: jest.fn(),
      onmessage: null,
      start: jest.fn(),
      close: jest.fn(),
    };
    this.onerror = null;
  }
};