const baseConfig = require('./jest.config')();

module.exports = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: [
    '<rootDir>/**/*.integration.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/integration/**/*.test.{js,jsx,ts,tsx}',
  ],
  testTimeout: 30000, // 30 seconds for integration tests
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};