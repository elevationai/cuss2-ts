# HTTPS Server Setup

This directory contains scripts to serve the CUSS2 tester over HTTPS with self-signed certificates.

## Quick Start

### Option 1: Install Git for Windows (Recommended for Windows)

Git for Windows includes OpenSSL, which is needed to generate proper certificates.

1. Download and install: https://git-scm.com/download/win
2. Restart your terminal
3. Run: `deno task serve-https`

### Option 2: Use HTTP Instead

If you don't need HTTPS, simply use:

```bash
deno task serve
```

This will start an HTTP server on the default port.

## How It Works

### Windows
- Uses PowerShell's `New-SelfSignedCertificate` to generate a certificate
- Requires OpenSSL (from Git for Windows) to convert the certificate to PEM format
- Fallback: Shows instructions if OpenSSL is not available

### macOS/Linux
- Uses OpenSSL directly (usually pre-installed)
- Generates RSA 2048-bit self-signed certificate
- Valid for 1 year

## Files

- `serve-https.ts` - Main TypeScript script that starts HTTPS server
- `generate-cert.ps1` - PowerShell script for Windows certificate generation
- `serve-https.sh` - Legacy bash script (kept for reference)

## Browser Security Warning

When you visit `https://localhost:8443` in your browser, you'll see a security warning. This is expected for self-signed certificates.

**To proceed:**
1. Click "Advanced"
2. Click "Proceed to localhost" (or similar option)
3. The tester will load normally

## Troubleshooting

### "bash: command not found" on Windows
- Solution: Use Git for Windows or the newer PowerShell-based approach (already implemented)

### "Unable to decode certificate"
- The embedded certificate format isn't compatible with Deno's TLS implementation
- Solution: Install OpenSSL via Git for Windows

### Certificate already exists but server won't start
- Delete the `.certs` directory: `rm -rf .certs`
- Run `deno task serve-https` again to regenerate

## Certificate Location

Certificates are stored in `.certs/` directory (gitignored):
- `localhost.crt` - Certificate file
- `localhost.key` - Private key file
