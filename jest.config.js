module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts', // エントリーポイントは統合テストでカバー
    '!src/routes/**/*.ts' // ルートは統合テストでカバー
  ],
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 70,
      lines: 60,
      statements: 60
    },
    // 主要なビジネスロジックは80%以上を維持
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/modules/data-transformer.ts': {
      branches: 60,
      functions: 100,
      lines: 75,
      statements: 75
    },
    './src/modules/data-validator.ts': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};

