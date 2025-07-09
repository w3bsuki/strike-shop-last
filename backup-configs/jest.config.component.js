const baseConfig = require('./jest.config')();

module.exports = {
  ...baseConfig,
  displayName: 'component',
  testMatch: [
    '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/components/**/*.test.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};