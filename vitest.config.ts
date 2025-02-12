import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";
import fixReactVirtualized from "esbuild-plugin-react-virtualized";

export default defineConfig({
  plugins: [react() as any, fixReactVirtualized],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    testTimeout: 2000,
    hookTimeout: 2000,
    pool: "threads",
    maxConcurrency: 1,
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "coverage/**",
        "dist/**",
        "**/[.]**",
        "packages/*/test?(s)/**",
        "**/*.d.ts",
        "**/virtual:*",
        "**/__x00__*",
        "**/\x00*",
        "cypress/**",
        "test?(s)/**",
        "test?(-*).?(c|m)[jt]s?(x)",
        "**/*{.,-}{test,spec}.?(c|m)[jt]s?(x)",
        "**/__tests__/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
        "**/tailwind.config.*",
      ],
    },
    alias: {
      'webtorrent': fileURLToPath(
        new URL(
          "./node_modules/webtorrent/dist/webtorrent.min.js",
          import.meta.url
        )
      ),
    },
    deps: {
      optimizer: {
        web: {
          exclude: ["@electric-sql/pglite", "daisyui", "tailwindcss"],
        },
      },
      interopDefault: true,
    },
    server: {
      deps: {
        inline: ["fflate"]
      }
    },
    testTransformMode: {
      web: ["**/*.{js,jsx,ts,tsx}"],
      ssr: ["**/*.{mjs,cjs,js,jsx,ts,tsx}"]
    },
    logHeapUsage: true,
    reporters: ["verbose"],
    sequence: {
      shuffle: false,
      concurrent: false
    },
    isolate: true,
    bail: 1,
    passWithNoTests: false,
    allowOnly: true,
    silent: false,
    onConsoleLog: (log) => {
      if (log.includes("[ERROR]")) return true;
      if (log.includes("[WARN]")) return true;
      if (log.includes("heap")) return true;
      return false;
    },
  },
});
