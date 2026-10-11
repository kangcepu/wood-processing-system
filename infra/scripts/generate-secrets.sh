#!/usr/bin/env bash
set -euo pipefail

echo "ACCESS_TOKEN_SECRET=$(openssl rand -base64 48 | tr -d '\n')"
echo "COOKIE_SECRET=$(openssl rand -base64 48 | tr -d '\n')"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')"
