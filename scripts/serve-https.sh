#!/bin/bash

# Script to serve the tester on HTTPS localhost
# Generates self-signed certificates if they don't exist

CERT_DIR=".certs"
CERT_FILE="$CERT_DIR/localhost.crt"
KEY_FILE="$CERT_DIR/localhost.key"

# Create certificate directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate self-signed certificate if it doesn't exist
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Generating self-signed certificate for localhost..."

  openssl req -x509 -newkey rsa:4096 -keyout "$KEY_FILE" -out "$CERT_FILE" \
    -days 365 -nodes -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

  echo "✅ Certificate generated!"
  echo "⚠️  You'll need to accept the self-signed certificate in your browser"
fi

# Start HTTPS server
echo "🚀 Starting HTTPS server on https://localhost:8443"
echo "📂 Serving from: docs/examples"
echo ""
echo "🔗 Open: https://localhost:8443/tester.html"
echo ""

deno run --allow-net --allow-read --allow-env \
  https://deno.land/std/http/file_server.ts \
  --cert "$CERT_FILE" \
  --key "$KEY_FILE" \
  --port 8443 \
  --host localhost \
  docs/examples
