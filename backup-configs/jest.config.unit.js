const baseConfig = require('./jest.config')();

module.exports = {
  ...baseConfig,
  displayName: 'unit',
  testMatch: [
    '<rootDir>/**/*.unit.test.{js,jsx,ts,tsx}',
    '<rootDir>/lib/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/utils/**/*.test.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};