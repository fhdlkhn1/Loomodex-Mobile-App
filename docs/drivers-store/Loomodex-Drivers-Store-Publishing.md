# Loomodex Drivers — first publication on Google Play and the App Store

This guide covers the **first** upload of the new **Loomodex Drivers** app to Google Play and the App Store. The customer app **Loomodex** is already live and is not affected.

Loomodex Drivers is built from the **same codebase** as the customer app (repo `fhdlkhn1/Loomodex-Mobile-App`, branch `master`). The `APP_VARIANT=drivers` setting in the `drivers-*` EAS profiles turns it into a separate app with its own name, package and EAS project. Nothing in the code needs to change to publish it.

---

## 1. App identity (use exactly these values)

| | Value |
|---|---|
| App name | **Loomodex Drivers** |
| Android package | `com.loomodex.drivers` |
| iOS bundle ID | `com.loomodex.drivers` |
| Version | `1.0.0` (build numbers auto-increment on EAS) |
| EAS project | `@fhdlkhn/loomodex-drivers` (ID `3d1ca04e-8652-422f-a1d3-a37131c1e22e`) |
| EAS build profile | `drivers-production` (**never** `production`, which builds the customer app) |
| Firebase (Android push) | `google-services.drivers.json` is already in the repo; the FCM V1 key is already uploaded to the EAS project |
| Who uses it | Delivery drivers, logistics managers, logistics partner managers |
| Who cannot use it | Customers, sellers and customer service: after signing in they see a "use the Loomodex app" screen |

---

## 2. Before you start

1. **Pull the latest `master`** and run `npm install`.
2. **Server:** the API plugin `loomodex-app-api` must be at version **1.8.4** or later on loomodex.com, which it already is. It keeps Drivers push notifications separate from customer-app ones.
3. **Icon:** the Drivers app has its own icon (the "DRIVER" motorbike), already in the repo under `assets/drivers/` and used automatically by the `drivers-*` builds, including the splash screen and Android adaptive icon. For the Play listing's 512×512 icon, use `Loomodex-Drivers-PlayStore-icon-512.png`, which Fahad will send with this document. App Store Connect takes the icon from the build.
4. **Review accounts:** Fahad will provide them (section 7). Apple and Google both need a working login, because the app has no content without one.

---

## 3. Google Play

### 3.1 Create the app in Play Console
Use the same developer account that hosts the customer app. Go to **Create app**:
- App name: `Loomodex Drivers`
- Default language: **French (France) – fr-FR**
- App or game: **App**
- Free or paid: **Free**
- Accept the declarations.

### 3.2 Build
```
npx eas-cli build -p android --profile drivers-production
```
This produces an `.aab` file. The upload keystore for `com.loomodex.drivers` is already on EAS from the earlier test builds.

### 3.3 First upload must be manual
Google does not accept the very first upload through the API, so `eas submit` will fail the first time.
1. Download the `.aab` from the EAS build page.
2. In Play Console, go to **Test and release → Production** (or **Internal testing** first), then **Create new release** and upload the `.aab`.
3. Release notes: see section 6.

From the second release on, `npx eas-cli submit -p android --profile drivers-production --latest` works, once a Google service account is linked in EAS.

> **Important:** if the Play developer account is a **personal** account created after November 2023, Google requires a **closed test with at least 12 testers for 14 days** before the app can go to Production. Check **Dashboard** in Play Console: it shows this requirement if it applies. Use drivers and logistics staff as testers.

### 3.4 App content (Policy → App content)
| Section | Answer |
|---|---|
| Privacy policy | Same URL as the customer app's Play listing |
| App access | **All or some functionality is restricted** → add the review driver account (section 7) with the instructions "Sign in with the email and password below." |
| Ads | **No ads** |
| Content rating | Fill in the questionnaire: category **Utility / Productivity / Business**, answer **No** to every content question → rated **Everyone / PEGI 3** |
| Target audience | **18 and over** only |
| News app | No |
| Government app | No |
| Financial features | **None** (drivers record cash collected on delivery, but the app does not move money) |
| Health | No |
| Data safety | See 3.5 |
| Location permissions | Foreground only: the app does **not** request background location, so no background-location declaration is needed |

### 3.5 Data safety form
Data is **encrypted in transit** (HTTPS). Users **can request deletion** of their data through Loomodex support (staff accounts are managed by the company). No data is **sold** or used for **ads**.

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Name | Yes | No | App functionality, account management | Required |
| Email address | Yes | No | Account management | Required |
| Phone number | Yes | No | App functionality (contact during delivery) | Required |
| Precise location | Yes | **Yes**: shown to the logistics team and, during an active delivery, to the customer receiving the order | App functionality (navigation, live delivery tracking) | Required for deliveries |
| Approximate location | Yes | Same as above | App functionality | Required for deliveries |
| Photos | Yes | No | Profile photo | Optional |
| Device or other IDs | Yes (push notification token) | No | App functionality (notifications) | Required |
| App interactions / crash logs | No | — | — | — |

### 3.6 Store listing (Grow → Store presence → Main store listing)
| Asset | Requirement |
|---|---|
| App icon | 512×512 PNG |
| Feature graphic | 1024×500 PNG/JPG |
| Phone screenshots | At least 2, ideally 4–6 (portrait, e.g. 1080×1920 or larger) |
| Tablet screenshots | Optional |
| Category | **Business** |
| Contact email | Loomodex support email (same as the customer app) |
| Website | https://loomodex.com |

Texts are in section 5. Add **English** as a second language using the English texts.

**Countries:** Guinea at minimum. Selecting all countries is also fine, since staff can only sign in with accounts created by Loomodex.

---

## 4. App Store (iOS)

### 4.1 Create the app record
In App Store Connect, go to **Apps → + → New App**:
- Platform: **iOS**
- Name: `Loomodex Drivers`
- Primary language: **French**
- Bundle ID: `com.loomodex.drivers`. If it isn't in the list yet, run the build first (4.2): EAS registers the bundle ID automatically.
- SKU: `loomodex-drivers`
- User access: Full access

### 4.2 Build
```
npx eas-cli build -p ios --profile drivers-production
```
EAS will ask:
- **Log in to Apple account** → Yes, using the same Apple developer account as the customer app.
- **Register bundle identifier / generate a Distribution Certificate / Provisioning Profile** → **Yes**.
- **Set up Push Notifications for this app (generate an Apple Push key)?** → **Yes**. This is what makes driver notifications work on iPhone. No Firebase file is needed on iOS.

### 4.3 Submit
```
npx eas-cli submit -p ios --profile drivers-production --latest
```
It asks for the App Store Connect app. Pick **Loomodex Drivers** (or paste its Apple ID from **App Information**).

### 4.4 iPad
The app is configured with `supportsTablet: true`, so Apple **requires iPad screenshots** (13-inch, 2064×2752). Either:
- provide iPad screenshots (an iPad simulator is fine), or
- ask Fahad to turn iPad support off for the Drivers app before building, so it's iPhone only.

### 4.5 App information and pricing
| Field | Value |
|---|---|
| Category | Primary **Business**, secondary **Navigation** |
| Age rating | Answer **None/No** to everything → **4+** |
| Price | Free |
| Availability | Guinea at minimum (all countries is fine) |
| Privacy policy URL | Same as the customer app |
| Support URL | https://loomodex.com |
| Copyright | `2026 Loomodex` |
| Encryption (export compliance) | Uses only standard HTTPS → **"None of the algorithms mentioned above"** / exempt |

### 4.6 App Privacy (nutrition label)
Data is **not used for tracking** and **not linked to ads**. Data linked to the user:
- **Contact info:** name, email address, phone number. Purpose: App functionality.
- **Location:** precise location and coarse location. Purpose: App functionality.
- **User content:** photos (profile photo only, optional). Purpose: App functionality.
- **Identifiers:** device ID (push token). Purpose: App functionality.

### 4.7 Screenshots
- **iPhone 6.9"** (1320×2868) or **6.7"** (1290×2796): at least 3, up to 10.
- **iPad 13"** (2064×2752), unless iPad is turned off (4.4).

Suggested screens, in this order:
1. Deliveries list with Available on
2. Order with the pickup store card
3. Navigation map with route steps
4. Delivery code (OTP) confirmation
5. Delivery history / earnings summary
6. Logistics dashboard

---

## 5. Store texts

### French (main language)

**Name (30 max):** `Loomodex Drivers`

**Subtitle, iOS (30 max):** `Livraisons Loomodex en Guinée`

**Short description, Play (80 max):**
`L'application des livreurs et de la logistique Loomodex : courses, GPS, suivi.`

**Full description:**
```
Loomodex Drivers est l'application réservée aux livreurs, aux responsables logistiques et aux partenaires logistiques de Loomodex, la marketplace de Guinée.

POUR LES LIVREURS
• Recevez les livraisons qui vous sont attribuées, avec une notification immédiate
• Passez en mode « Disponible » pour que la logistique vous voie
• Retrait au magasin : adresse, repère, logo, appel et WhatsApp du magasin
• Navigation vers le magasin puis vers le client, avec les étapes de l'itinéraire
• Contact du destinataire (appel et WhatsApp)
• Confirmation de la livraison par code client sécurisé
• Historique de vos livraisons et montants encaissés

POUR LA LOGISTIQUE
• Vue de toutes les commandes à livrer
• Attribution des commandes aux livreurs et aux partenaires
• Position des livreurs en temps réel
• Suivi des incidents et de l'historique des actions

Votre compte est créé par Loomodex ou par votre société de livraison. Connectez-vous avec l'adresse e-mail et le mot de passe qui vous ont été communiqués.

Vous êtes client ou vendeur ? Utilisez l'application Loomodex.
```

**Keywords, iOS (100 max):**
`livreur,livraison,loomodex,guinée,conakry,logistique,coursier,colis,gps,commandes`

**Release notes (1.0.0):**
`Première version de Loomodex Drivers, l'application dédiée aux livreurs et à la logistique Loomodex.`

### English

**Subtitle, iOS:** `Loomodex deliveries in Guinea`

**Short description, Play:**
`The Loomodex app for drivers and logistics: deliveries, GPS navigation, tracking.`

**Full description:**
```
Loomodex Drivers is the app for delivery drivers, logistics managers and logistics partners of Loomodex, the marketplace of Guinea.

FOR DRIVERS
• Receive the deliveries assigned to you, with an instant notification
• Switch to "Available" so logistics can see you
• Store pickup: address, landmark, store logo, call and WhatsApp the store
• Navigation to the store, then to the customer, with route steps
• Contact the recipient (call and WhatsApp)
• Confirm each delivery with the customer's secure code
• History of your deliveries and cash collected

FOR LOGISTICS
• See every order waiting for delivery
• Assign orders to drivers and partners
• Drivers' live positions
• Incidents and action history

Your account is created by Loomodex or by your delivery company. Sign in with the email and password you were given.

Are you a customer or a seller? Use the Loomodex app.
```

**Keywords, iOS:**
`driver,delivery,courier,loomodex,guinea,conakry,logistics,parcel,gps,orders`

**Release notes (1.0.0):**
`First release of Loomodex Drivers, the app for Loomodex drivers and logistics.`

---

## 6. Notes for the reviewers (paste into Play "App access" and App Store "App Review Information")

```
Loomodex Drivers is the companion app for the delivery staff of Loomodex (loomodex.com), a marketplace in Guinea. Customers use our separate app "Loomodex".

Accounts are created by Loomodex for its drivers and logistics staff; there is no public sign-up, so no in-app account creation or deletion is offered (staff accounts are managed by the company; users can ask support to delete their data).

To review:
1. Sign in with the driver account below.
2. The Deliveries screen opens. Switch "Available" on/off.
3. Open an assigned order to see the pickup store, navigation and the delivery-code confirmation.
4. Location is used only while the app is open, to guide the driver and to show the delivery's live position to the logistics team and to the customer receiving the order.

Driver account: <email> / <password>
Logistics manager account (optional): <email> / <password>
```

---

## 7. Review accounts (Fahad provides)

- **Driver test account**, with at least one test order assigned to it so the reviewer sees content.
- **Logistics manager test account** (optional, recommended).
- The accounts must keep working during the whole review. Don't change their passwords.

---

## 8. Possible review issues and what to do

| Issue | What to do |
|---|---|
| **Apple: "app is for a limited audience / employees only"** (Guideline 3.2) | Reply that the app is used by independent drivers and partner delivery companies, not only employees. If Apple insists, request **Unlisted App Distribution** (App Store Connect → Request unlisted distribution): the app stays on the App Store and is reachable by direct link. |
| **Apple: login required / no demo** | Check the review accounts work and have an assigned order. |
| **Apple: location purpose string** | Already set: "Loomodex Drivers utilise votre position pendant les livraisons…" |
| **Google: closed test required** | See the note in 3.3 (12 testers, 14 days). |
| **Google: app access rejected** | Same as Apple: give a working driver account with instructions. |
| **Push notifications not arriving (iOS)** | Run `npx eas-cli credentials -p ios`, check a Push Key is assigned to `com.loomodex.drivers`, then rebuild. |

---

## 9. After both stores approve the app

Tell Fahad. He will then:
1. remove the driver and logistics roles from the customer app (set `STAFF_IN_CUSTOMER_APP = false` in `src/appVariant.ts`);
2. publish a customer app update, so drivers and logistics staff only use Loomodex Drivers.

Do **not** make that change before Loomodex Drivers is live on **both** stores, or drivers will be left without an app.

---

## Quick command reference

| Task | Command |
|---|---|
| Android build (Drivers) | `npx eas-cli build -p android --profile drivers-production` |
| iOS build (Drivers) | `npx eas-cli build -p ios --profile drivers-production` |
| iOS submit | `npx eas-cli submit -p ios --profile drivers-production --latest` |
| Android submit (from the 2nd release on) | `npx eas-cli submit -p android --profile drivers-production --latest` |
| Test APK (not for the store) | `npx eas-cli build -p android --profile drivers-preview` |
