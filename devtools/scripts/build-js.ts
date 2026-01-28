// Build script to create a browser-compatible JavaScript bundle
import { ensureDir } from "@std/fs";
import * as path from "@std/path";
import * as esbuild from "esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";
import { parse } from "@std/jsonc";

const outDir = "./docs/dist";

interface DenoConfig {
  version?: string;
  imports?: Record<string, string>;
  [key: string]: unknown;
}

const denoConfig = parse(await Deno.readTextFile("./deno.jsonc")) as DenoConfig;

const importMap = {
  imports: {
    ...denoConfig.imports,
    "events": "npm:events", // the plugin doesn't understand the node: prefix
  },
};

console.log("Building CUSS2 DevTools Client browser bundle...");

// Create output directory if it doesn't exist
await ensureDir(outDir);

try {
  const commonBuildOptions: esbuild.BuildOptions = {
    plugins: [
      {
        name: "browser-ws",
        setup(build) {
          // Handle WebSocket imports for browser
          build.onResolve({ filter: /^ws$/ }, () => {
            return {
              path: "virtual:ws-browser",
              namespace: "ws-browser",
            };
          });

          // Return browser WebSocket for the virtual module
          build.onLoad({ filter: /.*/, namespace: "ws-browser" }, () => {
            return {
              contents: `
                // Browser WebSocket polyfill
                export default typeof WebSocket !== 'undefined' ? WebSocket : null;
                export const WebSocket = typeof WebSocket !== 'undefined' ? WebSocket : null;
              `,
              loader: "js",
            };
          });
        },
      },
      ...denoPlugins({
        importMapURL: `data:application/json,${JSON.stringify(importMap)}`,
      }),
    ],
    entryPoints: ["./devtools/mod.ts"],
    bundle: true,
    globalName: "CUSS2DevTools",
    platform: "browser",
    format: "iife",
    treeShaking: true,
    define: {
      "global": "window",
      "global.WebSocket": "window.WebSocket",
      "globalThis.WebSocket": "window.WebSocket",
    },
  };

  // Build IIFE version for script tags
  const result = await esbuild.build({
    ...commonBuildOptions,
    outfile: path.join(outDir, "cuss2-devtools.js"),
  });

  console.log(
    `IIFE bundle created successfully with ${result.errors.length} errors and ${result.warnings.length} warnings`,
  );

  // Minified IIFE version
  await esbuild.build({
    ...commonBuildOptions,
    outfile: path.join(outDir, "cuss2-devtools.min.js"),
    minify: true,
    sourcemap: true,
  });

  console.log("Minified IIFE bundle created successfully");

  // Build ESM version for module imports
  await esbuild.build({
    ...commonBuildOptions,
    format: "esm",
    globalName: undefined,
    outfile: path.join(outDir, "cuss2-devtools.esm.js"),
  });

  console.log("ESM bundle created successfully");

  // Minified ESM version
  await esbuild.build({
    ...commonBuildOptions,
    format: "esm",
    globalName: undefined,
    outfile: path.join(outDir, "cuss2-devtools.esm.min.js"),
    minify: true,
    sourcemap: true,
  });

  console.log("Minified ESM bundle created successfully");

  console.log(`Build complete!
Browser bundles created at:
  - ${outDir}/cuss2-devtools.js (IIFE for script tags)
  - ${outDir}/cuss2-devtools.min.js (Minified IIFE)
  - ${outDir}/cuss2-devtools.esm.js (ESM for imports)
  - ${outDir}/cuss2-devtools.esm.min.js (Minified ESM)`);
}
catch (error) {
  console.error("Build failed:", error);
  Deno.exit(1);
}
finally {
  esbuild.stop(); // Stop the esbuild service
}
