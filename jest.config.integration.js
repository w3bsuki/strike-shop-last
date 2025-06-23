/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: '🔗 Integration Tests',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js',
    '<rootDir>/tests/setup/integration.setup.js',
  ],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/my-medusa-store/',
    '<rootDir>/tests/unit/',
    '<rootDir>/tests/component/',
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
    'app/api/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'infrastructure/**/*.{ts,tsx}',
    'domains/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))',
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: '<rootDir>/coverage/integration',
  testTimeout: 10000,
  setupFiles: ['<rootDir>/tests/setup/integration-polyfills.js'],
};

module.exports = createJestConfig(customJestConfig);