# Loomodex Mobile App — Master Plan

## Current State
- All data is **100% static** — hardcoded in `src/data.ts`
- 15 fake products, 6 fake categories, Unsplash placeholder images
- No API calls, no authentication, no real WooCommerce data

## Target State
- All data **live from loomodex.com** via WooCommerce REST API
- App is a full replica of the website with all features, roles, auth
- Professional mobile UI matching Loomodex branding

---

## Branding Tokens
| Token | Value |
|---|---|
| Primary Blue | `#1E6BFF` |
| Dark Navy | `#0B1F3A` |
| Accent Orange | `#FF7A00` |
| Gold | `#FFC300` |
| Background | `#F5F7FA` |
| Text Secondary | `#6B7280` |
| Font | Inter |

Logo: `assets/logo.png`

---

## API Situation

### What exists on loomodex.com
- WordPress REST API at `https://loomodex.com/wp-json/`
- WooCommerce REST API at `wc/v3` — **requires authentication (401 currently)**
- WooCommerce Store API at `wc/store/v1` — may be public (needs testing)
- Dokan (multi-vendor) plugin active
- WP-Fusion active

### What we need to do

#### Option A — WooCommerce Consumer Keys (Recommended, simplest)
1. Admin goes to WooCommerce → Settings → Advanced → REST API
2. Create a key with **Read** permission
3. We hardcode `consumer_key` + `consumer_secret` in the app env file
4. App calls `wc/v3/products`, `wc/v3/products/categories`, `wc/v3/orders` etc.

**Pros:** No plugin needed, works immediately, secure read-only  
**Cons:** Keys must be kept secret (use `.env` file, never commit)

#### Option B — Custom WordPress Plugin (More control)
Build a plugin `loomodex-app-api` that:
- Creates public endpoints at `/wp-json/loomodex/v1/`
- Returns pre-formatted data exactly as the app needs it
- Handles auth via JWT tokens (login/register)
- Exposes vendor info, order tracking, wallet, OTP etc.

**Pros:** Full control, public endpoints, no key exposure, custom logic  
**Cons:** Needs plugin installed on the server, more dev work

#### RECOMMENDATION
**Do both:** Use WooCommerce consumer keys first to get live data working immediately. Then build the plugin for auth (login/register/orders) and custom features the WooCommerce API doesn't expose.

---

## What You Need to Provide (Action Items for Client/Admin)

### Immediate (to get live data):
1. **WooCommerce REST API Keys**
   - Login to loomodex.com/wp-admin
   - Go to: WooCommerce → Settings → Advanced → REST API
   - Click "Add Key" → Description: "Mobile App" → User: Admin → Permissions: Read/Write
   - Copy the `Consumer Key` (ck_...) and `Consumer Secret` (cs_...)
   - Send these to the developer

2. **Dokan API Access** (for vendor/seller data)
   - Dokan Pro has its own REST API — confirm if Dokan Pro is installed
   - Same process: generate Dokan API key if needed

### For full app features (plugin needed):
3. **Server access** to install the `loomodex-app-api` plugin
   - Or FTP credentials to upload the plugin file

---

## Full Feature Roadmap

### Phase 1 — Live Data (API Integration)
- [ ] Create `.env` file with WooCommerce API keys
- [ ] Build `src/api/` layer (products, categories, orders, auth)
- [ ] Replace static `data.ts` with real API calls
- [ ] Add loading states and error handling
- [ ] Use real WooCommerce product images (not Unsplash)
- [ ] Live categories from `wc/v3/products/categories`
- [ ] Live products with real prices in GNF

### Phase 2 — Authentication & User Roles
- [ ] Login screen — WooCommerce customer login (JWT)
- [ ] Register screen — new customer account
- [ ] Vendor login — separate flow for Dokan sellers
- [ ] Customer role: browse, cart, checkout, orders
- [ ] Vendor role: manage store, products, orders, earnings
- [ ] Driver role: view assigned deliveries, update status

### Phase 3 — Shopping Flow
- [ ] Product detail screen with real images + description
- [ ] Add to cart (WooCommerce cart API)
- [ ] Checkout flow — address, payment method selection
- [ ] Pay on Delivery option
- [ ] Mobile Money payment (Orange Money / MTN)
- [ ] Order confirmation + OTP verification
- [ ] Order tracking screen

### Phase 4 — Vendor Features (Dokan)
- [ ] Vendor store page
- [ ] Vendor dashboard — sales, orders, earnings
- [ ] Add/edit product listings
- [ ] Vendor withdrawal requests

### Phase 5 — App Polish
- [ ] Push notifications (order status updates)
- [ ] Search with filters (price, category, rating, vendor)
- [ ] Wishlist / favorites (sync with account)
- [ ] Reviews and ratings
- [ ] Referral / promo codes
- [ ] French + English language toggle

---

## Screens Map (Current → Target)

| Screen | Current | Target |
|---|---|---|
| Home | Static data | Live products + banner |
| Categories | Static 6 cats | Live 8+ WooCommerce cats |
| Product Detail | Not wired | Real product from API |
| Search | Fake results | WooCommerce search |
| Cart | Static | WooCommerce cart |
| Orders | Static | Real orders from account |
| Account | Static | Real customer/vendor profile |
| Wallet | Static | Real earnings/transactions |
| Auth | None | JWT login/register |

---

## Plugin Plan (loomodex-app-api)

### Endpoints to build:
```
POST /wp-json/loomodex/v1/auth/login
POST /wp-json/loomodex/v1/auth/register
GET  /wp-json/loomodex/v1/products
GET  /wp-json/loomodex/v1/products/{id}
GET  /wp-json/loomodex/v1/categories
GET  /wp-json/loomodex/v1/vendors
GET  /wp-json/loomodex/v1/vendors/{id}
POST /wp-json/loomodex/v1/cart/add
GET  /wp-json/loomodex/v1/orders
POST /wp-json/loomodex/v1/orders/create
POST /wp-json/loomodex/v1/orders/{id}/otp-verify
GET  /wp-json/loomodex/v1/profile
PUT  /wp-json/loomodex/v1/profile/update
GET  /wp-json/loomodex/v1/vendor/dashboard
GET  /wp-json/loomodex/v1/driver/deliveries
```

### Plugin file location:
`wp-content/plugins/loomodex-app-api/loomodex-app-api.php`

---

## ✅ Completed Tasks

1. **Hero Banner** — Dark navy gradient, logo, French headline, orange CTA, Confiance Garantie badge
2. **Trust Badges** — 4 badges (24-48h, Pay on Delivery, Verified, OTP Secure)
3. **Product Cards** — New/Verified badge, orange discount, delivery info, Buy Now button
4. **Expo SDK** — Downgraded to SDK 55, buffer polyfill, metro.config.js fixed

---

## 🔲 Pending (UI — Can do without API)

5. Hero Banner — real delivery photo as background image (client to provide image file)
6. Category section — 8 new categories with better icons and layout
7. Homepage section order — Flash Deals → New Arrivals → Premium → Trending → Recommended
