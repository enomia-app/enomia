#!/bin/bash
# Envoie un email via Resend. Usage : echo "body" | ./send-report.sh "Sujet"
set -euo pipefail
SUBJECT="${1:?Usage: $0 \"Subject\" < body.txt}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then echo "ERROR: $ENV_FILE not found" >&2; exit 1; fi
RESEND_KEY=$(grep "^RESEND_API_KEY=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [[ -z "$RESEND_KEY" ]]; then echo "ERROR: RESEND_API_KEY not found in $ENV_FILE" >&2; exit 1; fi

BODY=$(cat)
JSON_PAYLOAD=$(SUBJECT="$SUBJECT" BODY="$BODY" python3 -c "
import json, os
print(json.dumps({
    'from': 'conciergerie-refresh <marc@enomia.app>',
    'to': ['marc@enomia.app'],
    'subject': os.environ['SUBJECT'],
    'text': os.environ['BODY'],
}))
")

HTTP_RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_KEY" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD")
HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n 1)
if [[ "$HTTP_CODE" =~ ^2 ]]; then echo "OK: email sent ($HTTP_CODE)"; exit 0; fi
echo "ERROR: Resend returned $HTTP_CODE" >&2
echo "$HTTP_RESPONSE" | sed '$d' >&2
exit 2
