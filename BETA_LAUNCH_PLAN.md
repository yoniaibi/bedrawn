# DRAWN Beta Launch Action Plan

> Platform: bedrawn.co.uk (web) + DRAWN iOS app (Expo)
> Target: First real beta users (sellers listing items, buyers entering draws)

---

## PART 1 — BLOCKERS (Must fix before any beta user touches it)

### 1.1 Backend / Infrastructure

| # | Item | Why it blocks |
|---|------|--------------|
| B1 | **Swap Stripe test keys → live keys** in SSM Parameter Store | All payments are test-mode; no real money moves |
| B2 | **Wire nightly draw runner** — Lambda at 9pm UTC that picks a winner, marks draw as `closed`, sends winner notification | Without this, draws never close and there's no winner |
| B3 | **Seller payout Lambda** — triggered when winner confirms delivery, calls `stripe.transfers.create` to seller Connect account | Sellers never get paid without this |
| B4 | **Email confirmation flow** — Cognito sends verification email on sign-up | Users without verified emails can't reset passwords |
| B5 | **Closing date enforcement** — API must reject new ticket entries after `closingDate` passes | Buyers can currently buy into closed draws |
| B6 | **Image upload S3 presigned URL endpoint** (`POST /uploads/presign`) | Sellers can't upload item photos — listings have no images |
| B7 | **`GET /draws` endpoint returns real data** from DynamoDB | Home screen and search pull nothing without this |
| B8 | **`GET /me/stats` endpoint** returns real counts | Account screen shows `—` for all stats |
| B9 | **`GET /profile` + `PUT /profile` endpoints** | Profile screen errors; handle not set on sign-up |
| B10 | **`GET /wallet/balance` + `POST /wallet/topup` endpoints** | Balance always shows `...`; can't fund wallet |

### 1.2 Web App

| # | Item | Why it blocks |
|---|------|--------------|
| W1 | **App download banner on web homepage** | Users land on web; should be directed to download app |
| W2 | **Mobile-responsive nav** (hamburger on <768px) | Mobile web users see broken nav |
| W3 | **Draw closing date shown on draw cards** | Users don't know when draws close |
| W4 | **Winner announcement page** (`/draw/[id]/winner`) | No way to communicate who won publicly |
| W5 | **Terms of Service & Privacy Policy pages** — real legal text | Required before collecting any money |
| W6 | **Cookie consent banner** | Required in UK/EU before analytics |

### 1.3 Mobile App

| # | Item | Why it blocks |
|---|------|--------------|
| M1 | **Expo EAS build + App Store submission** | App needs to be downloadable; not just local dev |
| M2 | **Push notification setup** (Expo Notifications) | Winner alerts, draw reminders all need this |
| M3 | **Deep link from web → App Store** | Web banner needs real App Store URL |
| M4 | **Stripe in-app purchase OR wallet top-up via web** | Wallet top-up currently redirects to web — confirm this works end-to-end |

---

## PART 2 — SHOULD-HAVE (Before public launch, not hard blockers)

| # | Item |
|---|------|
| S1 | Seller KYC/identity verification (Stripe Connect onboarding) |
| S2 | Email notifications for: ticket purchase confirmation, draw result, winner delivery reminder |
| S3 | Draw result video/moment screen — show the wheel spin result |
| S4 | Refund flow for cancelled draws |
| S5 | Admin dashboard — manually trigger draw, override winner, issue refunds |
| S6 | Rate limiting on ticket purchase API (prevent same user buying all tickets) |
| S7 | SEO meta tags on each draw page |
| S8 | Analytics (PostHog or similar) — track funnel: visit → register → topup → enter draw |

---

## PART 3 — MANUAL TESTING SCRIPT (Beta Tester Instructions)

Run this script yourself and with 2-3 trusted testers before wider beta.

---

### TEST FLOW A: New User Sign-Up → Browse → Top Up → Enter Draw

**Time required:** ~15 minutes  
**Device:** iPhone (app) + desktop browser (web)

---

#### A1. Web — Land & Register

1. Open **bedrawn.co.uk** in Chrome/Safari on desktop
2. Confirm you see:
   - [ ] Dark background, DRAWN logo, tagline
   - [ ] At least one draw card visible on the homepage
   - [ ] A "Download the app" banner or button (once W1 is built)
3. Click **Sign up** (top right)
4. Enter:
   - Email: use a real email you can check (e.g. `beta1@yourdomain.com`)
   - Password: minimum 8 characters, 1 uppercase, 1 number (e.g. `Test1234!`)
   - Full name: `Beta Tester One`
5. Click **Create account**
6. Check your email inbox — you should receive a **verification email from Cognito**
7. Click the verify link in the email
8. Confirm you are redirected back to the site and logged in
9. ✅ **Expected:** You see your account page or home feed, no error

---

#### A2. Web — Complete Your Profile

1. Click your avatar / account icon (top right)
2. Go to **Account → Edit Profile**
3. Set your handle: `@betatester1` (letters, numbers, underscores only)
4. Set your display name: `Beta One`
5. Click **Save changes**
6. ✅ **Expected:** Green "Profile saved!" confirmation appears
7. Navigate back to Account — confirm your handle shows as `@betatester1`

---

#### A3. Web — Top Up Wallet

1. Click **Wallet** in the account menu (or nav bar)
2. Confirm your balance shows **£0.00**
3. Click **Top up £5**
4. Enter test card details:
   - Card number: `4242 4242 4242 4242`
   - Expiry: `12/30`
   - CVC: `123`
   - Postcode: `SW1A 1AA`
5. Click **Pay £5.00**
6. ✅ **Expected:** Balance updates to **£5.00** within 5 seconds (polling)
7. Try topping up **£10** — balance should now show **£15.00**
8. ✅ **Expected:** Transaction history shows two entries: +£5.00 and +£10.00

---

#### A4. Web — Browse & Enter a Draw

1. Click **Home** or the DRAWN logo to go to the home feed
2. Confirm at least 2 draw cards are visible
3. Click on any draw card
4. On the Draw Detail page, check:
   - [ ] Item title shown
   - [ ] Ticket price shown (e.g. "10p")
   - [ ] Retail value shown (e.g. "Worth £850")
   - [ ] Progress bar visible showing % sold
   - [ ] Closing date/time visible
5. Click **Enter draw** (or **Buy tickets**)
6. On the Purchase page:
   - [ ] Your wallet balance shows (e.g. £15.00)
   - Select **5 tickets** using the pill buttons
   - Confirm the total shows correctly (e.g. 5 × 10p = **£0.50**)
7. Click **Confirm & enter**
8. ✅ **Expected:** Success screen shows — "You're in!" with ticket count and draw closing time
9. Navigate to **Account → My Orders**
10. ✅ **Expected:** The draw you just entered appears in "All" and "Active" tabs
11. Navigate to **Wallet** — confirm balance deducted (£15.00 - £0.50 = **£14.50**)

---

#### A5. Web — Search & Save

1. Click the **Search** icon in the nav
2. Type `watch` in the search box
3. ✅ **Expected:** Results appear within 1 second showing watch-related draws
4. Click a result — confirm Draw Detail page opens
5. Click the **☆ bookmark** icon on any draw card on the home page
6. Navigate to **Account → Saved Draws**
7. ✅ **Expected:** The saved draw appears in your saved list

---

### TEST FLOW B: Seller Journey

**Time required:** ~20 minutes

---

#### B1. Become a Seller

1. Log in to **bedrawn.co.uk**
2. Go to **Account → Become a Seller**
3. Click **Apply to become a seller**
4. ✅ **Expected:** Stripe Connect onboarding opens
5. Complete the KYC form:
   - Business type: Individual
   - Name: your real name
   - Date of birth: your real DOB
   - Address: your real UK address
   - Last 4 digits of national insurance or tax ID
   - Bank account: use a real UK bank account (sort code + account number)
6. Click **Submit**
7. ✅ **Expected:** You are returned to DRAWN with a "Seller application received" message
8. (In test mode, approval is instant — in live mode this takes 1-3 business days)

---

#### B2. List an Item

1. Go to **Account → Seller Dashboard** (or click "List an item" button)
2. Click **+ List new item**

**Step 0 — Draw Type:**
3. Select **Individual item** (not a bundle)
4. Click **Next**

**Step 1 — Photos:**
5. Click the **Hero photo** slot
6. Upload a clear photo of your item (JPG or PNG, under 10MB)
7. ✅ **Expected:** Photo appears in the slot with a green border
8. Add 2-3 more photos using the additional slots
9. Click **Next**

**Step 2 — Details:**
10. Fill in:
    - Title: `Chanel Classic Flap Bag — Black Caviar` (be specific, real items only)
    - Description: describe the item, condition, any authenticity docs included
    - Category: select `Bags`
    - Style: select `Womenswear`
    - Condition: select `Excellent`
11. Click **Next**

**Step 3 — Pricing:**
12. Set:
    - Ticket price: `10` (pence — minimum is 10p)
    - Total tickets: `500` (controls max entries)
    - Retail value: `6800` (RRP in pounds)
13. Click **Review listing**

**Step 4 — Review:**
14. Check all details look correct
15. Check the **"I confirm this item is genuine"** checkbox
16. Click **Submit listing**
17. ✅ **Expected:** Success message — "Your draw is live!"
18. Go to **Seller Dashboard** — your draw should appear in the list

---

#### B3. Seller Dashboard Review

1. Go to **Account → Seller Dashboard**
2. Confirm you see:
   - [ ] Total earned (£0.00 initially)
   - [ ] Pending earnings (updates as tickets sell)
   - [ ] Your listing(s) with sold/total ticket counts
   - [ ] Progress bars per draw
3. Share the draw link with a friend and ask them to buy tickets
4. Refresh the dashboard — confirm sold ticket count increases and pending earnings update

---

### TEST FLOW C: App Download & Login

**Time required:** ~10 minutes

---

#### C1. Download App

1. On your iPhone, open Safari and go to **bedrawn.co.uk**
2. Tap the **"Download the app"** banner
3. ✅ **Expected:** Opens App Store page for DRAWN
4. Tap **Get** to download
5. Open the DRAWN app

---

#### C2. App — Sign In

1. On the DRAWN app landing screen, tap **Log in**
2. Enter the same email + password you registered with on the web
3. Tap **Log in**
4. ✅ **Expected:** Home feed loads showing draws
5. Tap the **Account** tab (bottom right)
6. ✅ **Expected:** Your handle (`@betatester1`) shows at the top
7. Tap the wallet pill — ✅ **Expected:** Shows your correct balance (e.g. £14.50)

---

#### C3. App — Browse Draws

1. On the **Home** tab, scroll down
2. ✅ **Expected:** Real draw cards are visible (not placeholder text)
3. Tap any draw card
4. ✅ **Expected:** Draw Detail screen opens with:
   - [ ] Item title
   - [ ] Ticket price
   - [ ] Retail value
   - [ ] Progress bar
5. Tap **Enter draw**
6. Select **1 ticket**
7. Confirm total and tap **Confirm & enter**
8. ✅ **Expected:** Success screen appears with confetti

---

#### C4. App — Orders & Wallet

1. Tap **Account** tab → **My Orders**
2. ✅ **Expected:** The draw you just entered shows in the Active tab
3. Tap **Account** tab → **My Wallet**
4. ✅ **Expected:** Balance is correct (deducted for the ticket purchase)
5. See the note to top up via web — confirm web top-up then refreshes app balance

---

### TEST FLOW D: Draw Closing & Winner (Admin)

**Time required:** ~5 minutes (after first real entries)

---

1. Manually trigger the draw runner Lambda for a test draw:
   ```
   aws lambda invoke \
     --function-name bedrawn-draw-runner \
     --payload '{"drawId":"TEST_DRAW_ID"}' \
     /tmp/result.json
   ```
2. Check DynamoDB — the draw item should have `status: 'closed'` and `winnerId` set
3. Check the winner's **My Orders** — their entry should show badge **"Won"**
4. Check the winner's notifications — should receive push notification (once M2 is built)
5. The seller's **Dashboard** should show the draw as **"Completed ✓"** with earnings moved from Pending → Total Earned
6. ✅ **Expected:** Stripe transfer visible in seller's Stripe Express dashboard

---

## PART 4 — GO-LIVE CHECKLIST

Work through this in order. Tick each item off before moving to the next.

### Infrastructure
- [ ] **B1** Swap `sk_test_` → `sk_live_` in SSM Parameter Store for all 3 Stripe secrets
- [ ] **B2** Deploy nightly draw runner Lambda + EventBridge rule (cron: `0 21 * * ? *` = 9pm UTC)
- [ ] **B3** Deploy seller payout Lambda (triggered by DynamoDB stream on delivery confirmation)
- [ ] **B4** Confirm Cognito sends verification emails (SES production access — may need AWS support request)
- [ ] **B5** Add closing-date check to `POST /draws/:id/enter` Lambda handler
- [ ] **B6** Deploy `POST /uploads/presign` S3 presigned URL endpoint
- [ ] **B7-B10** Confirm all API endpoints return real data (not 404/empty)

### Web App
- [ ] **W1** Add app download section to homepage (App Store badge + QR code)
- [ ] **W2** Test on iPhone Safari — fix any nav/layout issues
- [ ] **W3** Add closing date to draw cards
- [ ] **W5** Write and publish Terms of Service + Privacy Policy
- [ ] **W6** Add cookie consent (use `react-cookie-consent` or similar)

### Mobile App
- [ ] **M1** Run `eas build --platform ios` — submit to App Store for TestFlight first
- [ ] **M2** Add `expo-notifications` — register device token on login, store in DynamoDB
- [ ] **M3** Add App Store URL to web download banner + deep link config

### Testing
- [ ] Complete **TEST FLOW A** yourself — full buyer journey
- [ ] Complete **TEST FLOW B** yourself — full seller journey
- [ ] Get 2 trusted testers to complete **TEST FLOW A** on their own iPhone
- [ ] Run Playwright suite: `cd frontend && npx playwright test` → must be **0 failures**
- [ ] Load test: 10 concurrent ticket purchases on the same draw — confirm no race condition on ticket count

### Legal & Compliance
- [ ] Register DRAWN as a business (if not done) — required for Stripe Connect live mode
- [ ] Gambling Act exemption check — UK draws/raffles for charity are exempt; commercial draws need legal advice
- [ ] GDPR — Privacy Policy must cover: data stored, Stripe data processing, deletion rights

### Soft Launch (Beta)
- [ ] Invite 10 users personally — mixed buyers and sellers
- [ ] Run 3 test draws with items priced at 10p/ticket, max 100 tickets (low risk)
- [ ] Monitor: Stripe dashboard, CloudWatch Lambda logs, DynamoDB streams
- [ ] Have a `BREAK_GLASS.md` document with instructions to: pause all draws, issue refunds, disable sign-ups

---

## PART 5 — WHAT TO SHOW ME (Results to Verify)

After completing the manual testing flows, share:

1. **Screenshot of Stripe Dashboard** — showing a successful payment charge (not test mode)
2. **Screenshot of DynamoDB** — `bedrawn-items` table with at least one `ORDER#` record
3. **Screenshot of Seller Dashboard** — showing pending earnings after a real ticket sale
4. **AWS CloudWatch logs** — draw runner Lambda execution showing winner selected
5. **Email inbox** — verification email received on sign-up
6. **App Store / TestFlight link** — confirms app is downloadable

---

## PART 6 — KNOWN REMAINING MOCK DATA (Not a blocker, but be aware)

| Screen | What's still mock |
|--------|------------------|
| Live screen (web + app) | Chat messages, wheel animation, tonight's draws list |
| Grand Draw screen (app) | Streak count (shows 3), grand draw entries |
| Activity ticker (home + purchase) | "@user just bought X tickets" messages |
| Winner banner (home) | "@sarah_j just won" message is hardcoded |

These are social proof elements. Replace them when you have real data flowing (post-beta).

---

*Generated: 2026-06-28 | Platform: Expo 56 / Next.js / AWS API Gateway / DynamoDB / Stripe Connect*
