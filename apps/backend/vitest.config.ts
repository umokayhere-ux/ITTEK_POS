import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost:27017/ittek_pos_test',
      JWT_ACCESS_SECRET: 'test_access_secret_at_least_32_chars_long_xx',
      JWT_REFRESH_SECRET: 'test_refresh_secret_at_least_32_chars_long_xx',
      BCRYPT_SALT_ROUNDS: '10',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/server.ts'],
    },
  },
});
