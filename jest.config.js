module.exports = {
  preset: "ts-jest", // Untuk TypeScript
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }], // Tambahin regex biar JSX/TSX bisa diproses
  },
  "transformIgnorePatterns": [
    "node_modules/(?!@amcharts|d3-|internmap)"
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    '^@/config$': '<rootDir>/config.ts',
    "^@/(.*)$": "<rootDir>/app/$1",
    "^@amcharts/amcharts5$": "<rootDir>/__mocks__/amcharts5.js",
    "^@amcharts/amcharts5/map$": "<rootDir>/__mocks__/amcharts5-map.js",
    "^@amcharts/amcharts5/themes/Animated$": "<rootDir>/__mocks__/amcharts5-themes-Animated.js",
    "^@amcharts/amcharts5-geodata/indonesiaLow$": "<rootDir>/__mocks__/amcharts5-geodata-indonesiaLow.js"
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
