#!/bin/bash
# Regression test suite — MECS Cable Billing API
# Requires: curl, jq, app running on localhost:8080
# Usage:    ./scripts/regression_test.sh

BASE_URL="http://localhost:8080"
COOKIE_JAR="/tmp/mecs_regression_cookies.txt"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0

rm -f "$COOKIE_JAR"
touch "$COOKIE_JAR"

# ── helpers ──────────────────────────────────────────────────

pass() { echo -e "  ${GREEN}PASS${NC}  $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}FAIL${NC}  $1"; FAIL=$((FAIL+1)); }

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    pass "$label"
  else
    fail "$label  [expected='$expected'  actual='$actual']"
  fi
}

check_not_null() {
  local label="$1" val="$2"
  if [ -n "$val" ] && [ "$val" != "null" ]; then
    pass "$label"
  else
    fail "$label  [expected non-null, got: '$val']"
  fi
}

section() { echo -e "\n${YELLOW}${BOLD}▶ $1${NC}"; }

# curl wrappers
GET()              { curl -s -b "$COOKIE_JAR" "$BASE_URL$1"; }
POST()             { curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST  "$BASE_URL$1" -H "Content-Type: application/json" -d "$2"; }
PUT()              { curl -s -b "$COOKIE_JAR" -X PUT   "$BASE_URL$1" -H "Content-Type: application/json" -d "$2"; }
PUT_NOBODY()       { curl -s -b "$COOKIE_JAR" -X PUT   "$BASE_URL$1"; }
DELETE_REQ()       { curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL$1"; }
STATUS_GET()       { curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}"            "$BASE_URL$1"; }
STATUS_POST()      { curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" -X POST    "$BASE_URL$1" -H "Content-Type: application/json" -d "$2"; }
STATUS_PUT()       { curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" -X PUT     "$BASE_URL$1" -H "Content-Type: application/json" -d "$2"; }
STATUS_PUT_NOBODY(){ curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" -X PUT     "$BASE_URL$1"; }

this_month_start() { date +%Y-%m-01; }
next_month_start() { date -v1d -v+1m +%Y-%m-%d; }   # macOS date
today()            { date +%Y-%m-%d; }

# ── AUTH ─────────────────────────────────────────────────────

section "AUTH"

LOGIN=$(POST "/api/auth/login" '{"identifier":"admin@mecs.com","password":"admin123"}')
check          "Login → ROLE_ADMIN"    "ROLE_ADMIN" "$(echo "$LOGIN" | jq -r '.role')"
check_not_null "Login → userId"                     "$(echo "$LOGIN" | jq -r '.userId')"
check_not_null "Login → name"                       "$(echo "$LOGIN" | jq -r '.name')"

check "Wrong password → 401" "401" \
  "$(STATUS_POST "/api/auth/login" '{"identifier":"admin@mecs.com","password":"wrong"}')"

check "Missing body → 400" "400" \
  "$(STATUS_POST "/api/auth/login" '{}')"

# ── AREAS ────────────────────────────────────────────────────

section "AREAS"

EXISTING_AREA_ID=$(GET "/api/areas" | jq -r '.[] | select(.areaName == "Regression Test Area") | .areaId')
if [ -n "$EXISTING_AREA_ID" ] && [ "$EXISTING_AREA_ID" != "null" ]; then
  AREA_ID="$EXISTING_AREA_ID"
  pass "Reusing existing Regression Test Area (ID: $AREA_ID)"
else
  CREATE_AREA=$(POST "/api/areas" '{"areaName":"Regression Test Area"}')
  AREA_ID=$(echo "$CREATE_AREA" | jq -r '.areaId')
  check_not_null "Create area → areaId"                           "$AREA_ID"
  check          "Create area → name" "Regression Test Area"      "$(echo "$CREATE_AREA" | jq -r '.areaName')"
fi

check "Duplicate area → 400" "400" \
  "$(STATUS_POST "/api/areas" '{"areaName":"Regression Test Area"}')"

AREA_IN_LIST=$(GET "/api/areas" | jq -r ".[] | select(.areaId == $AREA_ID) | .areaName")
check "Area in GET /areas list" "Regression Test Area" "$AREA_IN_LIST"

# ── CUSTOMERS ────────────────────────────────────────────────

section "CUSTOMERS"

THIS_MONTH=$(this_month_start)
CREATE_CUST=$(POST "/api/customers" \
  "{\"firstName\":\"Regression\",\"lastName\":\"User\",\"doorNumber\":\"T99\",\"streetName\":\"Test Street\",\"areaId\":$AREA_ID,\"phone\":\"0000000099\",\"stbId\":\"STB-REGR-01\",\"monthlyRate\":350,\"subscriptionStartDate\":\"$THIS_MONTH\"}")
CUST_ID=$(echo "$CREATE_CUST" | jq -r '.customerId')
check_not_null "Create customer → customerId"                                    "$CUST_ID"
check          "Create customer → status ACTIVE"  "ACTIVE"                       "$(echo "$CREATE_CUST" | jq -r '.status')"
check          "Create customer → areaName"       "Regression Test Area"         "$(echo "$CREATE_CUST" | jq -r '.areaName')"
check          "Create customer → currentPaymentAmount" "350"                    "$(echo "$CREATE_CUST" | jq -r '.currentPaymentAmount')"
check          "Create customer → paymentPending false" "false"                  "$(echo "$CREATE_CUST" | jq -r '.paymentPending')"
check_not_null "Create customer → subscriptionStart"                             "$(echo "$CREATE_CUST" | jq -r '.currentSubscriptionStart')"

check "Duplicate STB ID → 400" "400" \
  "$(STATUS_POST "/api/customers" "{\"firstName\":\"Dup\",\"areaId\":$AREA_ID,\"phone\":\"0000000088\",\"stbId\":\"STB-REGR-01\",\"monthlyRate\":300}")"

GET_CUST=$(GET "/api/customers/$CUST_ID")
check "GET /customers/:id → firstName"  "Regression" "$(echo "$GET_CUST" | jq -r '.firstName')"

check "Non-existent customer → 404" "404" "$(STATUS_GET "/api/customers/999999")"

CUST_IN_ALL=$(GET "/api/customers" | jq -r ".[] | select(.customerId == $CUST_ID) | .customerId")
check "Customer in GET /customers"              "$CUST_ID" "$CUST_IN_ALL"

CUST_IN_AREA=$(GET "/api/customers?areaId=$AREA_ID" | jq -r ".[] | select(.customerId == $CUST_ID) | .customerId")
check "Customer in ?areaId filter"              "$CUST_ID" "$CUST_IN_AREA"

CUST_IN_ACTIVE=$(GET "/api/customers?status=ACTIVE" | jq -r ".[] | select(.customerId == $CUST_ID) | .customerId")
check "Customer in ?status=ACTIVE filter"       "$CUST_ID" "$CUST_IN_ACTIVE"

UPDATE_RESP=$(PUT "/api/customers/$CUST_ID" '{"phone":"0000000098"}')
check "Update customer → phone changed" "0000000098" "$(echo "$UPDATE_RESP" | jq -r '.phone')"

# ── PAYMENTS ─────────────────────────────────────────────────

section "PAYMENTS"

PAY1=$(POST "/api/payments/$CUST_ID" '{"amount":350,"paymentMethod":"CASH","notes":"Test payment 1"}')
PAY1_ID=$(echo "$PAY1" | jq -r '.paymentId')
check_not_null "Record payment → paymentId"                        "$PAY1_ID"
check          "Record payment → amount"          "350"            "$(echo "$PAY1" | jq -r '.amount')"
check          "Record payment → paymentMethod"   "CASH"           "$(echo "$PAY1" | jq -r '.paymentMethod')"
check          "Record payment → notes"           "Test payment 1" "$(echo "$PAY1" | jq -r '.notes')"
check_not_null "Record payment → subscriptionId linked"            "$(echo "$PAY1" | jq -r '.subscriptionId')"
check_not_null "Record payment → recordedByName"                   "$(echo "$PAY1" | jq -r '.recordedByName')"

CUST_AFTER_PAY=$(GET "/api/customers/$CUST_ID")
check          "After payment → lastPaymentAmount"  "350.00" "$(echo "$CUST_AFTER_PAY" | jq -r '.lastPaymentAmount')"
check_not_null "After payment → lastPaymentDate"            "$(echo "$CUST_AFTER_PAY" | jq -r '.lastPaymentDate')"
check          "After payment → paymentPending"     "false" "$(echo "$CUST_AFTER_PAY" | jq -r '.paymentPending')"
check_not_null "After payment → next subscriptionStart"     "$(echo "$CUST_AFTER_PAY" | jq -r '.currentSubscriptionStart')"

# Second payment with a different amount — new rate must carry forward
PAY2=$(POST "/api/payments/$CUST_ID" '{"amount":400,"paymentMethod":"UPI"}')
check_not_null "Second payment (different amount) succeeds" "$(echo "$PAY2" | jq -r '.paymentId')"
CUST_AFTER_PAY2=$(GET "/api/customers/$CUST_ID")
check "currentPaymentAmount reflects new rate" "400.00" "$(echo "$CUST_AFTER_PAY2" | jq -r '.currentPaymentAmount')"

PAY_IN_CUST_LIST=$(GET "/api/payments/$CUST_ID" | jq -r ".[] | select(.paymentId == $PAY1_ID) | .paymentId")
check "Payment in GET /payments/:customerId" "$PAY1_ID" "$PAY_IN_CUST_LIST"

PAY_IN_ALL=$(GET "/api/payments" | jq -r ".[] | select(.paymentId == $PAY1_ID) | .paymentId")
check "Payment in GET /payments" "$PAY1_ID" "$PAY_IN_ALL"

TODAY=$(today)
PAY_IN_TODAY=$(GET "/api/payments?from=$TODAY&to=$TODAY" | jq -r ".[] | select(.paymentId == $PAY1_ID) | .paymentId")
check "Payment in date-range filter" "$PAY1_ID" "$PAY_IN_TODAY"

# ── SUSPEND & REENROLL ────────────────────────────────────────

section "SUSPEND & REENROLL"

check "Suspend customer → 200" "200" "$(STATUS_PUT_NOBODY "/api/customers/$CUST_ID/suspend")"

SUSPENDED=$(GET "/api/customers/$CUST_ID")
check "Status → SUSPENDED"               "SUSPENDED" "$(echo "$SUSPENDED" | jq -r '.status')"
check "paymentPending cleared on suspend" "false"     "$(echo "$SUSPENDED" | jq -r '.paymentPending')"

check "Payment on suspended customer → 400" "400" \
  "$(STATUS_POST "/api/payments/$CUST_ID" '{"amount":350}')"

check "Double-suspend → 400" "400" "$(STATUS_PUT_NOBODY "/api/customers/$CUST_ID/suspend")"

CUST_NOT_ACTIVE=$(GET "/api/customers?status=ACTIVE" | jq -r ".[] | select(.customerId == $CUST_ID) | .customerId")
check "Suspended customer absent from ?status=ACTIVE" "" "$CUST_NOT_ACTIVE"

CUST_IN_SUSPENDED=$(GET "/api/customers?status=SUSPENDED" | jq -r ".[] | select(.customerId == $CUST_ID) | .customerId")
check "Suspended customer in ?status=SUSPENDED" "$CUST_ID" "$CUST_IN_SUSPENDED"

NEXT_START=$(next_month_start)
REENROLL=$(PUT "/api/customers/$CUST_ID/reenroll" "{\"monthlyRate\":350,\"startDate\":\"$NEXT_START\"}")
check "Reenroll → status ACTIVE" "ACTIVE" "$(echo "$REENROLL" | jq -r '.status')"

check "Cannot reenroll active customer → 400" "400" \
  "$(STATUS_PUT "/api/customers/$CUST_ID/reenroll" "{\"monthlyRate\":350,\"startDate\":\"$NEXT_START\"}")"

# ── CLEANUP ──────────────────────────────────────────────────

section "CLEANUP"

STATUS_PUT_NOBODY "/api/customers/$CUST_ID/suspend" > /dev/null

DEL_STATUS=$(DELETE_REQ "/api/customers/$CUST_ID")
check "Delete suspended customer → 204" "204" "$DEL_STATUS"

check "Deleted customer → 404" "404" "$(STATUS_GET "/api/customers/$CUST_ID")"

# ── SUMMARY ──────────────────────────────────────────────────

TOTAL=$((PASS + FAIL))
echo ""
echo "════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}  All $TOTAL tests passed${NC}"
else
  echo -e "${RED}${BOLD}  $FAIL / $TOTAL tests FAILED${NC}"
fi
echo "════════════════════════════════════════"

[ "$FAIL" -eq 0 ]
