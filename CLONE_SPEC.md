# CLONE_SPEC — Bimi Boo "Coloring" (`com.bimiboo.coloring` v1.116, code 746)

## 0. Scope, identity and evidence level

**Identity discrepancy (important).** The APK supplied (`apk/coloring-1-116.apk`) is package
`com.bimiboo.coloring`, label "Coloring" `[X]`. The Play URL given originally is
`com.bimiboo.kids.drawing` ("Jogos de colorir infantil" / "Bimi Boo Kids Drawing"). These are
**different products**. Listing-only claims (dotted-line tracing, mirror/kaleidoscope, neon-glitter,
free sketch, subscriptions) have **no evidence in this APK** and are kept only in Appendix A.
This spec describes the **APK**. If you want a clone of `kids.drawing`, supply that APK.

**Method.** Static analysis only: APK unzip, manifest parse (androguard), Addressables catalog,
and a parse of IL2CPP `global-metadata.dat` (type/field/method names + 14,473 string literals).
**Not done:** native disassembly of `libil2cpp.so` (so **no RVAs/addresses**), no dynamic run, no
traffic capture, no device storage inspection. Method *bodies* are therefore not observed:
behavior is **inferred from names/fields** and tagged INFERRED. Anything else is UNKNOWN.

Evidence tags
| Tag | Source |
|---|---|
| `[X]` | `AndroidManifest.xml` / `*.properties` in APK |
| `[M:Type.member]` | IL2CPP metadata, `assets/bin/Data/Managed/Metadata/global-metadata.dat`, assembly `Assembly-CSharp` unless noted |
| `[S:"literal"]` | String literal from same metadata |
| `[C:key]` | `assets/aa/catalog.json` / `settings.json` (Unity Addressables 1.19.19) |
| `[L]` | Play listing of the *other* package (Appendix A) |
| INFERRED | Deduced from names/fields, body not read |
| UNKNOWN | Not determinable with work done |

## 1. Technology
- Unity (IL2CPP, arm64-v8a + armeabi-v7a), `libunity.so`, `libil2cpp.so` `[APK lib/]`; min SDK 22, target 33 `[X]`.
- Libraries seen as assemblies `[M images]`: PaintIn3D (painting), CW.Common, Spine-Unity (intro/animations), DOTween, I2 Localization, TextMeshPro, Unity IAP (`UnityEngine.Purchasing*`), Unity Addressables, Firebase (App/Analytics/Crashlytics), Unity Notifications (Android), Google Play Core/Review, Unity Services Core, EazySoundManager (`Hellmade.Sound`), IngameDebugConsole, Newtonsoft.Json.
- Billing client 5.2.1, review client 2.0.0 `[X billing.properties, review.properties]`.
- Clone is free to choose any engine; the above only explains the behavior model.

## 2. Scenes and navigation (state machine)
Scenes `[C:Scenes/*]`, enum `AllScenes {IntroScene, MainMenu, GalleryMenu, ColoringPage}` `[M:AllScenes]`; extra `PreloadScene`, `EmptyScene`, `ForParents` (`BBToolkitAppIntegration/ForParents/Scenes/ForParents`) `[C]`.

```
PreloadScene → IntroScene (Spine intro anim + 11 audio clips [C:intro-animation/*])
   → MainMenu ⇄ Settings (SettingsController) ⇄ ForParents (parental-gated) ⇄ Shelf (cross-promo, parental-gated)
   → GalleryMenu (topic packs; swipe/arrows)  → ColoringPage (paint) → Save → GalleryMenu
Locked pack/tool/palette → IAP panel → purchase / restore
```
- `DataManager` holds `previousScene`, `nextScene`, `selectedColoringBoardName` `[M:DataManager]`; scene loading is async with a loader `[M:GalleryMenu.AsyncLoadScene, DataManager.<LoadNextScene>]`.
- `QuitGamePopup` + `EscapeButtonClickHandler` handle Android Back/exit confirmation (`Bimiboo.unity_utils.*`) `[M]`.
- Manifest orientation value `11` (= `userLandscape`) `[X]`; code also has `Orientation {Horizontal, Vertical}` and "VerticalPhone" shelf variants `[M:Orientation, MenuItems.ShowShelfMenuForVerticalPhone]` → **actual orientation behavior UNKNOWN** (manifest says landscape; code suggests portrait handling).

## 3. Features

### 3.1 Content
- **9 themed packs** `[M:IAPProductTypes]` / `[C:Prefabs/<theme>]`: animals, underwater, dinosaurs, alien, transport, princess, robots, christmas, fairytale.
- Each pack has **15 colouring pages** (`Prefabs/<theme>/0…14`) plus a `Gallery` prefab and `LoadStrokes` prefab `[C]` → **135 pages**.
- Gallery shows topics with left/right navigation and scroll sound `[M:GalleryMenu.{topics,buttonLeft,buttonRight}][C:sounds/gallery-scroll-short]`; `CheckForPurchasedPacks`, `RemoveLockedGames` `[M:GalleryMenu]` → locked packs are marked/removed per purchase state (INFERRED).
- Which pack(s) are free: **UNKNOWN** (no `com.bimiboo.coloring.pack1` product ID exists, so one pack is probably free — INFERRED).

### 3.2 Painting (ColoringPage scene)
- Tools `BrushTypes {Marker, Pencil, Brush, Bucket(fill), Spray, Shine, Pattern}` `[M:BrushTypes]`.
- Palettes `PaletteTypes {Color, Shine, Pattern}`; palette content/slots, scroll-drag, lock state per palette `[M:PaletteTypes, PaletteController, PaletteLock, ToolsManager.{paletteColors,paletteShines,drawPatterns,tileScale}]`. Patterns have scalable tiles (`ChangePatternTileScale`) `[M]`.
- Layers: foreground/background and `LayerSelection` so fill respects regions `[M:ColoringPage.{_back,_frontground,layersSelection}]` (INFERRED mechanism).
- Actions: **Undo** (`Paintable.Undo`, `btnUndo`), **Clear all/trash** (`btnTrash`, `_p3DButtonClearAll`), **Save** (`OnButtonSave`), back `[M:ColoringPage, Paintable]`. Separate phone/tablet button sets and tool panels `[M:ToolsManager.*ForTablet, ColoringPage._buttonsTablet]`.
- Particle/shine effects and click/color/fill sounds `[M:ParticleEffectManager, DisplayParticles][C:sounds/{click,color,fill,game-particle}]`.
- Exact brush sizes, colour values, stroke textures count, undo depth: **UNKNOWN**.

### 3.3 Saving / gallery of artwork
- `SaveImage.OnSave` → camera capture → `CopyPaintedTextureToEmptyTexture` → `ConvertTextureToPNG`; writes to `path`; also an icon texture and a main-menu texture `[M:SaveImage.*]`. Result: **PNG**. Saved image appears as icon in gallery/main menu (`LoadIcons`, `GetCache`, `LoadImage`, `UpdateIcons`) `[M]`.
- Save location (`Application.persistentDataPath` vs shared storage), filename scheme, resolution: **UNKNOWN**. No storage permission in manifest `[X]` → app-private storage (INFERRED).
- No share/export feature found: no Share/FileProvider/`ACTION_SEND` symbols surfaced (not exhaustively searched) → treat as absent.

### 3.4 Settings (`SettingsController`)
Restore purchases, background-music toggle (`bgMusicButtonSwitcher`), **language picker** (`languageContent`, `OnChooseLangOptionChosen`), back; settings opened via `OpenSettings` `[M:SettingsController]`.
- Languages: I2 Localization with **~43 distinct languages** in catalog (Arabic, Bulgarian, Catalan, Chinese ×3, Croatian, Czech, Danish, Dutch, English, Estonian, Filipino, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Latvian, Lithuanian, Malay, Norwegian, Polish, Portuguese + Portuguese (Brazil), Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swedish, Thai, Turkish, Ukrainian, Vietnamese) `[C:<Language>/parental_gate_title, localization/*]`. RTL support code present (`RTLFixer`) `[M:I2.Loc.*]`.
- Default-language selection rule (device locale vs saved): INFERRED device locale; UNKNOWN.

### 3.5 Parental gate
`ParentalGate.Show(onSuccess, onFailure)` → `ParentalGateMath` popup: **math question**, number pad, clear-answer, close/escape, wrong-answer animation, replay-task audio, difficulty setting (`_isDifficultProblem`), A/B-test flag `[M:ParentalGate*, ParentalGateMathUtils.*]`.
Used before: shelf (`ShelfCanvasController.OnParentalGateFailed`), For-Parents area, external links (`OpenURL`, `LinkOpenerOld`), IAP/restore (INFERRED for IAP; **UNKNOWN** which entry points exactly).
Question range/difficulty rules: UNKNOWN.

### 3.6 For Parents area
`ForParentsController` (phone vertical canvas / tablet horizontal canvas, `DownloadMenu/DownloadBody`), `ParentalPageMenu`, `MenuItems`, `CollapsableMenu`, `OpenUrlByPlatform` `[M]`; scene loaded via the BBToolkit integration `[C:BBToolkitAppIntegration/ForParents/Scenes/ForParents]`. Contents (links to policy/support/other apps): UNKNOWN.

### 3.7 Shelf (cross-promotion)
- `ShelfCanvasController` (`TryShowShelf`, `CheckForShelf`, badge, timer, `ShowShelf/HideShelf`, `OnShelfButtonPressed`), `ShelfData`, `ShelfScene`, `ShelfLocals` `[M]`.
- Remote: `https://shelf.bimiboo.net/shelf/v3/` + `/shelf/` + `.json` `[S]`; metadata JSON URL and cached file path (`GetShelfFilePath(GetFileNameFromUrl(_metadataJsonfUrl))`) `[S]`; `CanOpenApplication ... IS installed/NOT installed` `[S]` → checks whether promoted apps are installed. Icons `images/shelf_icons` `[C]`.
- JSON schema, polling interval, badge rules, request params: **UNKNOWN** (needs capture).

### 3.8 Calendar (CalendarController)
Month/year navigation grid, date click `[M:CalendarController]`, canvas `CalendarCanvas` `[C]`. Purpose (probably a parent-facing date picker for notification time or a "daily" feature): **UNKNOWN**. `MobileDateTimePicker`/`ShowTimePicker` strings exist `[S]` (likely notification time).

### 3.9 Notifications
Local notifications via Unity Mobile Notifications: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, restart receiver `[X]`; `NotificationSettings {days,hours,minuts,seconds}`, localized texts `NewNotificationLocalizedTexts`, `NotificationLocalizedTexts` `[M]`. Schedule values and texts: UNKNOWN.

### 3.10 Rate-us
Play In-App Review (`Google.Play.Review`, review client 2.0.0) `[X]`; prefs `RateUsDialogue_Rated`, `RateUsDialogue_Score`, `RateUsDialoguePreferencesKey_LastShownTime` `[S]`; `RateUsLocalization` `[M]`. Trigger rule: UNKNOWN.

### 3.11 Misc
Audio: background menu melody, UI sounds; `PersistantAudioManager`; EazySoundManager `[M][C:sounds/*]`. Safe-area handling (`SafeAreaImage`, `androidRenderOutsideSafeArea=1`, notch support) `[M][boot.config][X]`. Fullscreen `androidStartInFullscreen=1` `[boot.config]`. `DeviceRAM`/`CustomGarbageCollector`/`UnloadResourcesOnLoad` memory management `[M]`. Debug console assembly present (`IngameDebugConsole`) — likely disabled in release; UNKNOWN.

## 4. Monetization (Google Play Billing via Unity IAP)
- Product IDs `[S]`: `com.bimiboo.coloring.fullver`, `.tools`, `.pack2` … `.pack8`, `.fairytales`.
- Enum `IAPProductTypes {Animals, Underwater, Dinosaurs, Alien, Transport, Princess, Robots, Christmas, Fairytale, Fullversion, Palette, Null}`, `TypeProduct {Full, Pack, Tools}` `[M]`.
  → Three kinds: **Full version** (all packs), **single theme pack**, **Tools** (palette/brush unlock). All **non-consumable** (`iAPNonConsumable`, `IsProductPurchased`, `PurchasedFullVersion`) `[M:InAppPurchaseManager]`.
- Mapping from pack names to `pack2…pack8`/`fairytales` (9 packs vs 8 IDs → 1 free or differently named): UNKNOWN.
- UI: `PurchasePanel`, `IAPMainMenuPanel`, `IAPToolsPanel`, `IAPButtonsAnimation`, `OpenBuyMenu`, `RestoreButton`; prices fetched from store (`SetPrices`, `GetFullVersionPrice`, `GetCurrentPackPrice`, `GetToolsPrice`), **sale percentage** computed (`GetSalePercentage`, `GetNumbersFromString` parses price text) and locked-pack count shown `[M:InAppPurchaseManager]`.
- Restore: `OnRestoreButtonPressed/OnRestoreProcessFinished`; `HasPurchase` pref; "no restore" hides loading `[M:SettingsController, S:"HasPurchase"]`.
- Subscriptions: **none observed** in this APK.
- Prices/currencies: from Play (not in APK). Local entitlement store: UNKNOWN (PlayerPrefs likely).

## 5. Network
| Endpoint | Purpose | Evidence | Unknown |
|---|---|---|---|
| `https://cdn.bimiboo.net/` | Remote AssetBundles: `AssetBundleManager` (`url`, `CheckForChanges`, `OnRequestCompleted`, `DownloadBundle`, `IsBundleDownloaded`, `LoadAssetBundle`, `AddCacheAtPath`), `BundlesController`, `ClearCache`; strings `.bundle`, `.hash`, "Failed to load AssetBundle!" | `[S][M:AssetBundleManager]` | URL path layout, which content is remote, hash scheme |
| `https://shelf.bimiboo.net/shelf/v3/` | Cross-promo shelf JSON + icons | `[S]` | schema |
| Firebase Analytics/Crashlytics/Installations | Telemetry | `[X firebase-*.properties][M:FirebaseSetup]` | event names/params |
| Unity Services (`operate-sdk-telemetry.unity3d.com`, Core) | Telemetry | `[S]` | — |
| Google Play Billing / Play Review / Install Referrer | Store | `[X]` permissions | — |
- `Addressables` main catalog is **local** (`catalog.json` in APK; `m_DisableCatalogUpdateOnStart=false`, no http ids inside) `[C settings.json]`; whether a remote catalog update happens: UNKNOWN. Core UI/prefabs (all 9 packs' page prefabs) are **inside the APK** (catalog internal IDs, APK 135 MB) → the app is **offline-capable for packs**; what the CDN bundles contain: UNKNOWN.
- Protocol: HTTPS via UnityWebRequest (`UnityEngine.UnityWebRequestModule`) `[M images]`. Auth: none observed. Payloads: UNKNOWN.
- Ad/measurement privacy flags: `google_analytics_adid_collection_enabled=false`, `ssaid_collection=false`, `default_allow_ad_personalization_signals=false` `[X meta-data]`. **No ad SDK found** (no AdMob/IronSource assemblies; no `AD_ID` permission) — consistent with "no ads".

## 6. Persistence layout (partial)
Evidence of keys/stores (all INFERRED to be Unity PlayerPrefs unless noted):
`HasPurchase`, `RateUsDialogue_Rated`, `RateUsDialogue_Score`, `RateUsDialoguePreferencesKey_LastShownTime`, `Music`, I2 `I2Languages`/`LangSource_`/`LastGoogleUpdate_`, EazySoundManager prefs `[S]`.
- Saved artwork: PNG on disk + icons cache (`GetCache`) `[M:SaveImage, LoadImage]`; path UNKNOWN.
- Asset bundle cache via Unity Caching (`AddCacheAtPath`, `ClearCache`) `[M]`.
- Exact keys, per-page progress storage (is an unfinished painting persisted? `LoadStrokes`, `Paintable` hint at stroke textures but not state saving): **UNKNOWN**.

## 7. Error behavior / edge cases
Observed only as strings/methods (behavior UNKNOWN): IAP init failure (`OnIAPInitializeFailed`), IAP request completed/failed (`OnIAPRequestCompleted`), restore finished/no purchase (`HideLoadingIfNoRestore`), bundle load failure ("Failed to load AssetBundle!", "Catalog bundle path is null."), "Bundle cache is already being cleaned.", parental gate wrong answer (animation + new task `ShowTaskAgain`), parental gate failed callback (`OnParentalGateFailed`), Firebase readiness (`firebaseReady`, "Firebase is ready for use."). User-facing messages: UNKNOWN.
Not tested: offline first launch with remote content, low memory, rotation, backgrounding mid-paint, purchase pending/deferred (`onProductPurchaseDeferred` string exists `[S]`).

## 8. Implementation guidance for the clone
- Reimplement with **original art/audio** and original names; do not reuse `Prefabs/*`, `images/*`, `sounds/*`, Spine intro, brand "Bimi Boo".
- Minimum feature set: 3 scenes (menu, gallery, canvas), 9 themed outline sets × 15 pages (or fewer), 7 tools + 3 palette types, undo/clear/save-PNG, parental gate before purchases/links/external promos, settings (music, language, restore), non-consumable IAP (full/pack/tools), local notifications, rate-us.
- Keep child-safety posture: no ad SDK, ad-ID/personalization collection off, parental gate for external navigation (Families policy).

## 9. Remaining UNKNOWNs → how to close them
1. **Dynamic run + mitmproxy** (emulator/device): capture `cdn.bimiboo.net` and `shelf.bimiboo.net` requests (paths, JSON), Firebase event names. Closes §5.
2. **Device storage diff** (`adb shell run-as com.bimiboo.coloring`): `shared_prefs/`, `files/`, saved PNG path. Closes §3.3, §6.
3. **Disassemble `libil2cpp.so`** with Il2CppDumper/Ghidra to read bodies (free-pack logic, parental-gate triggers, notification schedule, rate-us rule) and attach **RVAs** to claims. Closes §3, §4, §7.
4. **Screen recordings** of every scene for layout/interaction description (behavioral only).
5. Decide whether the true target is `com.bimiboo.kids.drawing`; if so, obtain that APK.

## 10. Legal note
Clean-room: implementer must see only this spec. Do not reuse trademarks, characters, artwork, audio, localization strings or the supplied APK. Check the app's Terms of Use (https://bimiboo.net/terms-of-use/) and local law on reverse engineering.

---

## Appendix A — Listing of `com.bimiboo.kids.drawing` (NOT this APK)
Source: Play page + Data Safety fetched 2026-10-20. Category GAME_EDUCATIONAL, rating "Todos", 4.18★/24.8k, 1M+ installs `[L]`.
Claims `[L:desc]`: guided drawing by dotted-line tracing; animated figures + sounds; colouring book (animals, dinosaurs, cars, ocean…); many colours/tools; modes: colour outlines, free sketch, kaleidoscope mirror, neon-glitter; no ads/external links; offline; some free images; monthly + annual auto-renewing subscriptions.
Data Safety `[L:ds]`: device IDs shared for Analytics + Advertising/marketing; crash logs/diagnostics; app interactions; encrypted in transit; Families policy.
Conflict: "no ads" vs advertising-purpose sharing — unresolved. None of these features were found in `com.bimiboo.coloring`.
