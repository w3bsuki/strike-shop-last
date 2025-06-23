/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: '⚛️ Component Tests',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js',
    '<rootDir>/tests/setup/component.setup.js',
  ],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/my-medusa-store/',
    '<rootDir>/tests/unit/',
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/e2e/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/domains/(.*)$': '<rootDir>/domains/$1',
    '^@/shared/(.*)$': '<rootDir>/shared/$1',
    '^@/infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!components/**/*.stories.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/types/**',
    '!app/**/layout.tsx',
    '!app/**/loading.tsx',
    '!app/**/error.tsx',
    '!app/**/not-found.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/tests/component/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/app/**/*.test.{js,jsx,ts,tsx}',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))',
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: '<rootDir>/coverage/component',
  setupFiles: ['<rootDir>/tests/setup/component-polyfills.js'],
};

module.exports = createJestConfig(customJestConfig);