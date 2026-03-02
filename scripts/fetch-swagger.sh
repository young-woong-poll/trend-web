#!/bin/bash
# 최신 Swagger JSON을 beta API 서버에서 받아 docs/swagger.json 에 저장

set -e

API_URL="https://beta-hotpick-api.votebox.kr/v3/api-docs"
OUTPUT="docs/swagger.json"

echo "Fetching swagger.json from $API_URL ..."
curl -sf "$API_URL" | jq '.' > "$OUTPUT"
echo "Updated $OUTPUT"
