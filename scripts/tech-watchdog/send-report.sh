#!/bin/bash
# Send watchdog report via Resend API
# Usage:
#   echo "body content" | ./send-report.sh "Subject line"
#   ./send-report.sh "Subject line" < body.txt

set -euo pipefail

SUBJECT="${1:?Usage: $0 \"Subject\" < body.txt}"

# Résoudre les chemins relatifs au script lui-même
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Charger la clé Resend depuis .env
ENV_FILE="$REPO_ROOT/.env"
if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: $ENV_FILE not found" >&2
    exit 1
fi

RESEND_KEY=$(grep "^RESEND_API_KEY=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [[ -z "$RESEND_KEY" ]]; then
    echo "ERROR: RESEND_API_KEY not found in $ENV_FILE" >&2
    exit 1
fi

# Lire le body depuis stdin
BODY=$(cat)

# Construire le JSON via python3 (gère l'échappement correctement)
JSON_PAYLOAD=$(SUBJECT="$SUBJECT" BODY="$BODY" python3 -c "
import json, os
payload = {
    'from': 'tech-watchdog <marc@enomia.app>',
    'to': ['marc@enomia.app'],
    'subject': os.environ['SUBJECT'],
    'text': os.environ['BODY'],
}
print(json.dumps(payload))
")

# POST vers Resend
HTTP_RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_KEY" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD")

HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n 1)

if [[ "$HTTP_CODE" =~ ^2 ]]; then
    echo "OK: email sent (status $HTTP_CODE)"
    echo "$HTTP_BODY"
    exit 0
else
    echo "ERROR: Resend API returned $HTTP_CODE" >&2
    echo "$HTTP_BODY" >&2
    exit 2
fi
