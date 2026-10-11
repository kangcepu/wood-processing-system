const base = require("./base");
const nextPlugin = require("@next/eslint-plugin-next");

module.exports = [
  ...base,
  {
    ignores: ["next-env.d.ts"],
  },
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    settings: {
      next: {
        rootDir: process.cwd(),
      },
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
    },
  },
];
