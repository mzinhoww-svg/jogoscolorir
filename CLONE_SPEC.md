# CLONE_SPEC — "Jogos de colorir infantil" (Bimi Boo Kids Drawing)

Package: `com.bimiboo.kids.drawing` · Developer: Bimi Boo Kids Learning Games for Toddlers FZ-LLC

## 0. Read this first: evidence level

**No binary analysis was performed.** The session had no APK/XAPK, no traffic capture
(pcap/HAR), no device/emulator and no RE tooling (`apktool`, `jadx`, `adb`, `mitmproxy`, Ghidra
were all absent; repo was empty). The only evidence collected is the **public Google Play
listing** (fetched 2026-10-20) and its **Data Safety page**.

Consequences:
- Everything below is cited to a listing source (`[L:…]`) or marked **UNKNOWN**.
- There are **no function names, addresses, strings from the binary, or captured requests** in
  this document, because none were observed. None were invented.
- Sections 5–9 (formats, protocols, persistence, error behavior, edge cases) are almost entirely
  UNKNOWN. §11 lists the exact work needed to fill them.

Evidence tags:
| Tag | Source |
|---|---|
| `[L:desc]` | Store long description (pt-BR), https://play.google.com/store/apps/details?id=com.bimiboo.kids.drawing&hl=pt_BR |
| `[L:meta]` | JSON-LD / page metadata on same page (name, category, rating, content rating, price) |
| `[L:ds]` | Data Safety page, https://play.google.com/store/apps/datasafety?id=com.bimiboo.kids.drawing&hl=pt_BR |
| `[UNKNOWN]` | Not observable from public listing; needs binary/dynamic analysis |

## 1. Product summary
A free-to-install, offline-capable drawing and colouring app for children (listing says 2–6;
short blurb says "a partir de 2 anos"), positioned as ad-free and kid-safe.
- Name (pt-BR): "Jogos de colorir infantil" `[L:meta]`; English name in body: "Bimi Boo Kids Drawing" `[L:desc]`.
- Category: `GAME_EDUCATIONAL`; content rating "Todos"; price 0 USD; Android only `[L:meta]`.
- Store stats at fetch time: ~4.18★ from 24,803 ratings; 1,000,000+ installs; listing updated 2026-10-07 `[L:meta]`.
- Has in-app purchases ("Compras no Jogo") and auto-renewing subscriptions `[L:meta][L:desc]`.

## 2. Features (user-visible)

| ID | Requirement | Evidence | Confidence |
|---|---|---|---|
| F1 | **Guided drawing**: child picks an image and draws it by tracing **dotted/dashed guide lines** ("decalques pontilhados", "linhas tracejadas"). | `[L:desc]` ¶2–3, feature bullet 2 | Listing-stated; mechanics UNKNOWN |
| F2 | **Animated figures** with cute animations and sound effects accompany drawing. | `[L:desc]` bullet 1 | Stated; trigger points UNKNOWN |
| F3 | **Colouring book** with pages grouped by topic, incl. animals, dinosaurs, cars, ocean "e muito mais". | `[L:desc]` bullet 3 | Stated; full category list/page count UNKNOWN |
| F4 | **Colour palette** ("várias cores") and a **large variety of paint tools**. | `[L:desc]` bullet 4 | Stated; exact tools/colours UNKNOWN |
| F5 | **Creative modes**: (a) colour outlines, (b) free sketch, (c) kaleidoscope **mirror effects**, (d) **neon-glitter magic**, (e) "more" + future surprises. | `[L:desc]` bullet 5 | Stated; per-mode behavior UNKNOWN |
| F6 | **Ad-free, no external links** in the child-facing experience. | `[L:desc]` ¶2, bullet 6 | Stated; see conflict C1 |
| F7 | **Works offline.** | `[L:desc]` bullet 7 | Stated; which content is bundled vs downloaded UNKNOWN |
| F8 | Some animated images are **free**; implies a free/paid content split. | `[L:desc]` bullet 8 | Inferred; split rules UNKNOWN |
| F9 | **Subscriptions**: two plans, monthly and annual ("Mental e Anual" in listing is a typo for *Mensal*). Auto-renew unless cancelled ≥24 h before period end; managed via Google Play account settings. | `[L:desc]` "Detalhes da inscrição" | Stated; prices, trial, SKU IDs UNKNOWN |
| F10 | Educational claims: content "developed by pre-school education experts"; goals = learn drawing/colouring, self-expression, imagination, fine motor skills. | `[L:desc]` ¶2, closing list | Marketing claim; no functional requirement |
| F11 | Links to Privacy Policy and Terms of Use (bimiboo.net). | `[L:desc]` footer | Stated; in-app placement UNKNOWN |

### Not stated in the listing (do not assume)
Save/export/share, gallery of finished work, undo/redo, eraser, brush size, stamps/stickers,
multi-profile, parental gate, sound/music toggle, language selection, rewarded content,
notifications, cloud sync, account/login. All **UNKNOWN**.

## 3. Screens and state machine

**UNKNOWN in detail.** The listing supports only this *inferred* skeleton (not observed):

```
Launch → [Home / mode & topic picker?] → Topic list → Image picker
       → Canvas (mode ∈ {trace-with-dots, colour-outline, free-sketch, mirror, neon-glitter})
       → (finish animation?) → back to picker
Any locked content → Paywall (monthly | annual) → Google Play Billing → unlock
```
Open questions to resolve by dynamic analysis: entry screen, whether a parental gate guards the
paywall/settings/external links, how tracing "success" is detected and what feedback is given,
whether progress/artworks persist, back-button and app-backgrounding behavior, orientation support.

## 4. Inputs / outputs
- Input: touch/stylus drawing on canvas `[L:desc]` (touch implied; multitouch, palm rejection UNKNOWN).
- Output: on-screen artwork, animations, sound effects `[L:desc]`. Persisted/exported artwork: **UNKNOWN**.

## 5. File formats / assets
**UNKNOWN.** Not observable from the listing. To determine: image/outline format (vector vs.
raster), animation format (sprite sheets / Lottie / Spine / frame sequences), audio codec,
bundled vs. remote delivery (Play Asset Delivery / OBB / CDN). Clone should use **original
artwork and audio**; do not extract or reuse the app's assets.

## 6. Network protocols
**UNKNOWN.** The app is stated to work offline `[L:desc]`. The Data Safety form says data is
**encrypted in transit** `[L:ds]`, so at least analytics/diagnostics/billing traffic exists.
Expected (unverified) endpoints: Google Play Billing (on-device API, not an HTTP protocol you
implement), an analytics/crash SDK, possibly an ad/attribution SDK (see C1). No hosts, paths,
payloads or captured requests were observed.

## 7. Settings and persistence layout
**UNKNOWN.** Nothing in the listing describes settings or storage. Any clone needs its own
design for: subscription entitlement cache, last-used mode/colour, saved artworks (if any),
sound toggle (if any).

## 8. Monetization and entitlement
- Free install, IAP + 2 auto-renewing subscriptions (monthly, annual) `[L:meta][L:desc]`.
- Standard Play subscription terms are stated in-listing (auto-renew, 24 h cancel window, manage in account settings) `[L:desc]`.
- Required for a compliant clone (standard, not evidence of this app's behavior): Play Billing
  Library, server- or client-side entitlement verification, restore purchases, and — because the
  app is in the Designed-for-Families programme (see §10) — a parental gate in front of purchase flows.
- Free vs paid content split, prices, trial length, SKU IDs, whether one-time IAPs exist alongside subscriptions: **UNKNOWN**.

## 9. Error behavior and edge cases
**UNKNOWN** (no runtime observation). Candidates to test: offline first launch, billing
unavailable/cancelled/pending purchase, subscription expiry mid-session, app backgrounded while
drawing, rotation, low memory, very fast/multi-finger input, tracing outside the dotted guide.

## 10. Privacy / compliance facts (from Data Safety) `[L:ds]`
- **Shared with other orgs**: Device or other IDs (purposes: *Analytics*, *Advertising or marketing*);
  Crash logs and Diagnostics (*Analytics*).
- **Collected**: App interactions (*Analytics*); Device or other IDs (*Analytics*, *Advertising or marketing*);
  Crash logs and Diagnostics (*Analytics*).
- Data encrypted in transit; developer commits to **Google Play Families Policy**.
- Implication for a clone: if it targets children, follow Families Policy / COPPA / LGPD
  (Brazil) rules; avoid advertising IDs, third-party ad SDKs, and external links.

## 11. Conflicts and open questions
- **C1 — "no ads" vs. advertising-purpose data sharing.** Listing says no ads and no external
  links `[L:desc]`, but Data Safety lists device IDs shared for *Advertising or marketing* `[L:ds]`.
  Possible explanations (all UNVERIFIED): attribution/UA SDK, marketing analytics, form
  over-declaration. Resolve via SDK inventory + traffic capture. A clone should not copy this.
- **C2 — Age range.** Short blurb says "from 2 years" `[L:meta]`; long text says 2–6 `[L:desc]`.
- **C3 — Store description for other Bimi Boo products** appears elsewhere on the same page
  (a "30 pre-K activities" text). It belongs to a different app (similar-apps section) and was
  **excluded** from this spec.

## 12. Plan to turn UNKNOWN into evidence (REA proper)
Needs inputs I did not have. With an APK/XAPK of the Play build (obtain it yourself from your
own device/account; the sandbox cannot and should not fetch mirrors), do, in order:
1. **Static triage**: `apktool d`, `aapt dump badging` → permissions, activities, services,
   min/target SDK, SDK inventory (look for `com.google.android.gms`, billing, Firebase, Adjust/AppsFlyer/etc.). Maps to §6, §8, C1.
2. **Screen inventory**: manifest `<activity>` list + layout/scene files; jadx for navigation
   logic → state machine (§3).
3. **Asset/format survey** (metadata only — types, sizes, containers; do not reuse content) → §5.
4. **Dynamic**: run on emulator/device with `mitmproxy` (system CA or Frida pinning bypass if
   needed) cold-start, offline, purchase-flow, and each mode; record every host/path/payload → §6, §9.
5. **Persistence**: `adb shell run-as` / rooted `/data/data/<pkg>/{shared_prefs,databases,files}` diff before/after each action → §7.
6. Screen-record each mode for behavioral (not asset) description of F1, F2, F5.
Each finding must be added to this file with the function/class, offset, string or request ID
as evidence, replacing the corresponding UNKNOWN.

## 13. Legal note
Clean-room means the implementer sees only this spec. Trademarks ("Bimi Boo"), character
designs, artwork, sounds and the app name must not be reused. Check the app's Terms of Use
(https://bimiboo.net/terms-of-use/) and local law on reverse engineering before steps 1–5 in §12.
