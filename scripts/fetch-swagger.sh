#!/bin/bash
# 최신 Swagger JSON을 beta API 서버에서 받아 api/swagger.json 에 저장

set -e

API_URL="https://beta-hotpick-api.votebox.kr/v3/api-docs"
OUTPUT="swagger.json"

echo "Fetching swagger.json from $API_URL ..."
curl -sf "$API_URL" | jq '
  # http 타입 securityScheme에서 유효하지 않은 "name" 필드 제거 (OpenAPI 스펙 준수)
  if .components.securitySchemes then
    .components.securitySchemes |= with_entries(
      if .value.type == "http" then .value |= del(.name) else . end
    )
  else . end
' > "$OUTPUT"
echo "Updated $OUTPUT"
