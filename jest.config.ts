import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/src"],

  testMatch: ["**/__tests__/**/*.test.ts", "**/*.spec.ts"],

  moduleFileExtensions: ["ts", "js"],

  clearMocks: true,

  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],

  globalSetup: "<rootDir>/src/__tests__/globalSetup.ts",
  globalTeardown: "<rootDir>/src/__tests__/globalTeardown.ts",
};

export default config;
