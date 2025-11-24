require('@testing-library/jest-dom');
// Jest DOM matchers
import '@testing-library/jest-dom';

// Polyfill fetch/Request/Response di JSDOM (React 19 + Next 15 butuh ini)
import 'whatwg-fetch';

// Beberapa env agar komponen client Next tidak bingung
process.env.NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// React Testing Library: enable act env
// (menghindari warning act)
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Polyfill MessageChannel for react-dom/server in Node environment
if (typeof globalThis.MessageChannel === 'undefined') {
  const { MessageChannel } = require('worker_threads');
  globalThis.MessageChannel = MessageChannel;
}

if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Mock window.alert & window.confirm biar tes gak nge-halt
if (!globalThis.alert) {
  globalThis.alert = jest.fn();
}
if (!globalThis.confirm) {
  globalThis.confirm = jest.fn(() => true);
}

// Mock IntersectionObserver for components that use it (Footer uses a sentinel)
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {
      // immediate call to simulate intersection (tests can override behavior)
      this.cb([{ isIntersecting: true }]);
    }
    unobserve() {}
    disconnect() {}
  }
  // @ts-ignore
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

// Mock ResizeObserver used by Footer layout measurements
if (typeof globalThis.ResizeObserver === 'undefined') {
  class MockResizeObserver {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {
      // call with a generic entry to let layout code run
      this.cb([{ contentRect: { width: 100, height: 50 } }]);
    }
    unobserve() {}
    disconnect() {}
  }
  // @ts-ignore
  globalThis.ResizeObserver = MockResizeObserver;
}

// (Opsional) Mock next/navigation jika diperlukan oleh komponen lain
// jest.mock('next/navigation', () => ({
//   useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
// }));
