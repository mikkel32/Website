import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import importRecommended from "eslint-plugin-import/config/flat/recommended.js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ...importRecommended,
    plugins: {
      import: importPlugin,
    },
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        global: "readonly",
        process: "readonly",
        Buffer: "readonly",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      "no-unused-vars": "error",
      "eqeqeq": "error",
      "no-console": "error",
    },
  },
  {
    files: ["error-capture.js"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.browser,
        ...globals.es2021,
        Buffer: "readonly",
      },
    },
  },
];
