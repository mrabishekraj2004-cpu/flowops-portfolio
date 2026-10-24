import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
export default defineConfig([
  ...next,
  ...ts,
  globalIgnores([
    ".next/**",
    ".runtime-build/**",
    ".flowops-runtime/**",
    ".local/**",
    "src/generated/**",
    "src/app/.well-known/workflow/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
