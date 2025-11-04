#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

/**
 * Serve the CUSS2 tester over HTTPS with self-signed certificates
 * No external dependencies required - uses embedded test certificates
 */

import { join } from "@std/path";
import { existsSync } from "@std/fs";

const CERT_DIR = ".certs";
const CERT_FILE = join(CERT_DIR, "localhost.crt");
const KEY_FILE = join(CERT_DIR, "localhost.key");

// Pre-generated valid self-signed certificate for localhost (for testing only!)
// Valid until November 4, 2026
const EMBEDDED_CERT = `-----BEGIN CERTIFICATE-----
MIICyTCCAbGgAwIBAgIJAMZma3AKRTYKMA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNV
BAMMCWxvY2FsaG9zdDAeFw0yNTExMDQyMzIyMTRaFw0yNjExMDQyMzIyMTRaMBQx
EjAQBgNVBAMMCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAOYyZ7USp4x+/k/grS87LLZte+75hKL+6cO2WqMqRSKFQmcP9bx16BG1BYSk
CLKNSpaJ0cBAVoFDx1G+CVDUWtxyBlYlAwiwTkRnPPb2OCJ6DHlVtiQpWhEbFYvE
rGvhvWg0HB5PVE7bVYxP8L6Jc3c2RFY+k/yyhOodilT569G3zisVZPA3Arvu8Hrq
C0DS4oFAIbjJtRjWSwl9NQX0SNZ6pzZQVytAb3LZGreFG74CYXKrtMby5xT0kvCv
fzrBwQyAruwcYpe2yxCwtG/IgW2MTp6gbaiOdyNQ+2x/DHQg9agtB/VnjAAg/yio
wzOOJPwL0JE0klw0qh6sXo7yKFECAwEAAaMeMBwwGgYDVR0RBBMwEYIJbG9jYWxo
b3N0hwR/AAABMA0GCSqGSIb3DQEBCwUAA4IBAQAPFmmi5h9zq+3I1IPDCy0QB1S0
lLsCD7AczplVClkZp67kufAqXCWE0QwxO0LUDXwPGlxmiAY7xMXz2+hUIBPuv4XK
PXVz9ZLmsgBMw4xkibdeAeTPqlGTy6JGiwpjTFSbSCrMYU7c5skyddoZwea1Ihag
ZKQjwqJP1+AjbG1SsYAqew96PZ+FR/OmDZQN7kmExiqb3dM3s5j0qXHPDBG0zCze
Eqye/DRCd16q1X4Td8zjavuIbwTEx1IJIq/db6kcI6MKP9gudwLvcXHCNj3WWt38
vr+/nHnrLpbVjxuXxuBhiTP5+LZjR6dcX3MFxCPRqDdVl36YC3AXMG4fjDWF
-----END CERTIFICATE-----
`;

const EMBEDDED_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDmMme1EqeMfv5P
4K0vOyy2bXvu+YSi/unDtlqjKkUihUJnD/W8degRtQWEpAiyjUqWidHAQFaBQ8dR
vglQ1FrccgZWJQMIsE5EZzz29jgiegx5VbYkKVoRGxWLxKxr4b1oNBweT1RO21WM
T/C+iXN3NkRWPpP8soTqHYpU+evRt84rFWTwNwK77vB66gtA0uKBQCG4ybUY1ksJ
fTUF9EjWeqc2UFcrQG9y2Rq3hRu+AmFyq7TG8ucU9JLwr386wcEMgK7sHGKXtssQ
sLRvyIFtjE6eoG2ojncjUPtsfwx0IPWoLQf1Z4wAIP8oqMMzjiT8C9CRNJJcNKoe
rF6O8ihRAgMBAAECggEBALwn9xzKYqk0JCqmOuigNavnUaXDzeZs9iZCp1M2+ct9
oQkcwn+I4GeYzynb6kAHvS/O9uNts0d1XzYxXuvyp1II4aUIG7K+aTsAJ5S1LK0B
lbCXnolwQ2439SSJXWXQ3kCOV21u6jqKjSJjNSSItRh8At97xvqF8J5sBuXuYhLH
3XOMqn8Msxjc0500fHO4J0brTkvZNpg4utrvGeWvHlLz4nPPuf2bRJN6QKg2zMtz
J7HlEGXHdsc+dEF50LOcpHcm3KBmqQHYgV65REtsDHYR7k1TnTnOGAkdN70/Oh4D
9q/YOoFpJ4ErMSU9jxgXGiiEdR6sLUWs1Ydlu1rvQQECgYEA+lTxLnpQbM4ecFyw
Dy91fZCDrJaCBxKS3LjN/6gtIOnVwznVEJIe95ZJU6MqZ6y9RgUh6U3cEhbv7So/
JBlplq6PgfuwOFSM2XRMlwEnorP/vh6RGzD/tXnafuPDJ9Kz7LpjlVFFPq3ZHSd2
D0x4cFXkJrQyD4y66qKz9UPeYOMCgYEA62jADggkIOnDItxt23SEG9h8IHRdsIp4
3T8M2m2jqF+O63FiSF6caUNVkbI3Rt3i/UbwjQbkOsV8kF2d12VVTDjhLTXV8hjy
3+nMPnEmaggCJP767rHEzrPpyhg5B1uzSEyHyukWLZ28yNiaIyFSBlBek146Ho7Q
yVPtFN/THDsCgYEAgHD41poXjdwsLgbApun45JYzmWgYCzzycaG4wIYvsYWJEoQn
2DrA/NP1h55ecZdl/flALw6t7fIq5IsanpETZibmpxDWl/B53FEZwxjql0a333qb
hVIcwaZl/1kpltM7UilIUyLB3qkgjx7iKnNYEHthdqJaVTQl66HTp/JMtXUCgYAv
izReoR5K12tluwck719PEGXhWB8j7JOEe5to8gO/ma0PuBKVcyY7zDGX/1pSobWa
WZ1znhSyGfiSX5XlTr3vav1vWBQhlRBYUKvDYK7Vc1CbkDO1yYlqBcQN4N6Dse1/
iJVUUcb854KdPcHDnpMmW0z+jmVGjql0P9L+CEZmyQKBgC1wD1EVWnWBBLNFso+o
6+A2D8WhJ3Yl/d+VpUtFtVp66d0BhG8ZBjEbdzAgOznDVPhUMP0Wy3aFGeSYOOL1
IhhR0XtSGKEh1s0e+Jgc6i6rCJdEoo2wUpv1r+txZYehHOljBEaSWn1eD5L9gZaC
TorOmKsCj6D+NQN1sXQ2/Jwy
-----END PRIVATE KEY-----
`;

// Create certs directory if it doesn't exist
try {
  await Deno.mkdir(CERT_DIR, { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    throw error;
  }
}

// Write embedded certificates if they don't exist
if (!existsSync(CERT_FILE) || !existsSync(KEY_FILE)) {
  console.log("🔐 Setting up self-signed certificate for localhost...");
  console.log("");

  await Deno.writeTextFile(CERT_FILE, EMBEDDED_CERT);
  await Deno.writeTextFile(KEY_FILE, EMBEDDED_KEY);

  console.log("✅ Certificate ready!");
  console.log("");
}

console.log("🚀 Starting HTTPS server on https://localhost:8443");
console.log("   Serving from: docs/examples");
console.log("   Press Ctrl+C to stop");
console.log("");
console.log("   📱 Open in browser: https://localhost:8443/tester.html");
console.log("");
console.log("   ⚠️  Your browser will show a security warning.");
console.log("       Click 'Advanced' → 'Proceed to localhost' to continue.");
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
