import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { FlatCompat } from "@typescript-eslint/eslint-plugin";

// Создаём совместимый конфиг для старых extends
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  // Игнорируемые папки
  { ignores: ["dist/", "node_modules/"] },

  // Основной конфиг для TS/TSX
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
      parser: "@typescript-eslint/parser",
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "warn",

      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_$",
        },
      ],
    },
  },
];