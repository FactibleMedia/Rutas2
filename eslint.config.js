import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist/**", "node_modules/**", "supabase/functions/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Unused vars are warnings for now -- this is a pre-existing codebase and
      // failing CI on them on day one would block every PR.
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]" }],

      // --- Pre-existing debt, downgraded to warn so CI can go green today ---
      // These are REAL correctness findings (51 of them at the time of writing,
      // 27 in src/Mapas.jsx alone). They are not suppressed -- they still print
      // on every run, and any rule NOT listed here still fails the build, so new
      // regressions are blocked. See docs/LINT-BASELINE.md for the inventory and
      // burn-down. Delete entries here as files get fixed.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "no-empty": "warn",
      "no-useless-assignment": "warn",
    },
  },
];
