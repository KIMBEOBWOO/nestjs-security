module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/node_modules/**',
    '!dist/**',
    '!coverage/**',
    '!test/fixtures/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'html'],
  testEnvironment: 'node',
};
