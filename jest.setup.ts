import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Полифил для TextEncoder/TextDecoder (нужен для firebase-admin/jose в среде JSDOM)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Мокаем Firebase Admin SDK, чтобы он не инициализировался в тестах
jest.mock('@/lib/firebaseAdmin', () => ({
  getAdminDb: () => null,
  getAdminStorage: () => null,
}));
