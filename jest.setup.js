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

// Mock window.alert & window.confirm biar tes gak nge-halt
if (!globalThis.alert) {
  globalThis.alert = jest.fn();
}
if (!globalThis.confirm) {
  globalThis.confirm = jest.fn(() => true);
}

// (Opsional) Mock next/navigation jika diperlukan oleh komponen lain
// jest.mock('next/navigation', () => ({
//   useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
// }));
