#!/bin/bash

# --- Configuration ---
# Static values
MONGODB_URI="mongodb://admin:password@127.0.0.1:27020/atproto-oauth?authSource=admin"
PORT="8080"
NATIVE_DEEPLINK="bookkin://callback"
WEB_DEEPLINK="http://localhost:8081"
TEMP_KEY_FILE="temp_private_key.pem"
NATIVE_ENV_FILE=".env.native"
WEB_ENV_FILE=".env.web"

echo "✨ Generating secrets and .env files for Book Kin backend..."

# --- Generate JWT Secret ---
echo "🔑 Generating JWT Secret..."
# Generate 32 random bytes, base64 encode them for a strong secret
JWT_SECRET=$(openssl rand -base64 32)
if [ $? -ne 0 ]; then
    echo "❌ Error generating JWT secret. Aborting."
    exit 1
fi
echo "✅ JWT Secret generated."

# --- Generate Private Key (PKCS#8 PEM) ---
echo "🔑 Generating EC P-256 Private Key (PKCS#8)..."
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:prime256v1 -out "$TEMP_KEY_FILE"
if [ $? -ne 0 ]; then
    echo "❌ Error generating private key. Aborting."
    rm -f "$TEMP_KEY_FILE" # Clean up partial file if exists
    exit 1
fi

# Verify key format (Optional but good check)
if ! head -n 1 "$TEMP_KEY_FILE" | grep -q "BEGIN PRIVATE KEY"; then
    echo "❌ Generated key is not in expected PKCS#8 format. Check OpenSSL version/command."
    rm -f "$TEMP_KEY_FILE"
    exit 1
fi
echo "✅ Private key generated ($TEMP_KEY_FILE)."

# --- Format Private Key for .env ---
echo "💅 Formatting private key for .env files..."
# Read the key, replace literal newlines with '\n' sequence for .env string
# Using awk for reliable newline replacement within a variable assignment
FORMATTED_KEY=$(awk '{printf "%s\\n", $0}' "$TEMP_KEY_FILE")
if [ -z "$FORMATTED_KEY" ]; then
    echo "❌ Error formatting private key. Aborting."
    rm -f "$TEMP_KEY_FILE"
    exit 1
fi
echo "✅ Private key formatted."

# --- Create .env.native ---
echo "📝 Creating $NATIVE_ENV_FILE..."
cat << EOF > "$NATIVE_ENV_FILE"
# Environment variables for NATIVE testing (Emulator/Device)

MONGODB_URI="$MONGODB_URI"
PORT="$PORT"

# --- NGROK URLs (Set AFTER running ngrok!) ---
# Run 'ngrok http $PORT' and paste the https URL below
CLIENT_URI="<YOUR_NGROK_HTTPS_URL>" # e.g., https://abcdef.ngrok-free.app
# -------------------------------------------------

APP_BASE_DEEPLINK="$NATIVE_DEEPLINK" # For redirecting back to native app

# Generated Secrets (Keep Secure!)
JWT_SECRET="$JWT_SECRET"
PRIVATE_KEY_1="$FORMATTED_KEY"
EOF
echo "✅ $NATIVE_ENV_FILE created."


# --- Create .env.web ---
echo "📝 Creating $WEB_ENV_FILE..."
cat << EOF > "$WEB_ENV_FILE"
# Environment variables for WEB testing (localhost browser)

MONGODB_URI="$MONGODB_URI"
PORT="$PORT"

# --- NGROK URLs (Set AFTER running ngrok!) ---
# Run 'ngrok http $PORT' and paste the https URL below
CLIENT_URI="<YOUR_NGROK_HTTPS_URL>" # e.g., https://abcdef.ngrok-free.app
# -------------------------------------------------

APP_BASE_DEEPLINK="$WEB_DEEPLINK" # For redirecting back to local web app

# Generated Secrets (Keep Secure!)
JWT_SECRET="$JWT_SECRET"
PRIVATE_KEY_1="$FORMATTED_KEY"
EOF
echo "✅ $WEB_ENV_FILE created."

# --- Clean up temporary key file ---
echo "🧹 Cleaning up temporary files..."
rm -f "$TEMP_KEY_FILE"
echo "✅ Cleanup complete."

echo "🎉 Finished! Remember to:"
echo "   1. Run 'ngrok http $PORT' when you start developing."
echo "   2. Copy the ngrok https URL."
echo "   3. Paste the ngrok URL into the CLIENT_URI field in $NATIVE_ENV_FILE or $WEB_ENV_FILE (depending on which you are using)."
echo "   4. Start your backend using the correct script (e.g., 'npm run dev:native' or 'npm run dev:web')."
echo "   5. Keep your .env files SECURE and out of Git!"