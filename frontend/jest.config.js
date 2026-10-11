module.exports = {
  testEnvironment: "jsdom",
  rootDir: "src",
  testRegex: ".*\\.spec\\.(ts|tsx)$",
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
