
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',
  // ИСПРАВЛЕНИЕ: ссылка на .js файл
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/types$': '<rootDir>/types.ts',
    '^jose': require.resolve('jose'),
  },
  
  transformIgnorePatterns: [
    '/node_modules/(?!(firebase-admin|jose|@panva/hkdf|uuid|@google-cloud/firestore|google-auth-library|@firebase/util)/)',
  ],
};

export default createJestConfig(config);
