/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  clearMocks: true,
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.ts'
  }
};
