// Polyfills for component testing environment

// Mock canvas for chart components
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Mock HTMLElement methods
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  HTMLElement.prototype.scroll = jest.fn();
  HTMLElement.prototype.scrollTo = jest.fn();
}

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

// Mock getComputedStyle
window.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(() => ''),
  display: 'block',
  visibility: 'visible',
  opacity: '1',
  transform: 'none',
  transition: 'none',
}));

// Mock crypto for secure random IDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-123'),
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File and FileReader
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
    this.type = properties?.type || '';
    this.lastModified = Date.now();
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:image/jpeg;base64,mock-base64-data';
      this.onload?.({ target: this });
    }, 0);
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'mock file content';
      this.onload?.({ target: this });
    }, 0);
  }
};

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('mock clipboard text')),
  },
  writable: true,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    now: jest.fn(() => Date.now()),
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((cb) => {
  setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);
  return 1;
});

global.cancelIdleCallback = jest.fn();