# PowerShell script to generate self-signed certificate on Windows
# This uses Windows' built-in certificate tools

$certDir = ".certs"
$certFile = "$certDir\localhost.crt"
$keyFile = "$certDir\localhost.key"
$pfxFile = "$certDir\localhost.pfx"

# Create directory if it doesn't exist
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir | Out-Null
}

# Check if certificate already exists
if ((Test-Path $certFile) -and (Test-Path $keyFile)) {
    Write-Host "✅ Certificate already exists"
    exit 0
}

Write-Host "🔐 Generating self-signed certificate for localhost..."
Write-Host ""

# Generate self-signed certificate using Windows PowerShell
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost" `
    -DnsName "localhost", "127.0.0.1" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotBefore (Get-Date) `
    -NotAfter (Get-Date).AddYears(1) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName "Localhost Development Certificate" `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature, KeyEncipherment, DataEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# Export to PFX with password
$pwd = ConvertTo-SecureString -String "localhost" -Force -AsPlainText
Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" -FilePath $pfxFile -Password $pwd | Out-Null

# Export to PEM format (certificate)
$certPem = @(
    '-----BEGIN CERTIFICATE-----'
    [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
    '-----END CERTIFICATE-----'
)
$certPem | Out-File $certFile -Encoding ASCII

# Export private key using OpenSSL (if available) or provide instructions
try {
    # Try to use OpenSSL if available (comes with Git for Windows)
    $opensslPath = (Get-Command openssl -ErrorAction SilentlyContinue).Source
    if ($opensslPath) {
        & openssl pkcs12 -in $pfxFile -nocerts -nodes -out $keyFile -passin pass:localhost 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Certificate generated successfully using OpenSSL!"
            Write-Host ""
            # Clean up certificate from store
            Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)"
            exit 0
        }
    }
} catch {
    # OpenSSL not available, continue to fallback
}

Write-Host "⚠️  OpenSSL not found. Installing Git for Windows will provide OpenSSL."
Write-Host ""
Write-Host "For now, you can:"
Write-Host "1. Install Git for Windows: https://git-scm.com/download/win"
Write-Host "2. Or use HTTP instead: deno task serve"
Write-Host ""

# Clean up
Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)"
Remove-Item $pfxFile -ErrorAction SilentlyContinue

exit 1
