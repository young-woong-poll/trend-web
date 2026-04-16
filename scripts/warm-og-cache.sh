#!/bin/bash
# OG 이미지 캐시 프리워밍 스크립트
# 사용법: ./scripts/warm-og-cache.sh [BASE_URL]
# 예시:   ./scripts/warm-og-cache.sh https://hotpick.votebox.kr
#         ./scripts/warm-og-cache.sh http://localhost:3000

BASE_URL="${1:-https://hotpick.votebox.kr}"
echo "=== OG Cache Warming: $BASE_URL ==="

CATEGORIES=("LOVE" "MARRIAGE" "FINANCE" "WORK" "SPORTS" "FOOD" "GAME" "CAR" "HEALTH" "TREND")
GRADES=("SS" "S" "A" "B" "C" "D" "X")
PARTICIPANT_BUCKETS=("0" "10" "50" "100" "500" "1000" "5000")

echo ""
echo "--- Bundle OG (카테고리 x 참여수 조합) ---"
for cat in "${CATEGORIES[@]}"; do
  for p in "${PARTICIPANT_BUCKETS[@]}"; do
    url="$BASE_URL/api/og/bundle?category=$cat&participants=$p&questions=5"
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    echo "  [$status] $cat / ${p}명"
  done
done

echo ""
echo "--- Compare 1:1 OG ---"
for cat in "${CATEGORIES[@]}"; do
  url="$BASE_URL/api/og/compare?category=$cat&type=ONE_TO_ONE"
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "  [$status] $cat / ONE_TO_ONE"
done

echo ""
echo "--- Compare GROUP OG ---"
for cat in "${CATEGORIES[@]}"; do
  url="$BASE_URL/api/og/compare?category=$cat&type=GROUP"
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "  [$status] $cat / GROUP"
done

echo ""
echo "--- Compare MATCH OG (카테고리 x 등급) ---"
for cat in "${CATEGORIES[@]}"; do
  for grade in "${GRADES[@]}"; do
    url="$BASE_URL/api/og/compare?category=$cat&type=MATCH&grade=$grade"
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    echo "  [$status] $cat / $grade"
  done
done

echo ""
echo "=== Done ==="
