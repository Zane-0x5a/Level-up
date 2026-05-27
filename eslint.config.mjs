import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".agents/**",
    ".codex-work/**",
    ".dogma-evidence/**",
    ".factory/**",
    ".playwright-cli/**",
    ".playwright-mcp/**",
    ".qoder/**",
    ".superpowers/**",
    ".tmp/**",
    ".trae/**",
    ".worktrees/**",
    "design-previews/**",
    "output/**",
    "remotion/**",
  ]),
]);

export default eslintConfig;
