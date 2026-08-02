# Loomodex Mobile App — Store Submission Handoff

_For the app developer preparing the App Store (iOS) and Google Play (Android) listings._

Loomodex is a multi-vendor e-commerce marketplace for Guinea (Conakry), built with **Expo / React Native**. It talks to a WordPress + WooCommerce + WCFM backend at `https://loomodex.com`.

---

## 1. App identity

| | |
|---|---|
| App name | **Loomodex** |
| Bundle ID (iOS) | `com.loomodex.app` |
| Package (Android) | `com.loomodex.app` |
| Version | `1.0.0` (EAS `appVersionSource: remote` — build number auto-increments) |
| EAS project ID | `823d0c2c-7f2a-44fa-b722-89bac8066414` |
| Expo account | `fhdlkhn` |
| Framework | Expo (managed) — build with **EAS Build** |

---

## 2. Test / demo login accounts (give these to the reviewers)

Both Apple and Google require working demo credentials. All three are **public roles** available in the app.

| Role | Email | Password |
|---|---|---|
| **Customer** | `customer1@gmail.com` | `12345678` |
| **Seller / Store** | `seller@gmail.com` | `12345678` |
| **Delivery driver** | `driver2@gmail.com` | `12345678` |

> Also note: the app supports **guest checkout** — a reviewer can browse and place an order with **no login at all**. Put the customer account in the "demo account" field anyway (Apple requires one even if login is optional).

**On login, each role lands directly on its own screen:** customer → shop, seller → store dashboard, driver → delivery dashboard. (Admin/logistics/support are managed from the website, not the app.)

---

## 3. What the app does (for the store description)

**Customers**
- Browse products & categories, search, product details, wishlist
- **Guest checkout** (order without an account) or logged-in checkout
- Cash on Delivery **or** Loomodex Wallet payment
- Structured Guinea delivery address (Zone → Commune → Quartier → Landmark) + optional map pin
- Recipient can differ from the buyer (separate recipient phone)
- Order tracking (status + live driver location on a map), OTP delivery confirmation
- In-app notifications (bell) + push notifications
- "USA Store" section for imported products with an international delivery estimate

**Sellers / Stores** (native dashboard)
- Receive new orders (list + push notification)
- Confirm → prepare → mark ready for dispatch
- Follow driver pickup (driver name + pickup time), call the driver
- Manage products (add / edit / stock) and store settings, view sales stats

**Delivery drivers** (native dashboard)
- See assigned deliveries, pickup & delivery addresses
- Update status (Picked up → On the way → Arrived), verify OTP to complete
- Live GPS broadcast, navigate to customer, "Send Location Request" SMS, call/WhatsApp recipient

---

## 4. Store listing copy (ready to paste)

Primary market is francophone Guinea, so the **French** copy below is the main listing. An English version follows for the English (default) locale — you can add both locales in App Store Connect / Play Console.

### App title
- **Apple** (≤30 chars): `Loomodex`
- **Google** (≤50 chars): `Loomodex — Marketplace de Guinée`

### Subtitle (Apple, ≤30 chars)
`Achats & livraison en Guinée`

### Short description (Google Play, ≤80 chars)
`Achetez en Guinée, payez à la livraison. Livraison rapide à Conakry.`

### Promotional text (Apple, ≤170 chars — editable anytime without review)
`Des milliers de produits livrés chez vous à Conakry. Payez à la livraison après inspection, ou avec votre portefeuille. Commandez même sans créer de compte.`

### Keywords (Apple, ≤100 chars, comma-separated)
`Guinée,Conakry,shopping,livraison,marketplace,achat,vendeur,boutique,paiement livraison,e-commerce`

### Category & rating
- **Category:** Shopping
- **Content rating:** 4+ / Everyone

### Full description (Google Play ≤4000 chars · Apple description) — FRENCH

```
Loomodex — le marché de Guinée, livré chez vous.

Loomodex est la marketplace multi-boutiques de Guinée. Achetez des milliers de produits — électronique, mode, maison, beauté et bien plus — auprès de vendeurs vérifiés, et faites-vous livrer rapidement à Conakry.

ACHETER EN TOUTE SIMPLICITÉ
• Parcourez les produits et catégories, recherchez et comparez
• Commandez sans créer de compte (paiement à la livraison)
• Connectez-vous pour un paiement plus rapide et l'historique de vos commandes
• Section « USA Store » : produits importés des États-Unis avec délai de livraison estimé

PAIEMENT & LIVRAISON
• Paiement à la livraison — inspectez votre produit avant de payer
• Portefeuille Loomodex pour payer avec votre solde
• Adresse de livraison précise : Zone, Commune, Quartier, point de repère
• Vous commandez pour un proche ? Indiquez un numéro de destinataire différent

SUIVI EN TEMPS RÉEL
• Suivez votre commande étape par étape
• Visualisez la position du livreur sur la carte
• Livraison sécurisée confirmée par code (OTP)

POUR LES VENDEURS
• Gérez votre boutique directement depuis l'application
• Recevez et confirmez les commandes, préparez-les et suivez l'enlèvement par le livreur
• Ajoutez et modifiez vos produits, suivez vos ventes

POUR LES LIVREURS
• Tableau de bord de vos livraisons assignées
• Navigation GPS, mise à jour du statut, confirmation par OTP

Loomodex — vos achats, livrés avec soin, partout à Conakry.
```

### Full description — ENGLISH (for the default/English locale)

```
Loomodex — Guinea's marketplace, delivered to your door.

Loomodex is Guinea's multi-vendor marketplace. Shop thousands of products — electronics, fashion, home, beauty and more — from verified sellers, with fast delivery across Conakry.

SHOP WITH EASE
• Browse products and categories, search and compare
• Order without creating an account (cash on delivery)
• Sign in for faster checkout and full order history
• "USA Store" section: products imported from the United States, with an estimated delivery time

PAYMENT & DELIVERY
• Cash on Delivery — inspect your product before you pay
• Loomodex Wallet to pay from your balance
• Precise Guinea delivery address (Zone, Commune, Neighborhood, landmark)
• Ordering for someone else? Add a separate recipient phone number

REAL-TIME TRACKING
• Follow your order step by step
• See the driver's live location on the map
• Secure delivery confirmed with a one-time code (OTP)

FOR SELLERS
• Manage your store right from the app
• Receive and confirm orders, prepare them, and follow driver pickup
• Add and edit products, track your sales

FOR DRIVERS
• Dashboard of your assigned deliveries
• GPS navigation, status updates, OTP confirmation

Loomodex — your shopping, delivered with care, all across Conakry.
```

> **Note for the reviewer notes field:** mention that the app has three login roles (customer, seller, driver) plus guest checkout, and provide the three demo accounts from section 2. Apple's review team should be told which account shows which experience.

---

## 5. Store-compliance items (already handled)

- **Account deletion (in-app)** — Account screen → "Supprimer mon compte" (permanent, self-service). Satisfies **Apple**.
- **Account deletion (web URL)** — required by **Google Play**. Enter this in Play Console → App content → Data safety → Account deletion:
  **`https://loomodex.com/delete-account`**
  _(A WordPress Page with slug `delete-account` using the "Delete Account" template must be published — the theme provides it.)_
- **Privacy Policy URL** (both stores): **`https://loomodex.com/privacy-policy-page/`**
- **Payments** — this version shows **only Cash on Delivery and the Loomodex Wallet**. Card / mobile-money / online payment is intentionally hidden (feature-flagged off) until the online gateway is live, so nothing non-functional is shown to reviewers.
- **Location permission** — the app uses location **only while in use** (foreground): delivery tracking, driver GPS, and the checkout map. There is **no background location**. Declare "while in use" and describe it as delivery tracking.

---

## 6. iOS setup (what the developer needs to add)

Android is ready; iOS needs the standard first-build items:

1. **Apple Developer account access** — to create the app in App Store Connect and manage signing. EAS can generate & manage the iOS certificate + provisioning profile automatically once it has Apple account access (`eas credentials`), or you can supply them.
2. **Push notifications (APNs)** — the app uses Expo push. Upload an **APNs key** to EAS (`eas credentials` → iOS → Push Key). No file goes in the repo for this.
3. **Firebase config (only if you add Firebase on iOS)** — Android already ships `google-services.json` (FCM). If you mirror Firebase on iOS, add the matching **`GoogleService-Info.plist`** and reference it in `app.json` under `ios.googleServicesFile`. _For Expo push alone, the APNs key in step 2 is what's required — the plist is only needed if the same Firebase project is used on iOS._
4. Build: `eas build --platform ios --profile preview` (or `production` for the store).

**Android** (already done): `google-services.json` is in the repo and referenced in `app.json`; the release keystore lives on EAS.

---

## 7. Environment variables / secrets — do you need to send them?

**No `.env` or secrets need to be sent.**

- The API base URL is hardcoded in the app (`src/api/client.ts` → `https://loomodex.com/wp-json/loomodexapp/v1`).
- The Google Maps key is **not bundled** in the app — the app fetches it from the server at runtime (`/config` endpoint). So there's no Maps key to hand over.
- There is **no `.env` file** in the project.
- Signing credentials (Android keystore, iOS certs) are managed by **EAS**, not stored in the repo.

So the developer only needs: **access to the Expo account** (`fhdlkhn`) or a project transfer, and **an Apple Developer account** for the iOS build/submission.

---

## 8. Backend dependency (important)

The app is a client for the live backend. For everything to work, the latest **WordPress theme (`loomodex`)** and **plugin (`loomodex-app-api`)** must be uploaded to `loomodex.com`. If the app behaves oddly during review, confirm the backend is up to date first.

---

## 9. Build commands (reference)

```bash
# Android APK (internal/testing)
eas build --platform android --profile preview

# iOS (needs Apple account configured first)
eas build --platform ios --profile preview

# Production (store) builds
eas build --platform android --profile production   # AAB for Play
eas build --platform ios --profile production       # for App Store
```

_Questions on any of the above — happy to clarify._
