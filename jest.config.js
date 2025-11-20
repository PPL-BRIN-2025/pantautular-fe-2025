/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },

  transformIgnorePatterns: [
    "node_modules/(?!@amcharts|d3-|internmap)"
  ],

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",

    // Aliases
    "^@/utils/(.*)$": "<rootDir>/utils/$1",
    "^@/(.*)$": "<rootDir>/app/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/config$": "<rootDir>/config.ts",

    // Force single React instance (dedupe)
    "^react$": "<rootDir>/node_modules/react/index.js",
    "^react-dom$": "<rootDir>/node_modules/react-dom/index.js",

    // Alias untuk admin dashboard
    '^@/config$': '<rootDir>/config.ts',

    // Mocks yang sudah kamu punya
    "^@amcharts/amcharts5$": "<rootDir>/__mocks__/amcharts5.js",
    "^@amcharts/amcharts5/map$": "<rootDir>/__mocks__/amcharts5-map.js",
    "^@amcharts/amcharts5/themes/Animated$": "<rootDir>/__mocks__/amcharts5-themes-Animated.js",
    "^@amcharts/amcharts5-geodata/indonesiaLow$": "<rootDir>/__mocks__/amcharts5-geodata-indonesiaLow.js",
  },

  // Important for Next 15 / React 19 so Jest resolves "browser/client"
  testEnvironmentOptions: {
    customExportConditions: ["browser", "development", "default"],
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text", "cobertura"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",   // include all app code
    "!app/**/_components/*", // optional: ignore small presentational components
  ],
  testPathIgnorePatterns: [
  ],
};
