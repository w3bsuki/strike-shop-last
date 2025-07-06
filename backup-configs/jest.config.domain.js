const baseConfig = require('./jest.config')();

module.exports = {
  ...baseConfig,
  displayName: 'domain',
  testMatch: [
    '<rootDir>/app/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/domain/**/*.test.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};