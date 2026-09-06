module.exports = {
  preset: "ts-jest", testEnvironment: "node", testMatch: ["**/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setup.cjs"], testTimeout: 30000,
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs", target: "ES2022", esModuleInterop: true, strict: true, types: ["node", "jest"] } }] }
};
