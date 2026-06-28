#!/bin/bash
# Seed realistic fashion draws into DynamoDB for development/staging.
# Run from the backend/ directory: bash scripts/seed-draws.sh

TABLE="bedrawn-items"
REGION="eu-west-1"
SELLER_ID="seed-official-seller-001"
NOW=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
TODAY=$(date -u +%Y-%m-%d)
TOMORROW=$(date -u -v+1d +%Y-%m-%d 2>/dev/null || date -u -d '+1 day' +%Y-%m-%d)

echo "Seeding draws into $TABLE ($REGION)..."
echo "Today: $TODAY | Tomorrow: $TOMORROW"
echo ""

# ── Seed a platform seller account ─────────────────────────────────────────
echo "1/11 Seeding platform seller account..."
aws dynamodb put-item --table-name $TABLE --region $REGION --item '{
  "PK":              {"S": "USER#'"$SELLER_ID"'"},
  "SK":              {"S": "STRIPE_ACCOUNT"},
  "stripeAccountId": {"S": "acct_drawnofficial"},
  "chargesEnabled":  {"BOOL": true},
  "payoutsEnabled":  {"BOOL": true},
  "createdAt":       {"S": "'"$NOW"'"}
}' && echo "   ✓ Platform seller"

# Helper function
put_draw() {
  local ID=$1
  local TITLE=$2
  local DESC=$3
  local CAT=$4
  local STYLE=$5
  local COND=$6
  local TYPE=$7
  local PRICE=$8       # pence
  local TOTAL=$9
  local SOLD=${10}
  local RETAIL=${11}   # pence
  local IMAGE=${12}
  local CLOSING=${13}
  local LABEL=${14}

  local REVENUE=$(( SOLD * PRICE ))
  local MIN=$(( (TOTAL * 25) / 100 ))

  aws dynamodb put-item --table-name $TABLE --region $REGION --item '{
    "PK":                   {"S": "DRAW#'"$ID"'"},
    "SK":                   {"S": "META"},
    "id":                   {"S": "'"$ID"'"},
    "title":                {"S": "'"$TITLE"'"},
    "description":          {"S": "'"$DESC"'"},
    "category":             {"S": "'"$CAT"'"},
    "style":                {"S": "'"$STYLE"'"},
    "condition":            {"S": "'"$COND"'"},
    "type":                 {"S": "'"$TYPE"'"},
    "ticketPricePence":     {"N": "'"$PRICE"'"},
    "totalTickets":         {"N": "'"$TOTAL"'"},
    "minTickets":           {"N": "'"$MIN"'"},
    "soldTickets":          {"N": "'"$SOLD"'"},
    "totalRevenuePence":    {"N": "'"$REVENUE"'"},
    "retailValuePence":     {"N": "'"$RETAIL"'"},
    "imageUrls":            {"L": [{"S": "'"$IMAGE"'"}]},
    "closingDate":          {"S": "'"$CLOSING"'"},
    "sellerId":             {"S": "'"$SELLER_ID"'"},
    "sellerHandle":         {"S": "drawnofficial"},
    "sellerStripeAccountId":{"S": "acct_drawnofficial"},
    "status":               {"S": "open"},
    "tags":                 {"L": []},
    "createdAt":            {"S": "'"$NOW"'"},
    "updatedAt":            {"S": "'"$NOW"'"}
  }' && echo "   ✓ $LABEL"
}

# ── 10 Fashion draws ────────────────────────────────────────────────────────
echo ""
echo "Seeding draws..."

put_draw \
  "8df1fe4b-1109-4f21-afeb-1cf7eea6011d" \
  "Gucci Dionysus GG Supreme Shoulder Bag" \
  "Iconic Gucci Dionysus in GG Supreme canvas with leather trim. Gold-tone hardware, two internal compartments. Comes with original dust bag and box. An investment piece straight from the Italian house." \
  "Bags" "Womenswear" "Like New" "luxury" \
  100 1850 1240 185000 \
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop&q=85" \
  "$TODAY" "Gucci Bag — closing tonight"

put_draw \
  "fa84542d-614a-4868-bcd5-886c40649df4" \
  "Off-White x Nike Air Force 1 'The Ten'" \
  "The sneaker that defined a generation. Off-White x Nike AF1 in size UK9/EU43. Worn once indoors. Complete with box, tissue, zip tie and extra laces. A grail for any collector." \
  "Trainers" "Menswear" "Like New" "single" \
  50 1300 890 65000 \
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=85" \
  "$TODAY" "Off-White AF1 — closing tonight"

put_draw \
  "0bade22f-8f46-48ca-ae36-52587b71f2bc" \
  "Rolex Oyster Perpetual 36mm Coral Red Dial" \
  "2021 full set Rolex Oyster Perpetual 36mm in Oystersteel with the sought-after coral red dial. Box and papers. Never worn outside. Serviced by authorised Rolex dealer April 2024." \
  "Watches" "Unisex" "New" "luxury" \
  100 6500 2100 650000 \
  "https://images.unsplash.com/photo-1523170335258-f87a2f594dc1?w=800&h=800&fit=crop&q=85" \
  "$TOMORROW" "Rolex OP36 — closing tomorrow"

put_draw \
  "bf71ce3c-035e-4749-8159-9644d9c16e41" \
  "Prada Re-Edition 2005 Re-Nylon Shoulder Bag" \
  "Prada Re-Edition 2005 in Re-Nylon and Saffiano leather. The bag that started a thousand waiting lists. Black with silver hardware. Adjustable strap, magnetic snap closure. Essentially new — used twice." \
  "Bags" "Womenswear" "New" "single" \
  25 4800 3200 120000 \
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop&q=85" \
  "$TOMORROW" "Prada Re-Edition — closing tomorrow"

put_draw \
  "51437f07-d585-44a6-a905-21f63b115207" \
  "Stone Island Soft Shell-R Jacket — Ice" \
  "Stone Island Soft Shell-R jacket in ice. AW23 season. Size L. The compass badge of honour. Wind and waterproof, packable, incredibly lightweight. Worn twice. Original tags still attached." \
  "Streetwear" "Menswear" "Like New" "single" \
  50 1800 560 90000 \
  "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800&h=800&fit=crop&q=85" \
  "$TODAY" "Stone Island Jacket — closing tonight"

put_draw \
  "dd84b277-9575-4ecb-b48d-4fe8381899a4" \
  "Bottega Veneta Cassette Bag — Cloud" \
  "Bottega Veneta Intrecciato Cassette in cloud. Daniel Lee era — the most coveted silhouette of the last decade. Mini size, silver-tone frame clasp. Comes with full set. Practically unused." \
  "Bags" "Womenswear" "New" "luxury" \
  100 2400 400 240000 \
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop&q=85&crop=entropy" \
  "$TOMORROW" "Bottega Cassette — closing tomorrow"

put_draw \
  "a4aa6a89-795f-4cf2-bb60-9a62342cf040" \
  "Nike x Sacai VaporWaffle 'Dark Iris'" \
  "Nike x Sacai VaporWaffle in Dark Iris/Psychic Purple. UK8.5/EU43. Deadstock, never worn, original receipt included. The most wearable Sacai collab — statement without screaming." \
  "Trainers" "Unisex" "New" "single" \
  25 2000 1400 45000 \
  "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&h=800&fit=crop&q=85" \
  "$TODAY" "Sacai VaporWaffle — closing tonight"

put_draw \
  "12602c9f-97b5-4add-81ba-d010dd9b2c07" \
  "Cartier Love Bracelet — Yellow Gold" \
  "Cartier Love Bracelet in 18ct yellow gold, size 17. Comes with original screwdriver, box, and certificate of authenticity. Barely worn — purchased as an investment. The ultimate wardrobe staple." \
  "Jewellery" "Unisex" "Like New" "luxury" \
  100 4800 1200 480000 \
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop&q=85" \
  "$TOMORROW" "Cartier Love Bracelet"

put_draw \
  "8f585ed3-63b8-4be6-9101-ef4dc72669d4" \
  "Jacquemus Le Chiquito Long Bag — Lavande" \
  "Jacquemus Le Chiquito Long in Lavande. The arm-candy that dominated SS22. Worn three times. 100% smooth leather, adjustable chain strap. Comes with dust bag. Perfect condition." \
  "Bags" "Womenswear" "Good" "single" \
  25 2700 1800 68000 \
  "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=800&fit=crop&q=85" \
  "$TOMORROW" "Jacquemus Chiquito"

put_draw \
  "277859d1-95f5-471a-89b7-ede08c539546" \
  "Supreme x Louis Vuitton Box Logo Hoodie — Red" \
  "The collab that broke the internet. Supreme x Louis Vuitton AW17 Box Logo hoodie in red/monogram. Size L. Extremely rare — fewer than 10k produced globally. Never worn. Full documentation included." \
  "Streetwear" "Menswear" "New" "bundle" \
  100 3500 280 350000 \
  "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&h=800&fit=crop&q=85" \
  "$TOMORROW" "Supreme x LV Hoodie"

echo ""
echo "Done. 10 draws seeded."
