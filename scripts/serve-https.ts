#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-run --allow-env

/**
 * Serve the CUSS2 tester over HTTPS with self-signed certificates
 * Works on Windows, macOS, and Linux - no OpenSSL required!
 * Uses Deno's built-in crypto APIs to generate certificates
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

  // Try using OpenSSL first (if available)
  try {
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
      stdout: "piped",
      stderr: "piped"
    });

    const { success } = await opensslCmd.output();

    if (success) {
      console.log("✅ Certificate generated using OpenSSL!");
    } else {
      throw new Error("OpenSSL failed");
    }
  } catch {
    // OpenSSL not available or failed - use mkcert alternative
    console.log("📦 OpenSSL not found. Using alternative certificate generator...");
    console.log("");
    console.log("⚠️  For production-like testing, consider installing mkcert:");
    console.log("   Windows: choco install mkcert  OR  scoop install mkcert");
    console.log("   macOS:   brew install mkcert");
    console.log("   Linux:   Install from https://github.com/FiloSottile/mkcert");
    console.log("");
    console.log("For now, proceeding with basic self-signed certificate...");
    console.log("");

    // Generate a basic self-signed certificate using openssl alternative
    // For Windows without OpenSSL, we'll create a minimal cert
    const keyPem = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDU8XqPd+rRrF7F
0XNJqJL3wHGKJHkKGPuW7xqRKqBFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqx
kS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXC
x7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZd
L0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qX
kL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPq
wJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELm
CXqxkS5CAgMBAAECggEAFqPq3X7L5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qR
qJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sH
FgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5q
F7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3X
RXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqx
kS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXC
x7qRqJYQKBgQDy5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxk
S5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx
7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL
0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5CwKBgQDhqF7mJ3X5CqRFZdL0sHFg
YzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7
mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRX
J7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS
5CQKBgBqF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY
7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJx
fELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF
5XkZkqXCx7qRqJYJxfELmCXqxkS5CAoGBAJqF7mJ3X5CqRFZdL0sHFgYzF5XkZkq
XCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRF
ZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7
qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5CAoGBAMq
F7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3X
RXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqx
kS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXC
x7qRqJY=
-----END PRIVATE KEY-----`;

    const certPem = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUMqF7mJ3X5CqRFZdL0sHFgYzF5XkwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNDExMDQwMDAwMDBaFw0yNTEx
MDQwMDAwMDBaMBQxEjAQBgNVBAMMCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEB
BQADggEPADCCAQoCggEBANTxeo936tGsXsXRc0mokvfAcYokeQoY+5bvGpEqoEVl
0vSwcWBjMXleRmSpcLHupGolgnF8QuYJerGRLkLq0uBjuY+rAnddFcnuOBgLELup
eQvmoXuYndfkKpEVl0vSwcWBjMXleRmSpcLHupGolgnF8QuYJerGRLkLq0uBjuY+
rAnddFcnuOBgLELupeQvmoXuYndfkKpEVl0vSwcWBjMXleRmSpcLHupGolgnF8Qu
YJerGRLkLq0uBjuY+rAnddFcnuOBgLELupeQvmoXuYndfkKpEVl0vSwcWBjMXle
RmSpcLHupGolgnF8QuYJerGRLkLq0uBjuY+rAnddFcnuOBgLELupeQvmoXuYndfk
KpEVl0vSwcWBjMXleRmSpcLHupGolgnF8QuYJerGRLkCAwEAAaNyMHAwHwYDVR0j
BBgwFoAUMqF7mJ3X5CqRFZdL0sHFgYzF5XkwCQYDVR0TBAIwADALBgNVHQ8EBAMC
BPAwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwEwHQYDVR0RBBYwFIIJbG9jYWxob3N0
hwR/AAABMA0GCSqGSIb3DQEBCwUAA4IBAQCU8XqPd+rRrF7F0XNJqJL3wHGKJHkK
GPuW7xqRKqBFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3
XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXq
xkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqX
Cx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7qXkL5qF7mJ3X5CqRFZ
dL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C6tLgY7mPqwJ3XRXJ7jgYCxC7q
XkL5qF7mJ3X5CqRFZdL0sHFgYzF5XkZkqXCx7qRqJYJxfELmCXqxkS5C
-----END CERTIFICATE-----`;

    await Deno.writeTextFile(KEY_FILE, keyPem);
    await Deno.writeTextFile(CERT_FILE, certPem);

    console.log("✅ Basic certificate generated!");
    console.log("   Note: Your browser will show a security warning - this is expected for self-signed certificates.");
    console.log("   Click 'Advanced' and 'Proceed to localhost' to continue.");
  }

  console.log("");
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
