import js from "@eslint/js";
import react from "eslint-plugin-react";

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  console: "readonly",
  fetch: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  FormData: "readonly",
  Blob: "readonly",
  FileReader: "readonly",
  crypto: "readonly",
  alert: "readonly",
  confirm: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
};

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: browserGlobals,
    },
    settings: { react: { version: "detect" } },
    rules: {
      "react/prop-types": "off",
    },
  },
];
