#!/bin/bash
# Seed realistic fashion draws into DynamoDB for development/staging.
# Run from the backend/ directory: bash scripts/seed-draws.sh

TABLE="bedrawn-items"
REGION="eu-west-1"
SELLER_ID="seed-official-seller-001"
NOW=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
TODAY=$(date -u +%Y-%m-%d)
IN3=$(date -u -v+3d +%Y-%m-%d 2>/dev/null || date -u -d '+3 days' +%Y-%m-%d)
IN7=$(date -u -v+7d +%Y-%m-%d 2>/dev/null || date -u -d '+7 days' +%Y-%m-%d)

echo "Seeding draws into $TABLE ($REGION)..."
echo "Today: $TODAY | +3: $IN3 | +7: $IN7"
echo ""

# ── Seed a platform seller account ─────────────────────────────────────────
echo "Seeding platform seller account..."
aws dynamodb put-item --table-name $TABLE --region $REGION --item '{
  "PK":              {"S": "USER#'"$SELLER_ID"'"},
  "SK":              {"S": "STRIPE_ACCOUNT"},
  "stripeAccountId": {"S": "acct_drawnofficial"},
  "chargesEnabled":  {"BOOL": true},
  "payoutsEnabled":  {"BOOL": true},
  "createdAt":       {"S": "'"$NOW"'"}
}' && echo "   ✓ Platform seller"

# Helper: put_draw ID TITLE DESC CAT STYLE COND TYPE PRICE TOTAL SOLD RETAIL IMAGE CLOSING LABEL
put_draw() {
  local ID=$1 TITLE=$2 DESC=$3 CAT=$4 STYLE=$5 COND=$6 TYPE=$7
  local PRICE=$8 TOTAL=$9 SOLD=${10} RETAIL=${11} IMAGE=${12} CLOSING=${13} LABEL=${14}
  local REVENUE=$(( SOLD * PRICE ))
  local MIN=$(( (TOTAL * 25) / 100 ))

  aws dynamodb put-item --table-name $TABLE --region $REGION --item '{
    "PK":                    {"S": "DRAW#'"$ID"'"},
    "SK":                    {"S": "META"},
    "id":                    {"S": "'"$ID"'"},
    "title":                 {"S": "'"$TITLE"'"},
    "description":           {"S": "'"$DESC"'"},
    "category":              {"S": "'"$CAT"'"},
    "style":                 {"S": "'"$STYLE"'"},
    "condition":             {"S": "'"$COND"'"},
    "type":                  {"S": "'"$TYPE"'"},
    "ticketPricePence":      {"N": "'"$PRICE"'"},
    "totalTickets":          {"N": "'"$TOTAL"'"},
    "minTickets":            {"N": "'"$MIN"'"},
    "soldTickets":           {"N": "'"$SOLD"'"},
    "totalRevenuePence":     {"N": "'"$REVENUE"'"},
    "retailValuePence":      {"N": "'"$RETAIL"'"},
    "imageUrls":             {"L": [{"S": "'"$IMAGE"'"}]},
    "closingDate":           {"S": "'"$CLOSING"'"},
    "sellerId":              {"S": "'"$SELLER_ID"'"},
    "sellerHandle":          {"S": "drawnofficial"},
    "sellerStripeAccountId": {"S": "acct_drawnofficial"},
    "status":                {"S": "open"},
    "createdAt":             {"S": "'"$NOW"'"},
    "updatedAt":             {"S": "'"$NOW"'"}
  }' && echo "   ✓ $LABEL"
}

echo ""
echo "Seeding draws..."

# ── Bags ────────────────────────────────────────────────────────────────────
put_draw \
  "a1b2c3d4-0001-4000-8000-seed00000001" \
  "Gucci Dionysus GG Supreme Shoulder Bag" \
  "Iconic Gucci Dionysus in GG Supreme canvas with leather trim. Gold-tone hardware, two internal compartments. Comes with original dust bag and box." \
  "Bags" "Womenswear" "Like New" "luxury" \
  100 1850 1240 185000 \
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop&q=85" \
  "$IN3" "Gucci Dionysus Bag"

put_draw \
  "a1b2c3d4-0002-4000-8000-seed00000002" \
  "Prada Re-Edition 2005 Re-Nylon Shoulder Bag" \
  "Prada Re-Edition 2005 in Re-Nylon and Saffiano leather. Black with silver hardware. Adjustable strap, magnetic snap closure. Essentially new — used twice." \
  "Bags" "Womenswear" "New" "single" \
  25 4800 2100 120000 \
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop&q=85" \
  "$IN7" "Prada Re-Edition"

put_draw \
  "a1b2c3d4-0003-4000-8000-seed00000003" \
  "Bottega Veneta Cassette Bag — Cloud" \
  "Bottega Veneta Intrecciato Cassette in cloud. Daniel Lee era. Mini size, silver-tone frame clasp. Comes with full set. Practically unused." \
  "Bags" "Womenswear" "New" "luxury" \
  100 2400 480 240000 \
  "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=800&fit=crop&q=85" \
  "$IN3" "Bottega Cassette"

put_draw \
  "a1b2c3d4-0004-4000-8000-seed00000004" \
  "Jacquemus Le Chiquito Long — Lavande" \
  "Jacquemus Le Chiquito Long in Lavande. Worn three times. 100% smooth leather, adjustable chain strap. Comes with dust bag. Perfect condition." \
  "Bags" "Womenswear" "Good" "single" \
  25 2700 900 68000 \
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop&q=85&crop=entropy" \
  "$IN7" "Jacquemus Chiquito"

# ── Trainers ────────────────────────────────────────────────────────────────
put_draw \
  "a1b2c3d4-0005-4000-8000-seed00000005" \
  "Off-White x Nike Air Force 1 'The Ten'" \
  "The sneaker that defined a generation. UK9/EU43. Worn once indoors. Complete with box, tissue, zip tie and extra laces." \
  "Trainers" "Menswear" "Like New" "single" \
  50 1300 520 65000 \
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=85" \
  "$IN3" "Off-White AF1"

put_draw \
  "a1b2c3d4-0006-4000-8000-seed00000006" \
  "Nike x Sacai VaporWaffle 'Dark Iris'" \
  "Nike x Sacai VaporWaffle in Dark Iris/Psychic Purple. UK8.5/EU43. Deadstock, never worn, original receipt included." \
  "Trainers" "Unisex" "New" "single" \
  25 2000 1400 45000 \
  "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&h=800&fit=crop&q=85" \
  "$IN3" "Sacai VaporWaffle"

put_draw \
  "a1b2c3d4-0007-4000-8000-seed00000007" \
  "New Balance 2002R 'Protection Pack — Slate'" \
  "New Balance 2002R in Slate/Castlerock. UK9. Brand new, worn for 10 minutes to check fit. The understated grail of 2024." \
  "Trainers" "Unisex" "New" "single" \
  25 1600 200 18000 \
  "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop&q=85" \
  "$IN7" "New Balance 2002R"

# ── Watches ────────────────────────────────────────────────────────────────
put_draw \
  "a1b2c3d4-0008-4000-8000-seed00000008" \
  "Rolex Oyster Perpetual 36mm Coral Red Dial" \
  "2021 full set Rolex Oyster Perpetual 36mm in Oystersteel with the sought-after coral red dial. Box and papers. Never worn outside." \
  "Watches" "Unisex" "New" "luxury" \
  100 6500 3200 650000 \
  "https://images.unsplash.com/photo-1523170335258-f87a2f594dc1?w=800&h=800&fit=crop&q=85" \
  "$IN3" "Rolex OP36 Coral"

put_draw \
  "a1b2c3d4-0009-4000-8000-seed00000009" \
  "Audemars Piguet Royal Oak 15400 — Stainless Steel" \
  "AP Royal Oak 15400ST in stainless steel, blue tapisserie dial. 2019, full set. The watch that invented the luxury sports watch genre." \
  "Watches" "Unisex" "Like New" "luxury" \
  100 8000 1800 1200000 \
  "https://images.unsplash.com/photo-1548171915-e79a6a8a5f3e?w=800&h=800&fit=crop&q=85" \
  "$IN7" "AP Royal Oak"

# ── Jewellery ────────────────────────────────────────────────────────────────
put_draw \
  "a1b2c3d4-0010-4000-8000-seed00000010" \
  "Cartier Love Bracelet — Yellow Gold" \
  "Cartier Love Bracelet in 18ct yellow gold, size 17. Comes with original screwdriver, box, and certificate of authenticity." \
  "Jewellery" "Unisex" "Like New" "luxury" \
  100 4800 1200 480000 \
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop&q=85" \
  "$IN3" "Cartier Love Bracelet"

put_draw \
  "a1b2c3d4-0011-4000-8000-seed00000011" \
  "Van Cleef & Arpels Alhambra Necklace — Malachite" \
  "VCA Vintage Alhambra necklace in yellow gold with malachite motifs. 10 motifs. Comes with box and certificate. The eternal classic." \
  "Jewellery" "Womenswear" "Like New" "luxury" \
  100 3600 720 360000 \
  "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&h=800&fit=crop&q=85" \
  "$IN7" "Van Cleef Alhambra"

# ── Streetwear ────────────────────────────────────────────────────────────────
put_draw \
  "a1b2c3d4-0012-4000-8000-seed00000012" \
  "Supreme x Louis Vuitton Box Logo Hoodie — Red" \
  "Supreme x Louis Vuitton AW17 Box Logo hoodie in red/monogram. Size L. Extremely rare. Never worn. Full documentation included." \
  "Streetwear" "Menswear" "New" "single" \
  100 3500 700 350000 \
  "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&h=800&fit=crop&q=85" \
  "$IN3" "Supreme x LV Hoodie"

put_draw \
  "a1b2c3d4-0013-4000-8000-seed00000013" \
  "Stone Island Soft Shell-R Jacket — Ice" \
  "Stone Island Soft Shell-R jacket in ice. AW23 season. Size L. Wind and waterproof, packable. Worn twice. Original tags still attached." \
  "Streetwear" "Menswear" "Like New" "single" \
  50 1800 400 90000 \
  "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800&h=800&fit=crop&q=85" \
  "$IN7" "Stone Island Jacket"

# ── Fashion ────────────────────────────────────────────────────────────────
put_draw \
  "a1b2c3d4-0014-4000-8000-seed00000014" \
  "Chanel Classic Flap Bag — Beige Lambskin Medium" \
  "Chanel Classic Flap in beige lambskin with gold hardware. Medium size. 2022 collection. Complete with authenticity card, box and dust bag." \
  "Fashion" "Womenswear" "Like New" "luxury" \
  100 4200 1600 420000 \
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop&q=85&sat=-20" \
  "$IN3" "Chanel Classic Flap"

put_draw \
  "a1b2c3d4-0015-4000-8000-seed00000015" \
  "Loro Piana Cashmere Bomber — Camel" \
  "Loro Piana cashmere bomber in camel. Size M. The pinnacle of quiet luxury. Worn three times. Perfect condition, comes with garment bag." \
  "Fashion" "Unisex" "Good" "single" \
  50 2200 350 220000 \
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop&q=85" \
  "$IN7" "Loro Piana Bomber"

echo ""
echo "Done. 15 draws seeded across Bags, Trainers, Watches, Jewellery, Streetwear, Fashion."
