#!/usr/bin/env bash
set -euo pipefail

# AI MeetX — Production Smoke Test
# Phase 11: Post-deployment validation
# Usage: ./scripts/smoke-test.sh <BASE_URL>

BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0

check() {
  local name="$1"
  local url="$2"
  local expected_status="$3"

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "${url}" || echo "000")

  if [[ "${status}" == "${expected_status}" ]]; then
    echo "  PASS  ${name} (${status})"
    PASSED=$((PASSED + 1))
  else
    echo "  FAIL  ${name} (got ${status}, expected ${expected_status})"
    FAILED=$((FAILED + 1))
  fi
}

echo "AI MeetX — Production Smoke Test"
echo "Target: ${BASE_URL}"
echo "==================================="
echo ""

echo "Health Checks:"
check "Health endpoint" "${BASE_URL}/api/health" "200"
echo ""

echo "Page Routes:"
check "Home page" "${BASE_URL}/" "200"
check "Login page" "${BASE_URL}/login" "200"
check "Register page" "${BASE_URL}/register" "200"
echo ""

echo "Security Headers:"
headers=$(curl -s -D - -o /dev/null "${BASE_URL}/" || echo "")
for header in "x-content-type-options: nosniff" "x-frame-options: DENY" "strict-transport-security"; do
  if echo "${headers}" | grep -qi "^${header}"; then
    echo "  PASS  ${header}"
    PASSED=$((PASSED + 1))
  else
    echo "  FAIL  ${header} not found"
    FAILED=$((FAILED + 1))
  fi
done
echo ""

echo "==================================="
echo "Results: ${PASSED} passed, ${FAILED} failed"

if [[ "${FAILED}" -gt 0 ]]; then
  exit 1
fi