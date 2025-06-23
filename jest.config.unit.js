/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: '🔧 Unit Tests',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/my-medusa-store/',
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
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    'domains/**/*.{ts,tsx}',
    'infrastructure/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/lib/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/hooks/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/domains/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/shared/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/infrastructure/**/*.test.{js,jsx,ts,tsx}',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))',
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: '<rootDir>/coverage/unit',
};

module.exports = createJestConfig(customJestConfig);