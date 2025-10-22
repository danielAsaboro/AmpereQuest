module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  globalTeardown: './tests/teardown.ts',
  maxWorkers: 1,
}
