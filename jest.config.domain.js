/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: '🏗️ Domain Tests',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/my-medusa-store/',
    '<rootDir>/tests/component/',
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/e2e/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/domains/(.*)$': '<rootDir>/domains/$1',
    '^@/shared/(.*)$': '<rootDir>/shared/$1',
    '^@/infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
  },
  collectCoverageFrom: [
    'domains/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/types/**',
    '!**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'domains/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'shared/domain/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testMatch: [
    '<rootDir>/tests/domain/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/domains/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/shared/**/*.test.{js,jsx,ts,tsx}',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))',
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: '<rootDir>/coverage/domain',
  testTimeout: 5000,
};

module.exports = createJestConfig(customJestConfig);