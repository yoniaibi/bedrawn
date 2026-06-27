# Bedrawn — Stripe Connect Recommendation Plan

## Configuration

| Field | Value |
|-------|-------|
| `dashboard` | `express` |
| `fees_collector` | `application` |
| `losses_collector` | `application` |
| Charge pattern | **Separate charges and transfers** |
| Country | GB |
| Currency | GBP |

## Why separate charges and transfers

Destination charges cannot hold funds between charge and transfer. Since ticket money must sit in escrow until the draw resolves AND delivery is confirmed (potentially 24–72h later), separate charges and transfers is required.

## Money flow

```
1. Buyer tops up wallet
   → PaymentIntent on platform Stripe account (no Connect)
   → On payment_intent.succeeded webhook: credit DynamoDB wallet balance

2. Buyer spends wallet on tickets
   → Internal DynamoDB deduction only (no Stripe call)
   → Ticket allocations stored in DynamoDB

3. Draw resolves at 9pm
   → Winner selected, draw marked resolved in DynamoDB

4. Winner confirms delivery
   → POST /draws/{id}/payout
   → stripe.transfers.create({ amount: revenue * 0.88, destination: seller.stripeAccountId })
   → Platform keeps 12% — stays in platform Stripe balance automatically
```

## Fee economics

| Scenario | Numbers |
|----------|---------|
| Draw: 2,000 tickets × 25p | £500 total |
| Stripe processing (1.5% + 20p on wallet top-ups) | ~£7.70 |
| Seller payout (88%) | £440 |
| Platform fee (12%) | £60 |
| Net platform margin after Stripe fees | ~£52 |

**⚠️ Minimum wallet top-up: £5** — Stripe's 20p flat fee makes sub-£2 top-ups economically unviable.

## API endpoints built

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/seller/account` | JWT | Create Express account + return onboarding URL |
| POST | `/wallet/topup` | JWT | Create PaymentIntent, return clientSecret |
| POST | `/draws/{id}/payout` | JWT (winner only) | Transfer to seller after delivery confirmed |
| POST | `/webhooks/stripe` | None (sig verified) | Handle payment_intent.succeeded → credit wallet |

## Embedded components for seller UI

- `account_onboarding` — KYC flow
- `notification_banner` — keeps accounts healthy
- `account_management` — sellers manage bank details
- `payouts` — earnings and payout history

## Post-deploy steps

1. `npx cdk deploy` to deploy Stripe Lambdas
2. In Stripe Dashboard → Webhooks → Add endpoint:
   - URL: `https://uctmxxb939.execute-api.eu-west-1.amazonaws.com/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`
3. Copy the webhook signing secret → update `STRIPE_WEBHOOK_SECRET` in CDK and redeploy
4. Add `NEXT_PUBLIC_STRIPE_PK` to Amplify env vars

## Before going live

- [ ] Swap `sk_test_` → `sk_live_` in SSM Parameter Store
- [ ] Lift Stripe minimum wallet top-up if needed
- [ ] Enable Stripe Radar rules for fraud prevention
- [ ] Set up Stripe Dashboard margin monitoring
