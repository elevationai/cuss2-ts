#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-run --allow-env

/**
 * Serve the CUSS2 tester over HTTPS with self-signed certificates
 * Works on Windows, macOS, and Linux
 */

import { join } from "@std/path";
import { existsSync } from "@std/fs";

const CERT_DIR = ".certs";
const CERT_FILE = join(CERT_DIR, "localhost.crt");
const KEY_FILE = join(CERT_DIR, "localhost.key");

// Create certs directory if it doesn't exist
try {
  await Deno.mkdir(CERT_DIR, { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    throw error;
  }
}

// Generate self-signed certificate if it doesn't exist
if (!existsSync(CERT_FILE) || !existsSync(KEY_FILE)) {
  console.log("🔐 Generating self-signed certificate for localhost...");

  const opensslCmd = new Deno.Command("openssl", {
    args: [
      "req", "-x509", "-newkey", "rsa:4096",
      "-keyout", KEY_FILE,
      "-out", CERT_FILE,
      "-days", "365",
      "-nodes",
      "-subj", "/CN=localhost",
      "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1"
    ],
    stdout: "inherit",
    stderr: "inherit"
  });

  const { success } = await opensslCmd.output();

  if (!success) {
    console.error("❌ Failed to generate certificate. Make sure OpenSSL is installed.");
    console.error("   Windows: Install Git for Windows (includes OpenSSL) or OpenSSL from https://slproweb.com/products/Win32OpenSSL.html");
    console.error("   macOS: OpenSSL should be pre-installed");
    console.error("   Linux: sudo apt-get install openssl");
    Deno.exit(1);
  }

  console.log("✅ Certificate generated!");
}

console.log("🚀 Starting HTTPS server on https://localhost:8443");
console.log("   Serving from: docs/examples");
console.log("   Press Ctrl+C to stop");
console.log("");

// Start the file server with TLS
const serverCmd = new Deno.Command("deno", {
  args: [
    "run",
    "--allow-net",
    "--allow-read",
    "--allow-env",
    "https://deno.land/std/http/file_server.ts",
    "--cert", CERT_FILE,
    "--key", KEY_FILE,
    "--port", "8443",
    "--host", "localhost",
    "docs/examples"
  ],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit"
});

const serverProcess = serverCmd.spawn();
const status = await serverProcess.status;

Deno.exit(status.code);
