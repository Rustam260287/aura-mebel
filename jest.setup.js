require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

// Полифил для TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Мокаем Firebase Admin SDK
jest.mock('@/lib/firebaseAdmin', () => ({
  getAdminDb: () => null,
  getAdminStorage: () => null,
}));
