require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

// Полифил для TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// React 18+/19 act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// requestAnimationFrame polyfill for jsdom
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
}
if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

// scrollTo polyfill for jsdom
if (!global.HTMLElement.prototype.scrollTo) {
  global.HTMLElement.prototype.scrollTo = function scrollTo() {};
}

// Мокаем Firebase Admin SDK
jest.mock('@/lib/firebaseAdmin', () => ({
  getAdminDb: () => null,
  getAdminStorage: () => null,
}));
