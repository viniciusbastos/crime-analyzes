module.exports = {
  env: {
    browser: true,
    es2021: true,
    "react-native/react-native": true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
    requireConfigFile: false,
    babelOptions: {
      plugins: ["@babel/plugin-syntax-jsx"]
    }
  },
  plugins: ["react", "react-native"],
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-native/no-unused-styles": "warn",
    "react-native/split-platform-components": "warn",
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
    "react-native/no-raw-text": "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
