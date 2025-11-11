/**
 * Development server that mimics GitHub Pages URL structure
 *
 * GitHub Pages serves from /docs/ folder but URLs don't include /docs/ prefix.
 * This server replicates that behavior for local development.
 *
 * Example mappings:
 * - http://localhost:8000/ → serves /docs/index.html
 * - http://localhost:8000/examples/tester.html → serves /docs/examples/tester.html
 * - http://localhost:8000/dist/cuss2.esm.js → serves /docs/dist/cuss2.esm.js
 */

const port = 8000;

// Content type mapping
const contentTypes: Record<string, string> = {
  "html": "text/html; charset=utf-8",
  "js": "application/javascript; charset=utf-8",
  "mjs": "application/javascript; charset=utf-8",
  "css": "text/css; charset=utf-8",
  "json": "application/json; charset=utf-8",
  "png": "image/png",
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "gif": "image/gif",
  "svg": "image/svg+xml",
  "ico": "image/x-icon",
  "woff": "font/woff",
  "woff2": "font/woff2",
  "ttf": "font/ttf",
  "eot": "application/vnd.ms-fontobject",
  "otf": "font/otf",
};

function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase();
  return contentTypes[ext || ""] || "application/octet-stream";
}

function mapUrlToFile(pathname: string): string {
  // Remove leading slash
  pathname = pathname.replace(/^\/+/, "");

  // Default to index.html
  if (pathname === "" || pathname === "/") {
    return "docs/index.html";
  }

  // Map public URLs to /docs/ folder structure
  // URLs like /examples/tester.html should map to /docs/examples/tester.html
  if (
    pathname.startsWith("examples/") ||
    pathname.startsWith("dist/") ||
    pathname.startsWith("api/") ||
    pathname.startsWith("assets/")
  ) {
    return "docs/" + pathname;
  }

  // Everything else also maps to docs/
  if (!pathname.startsWith("docs/")) {
    return "docs/" + pathname;
  }

  return pathname;
}

async function serveFile(pathname: string): Promise<Response> {
  try {
    const filePath = mapUrlToFile(pathname);
    console.log(`📄 ${pathname} → ${filePath}`);

    const file = await Deno.readFile(filePath);
    const contentType = getContentType(filePath);

    return new Response(file, {
      status: 200,
      headers: {
        "content-type": contentType,
        "access-control-allow-origin": "*", // Allow CORS for local dev
        "cache-control": "no-cache", // Disable caching for dev
      },
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(`❌ 404: ${pathname}`);
      return new Response("404 Not Found", {
        status: 404,
        headers: { "content-type": "text/plain" },
      });
    }

    console.error(`❌ Error serving ${pathname}:`, error);
    return new Response("500 Internal Server Error", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }
}

Deno.serve({ port }, async (req) => {
  const url = new URL(req.url);
  return await serveFile(url.pathname);
});

console.log(`
🚀 CUSS2-TS Development Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server:     http://localhost:${port}/
Landing:    http://localhost:${port}/
Examples:   http://localhost:${port}/examples/
Tester:     http://localhost:${port}/examples/tester.html
API Docs:   http://localhost:${port}/api/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This server mimics GitHub Pages URL structure.
Press Ctrl+C to stop.
`);
