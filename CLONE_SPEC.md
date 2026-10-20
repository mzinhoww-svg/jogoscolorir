# CLONE_SPEC — Bimi Boo "Coloring" (`com.bimiboo.coloring` v1.116, code 746)

## 0. Scope, identity, method, evidence tags

**Identity.** The supplied APK (`apk/coloring-1-116.apk`) is `com.bimiboo.coloring`, label "Coloring" `[X]`.
The Play URL originally given is a *different* product, `com.bimiboo.kids.drawing`
("Jogos de colorir infantil"). Listing-only claims for that product (dotted-line tracing,
mirror/kaleidoscope, neon-glitter, subscriptions) are **not present in this APK** and live in Appendix A.
(A second file supplied, `uptodown-com.bimiboo.drawing.apk`, was the Uptodown store client, `com.uptodown`; not analysed.)

**Method (what was actually done).**
1. APK unzip + manifest (androguard).
2. Unity IL2CPP `global-metadata.dat` (v29) parsed: types, fields, methods, 14,473 string literals.
3. `libil2cpp.so` (arm64-v8a) loaded; relocations applied; `Il2CppCodeGenModule` for `Assembly-CSharp` located
   (module struct @ VA `0x28fa3e8`, 4093 method pointers @ `0x2aec498`); `MetadataRegistration` located (`0x28c8940`: 27,511 types,
   62,685 method specs); all 87 assemblies' method tokens mapped to code addresses (60,349 named functions).
4. Methods **disassembled with capstone**; global metadata slots resolved to type/method/string; call targets named.
5. Serialized Unity scenes (`data.unity3d`) scanned with UnityPy for embedded strings/ints.

**Not done:** no execution, no traffic capture, no device storage inspection. Therefore: runtime payloads, HTTP
response bodies, localized UI strings and numeric values stored only in scene/prefab data are **UNKNOWN** unless stated.
Reproduction scripts and the raw method→strings/calls dump are in `re/` (see `re/README.md`). **Implementers doing a
strict clean-room must not read `re/`; it is analysis evidence, not specification.**

**Evidence tags**
| Tag | Meaning |
|---|---|
| `[X]` | `AndroidManifest.xml` / `*.properties` |
| `[fn Type.Method @VA]` | Method disassembled in `libil2cpp.so` arm64; VA = virtual address (== file offset base 0) |
| `[M:…]` | Metadata name only (type/field/method exists) |
| `[S:"…"]` | String literal referenced by code |
| `[C:…]` | `assets/aa/catalog.json` |
| `[D:…]` | Value read from serialized scene data |
| INFERRED | Deduced from the disassembly shape; body partially read |
| UNKNOWN | Not determined |

## 1. Technology
Unity IL2CPP; min SDK 22, target 33; arm64-v8a + armeabi-v7a `[X][APK lib/]`. Libraries (assemblies in metadata): PaintIn3D
(painting), Spine-Unity, DOTween, I2 Localization, Unity IAP, Addressables 1.19.19, Firebase App/Analytics/Crashlytics,
Unity Mobile Notifications, Google Play Core/Review, EazySoundManager, SimpleScrollSnap (gallery paging), Newtonsoft.Json.
Billing client 5.2.1, review client 2.0.0 `[X]`. A clone may use any engine; this is only to explain the behavior model.

## 2. Scenes and navigation
Scenes: `PreloadScene → IntroScene → MainMenu ⇄ GalleryMenu → ColoringPage`, plus `EmptyScene`, `ForParents` `[C Scenes/*]`;
enum `AllScenes` `[M]`. `IntroSceneColoring.StartGame` writes the selected product type to prefs (key `SelectedProductType`, lower-cased enum
name) and saves `[fn IntroSceneColoring.StartGame @0xcd0f78]`; `MainMenuScroll.InitializeScroll` reads the same key to restore the last
selected pack on the main-menu carousel `[fn @0x1df9bc4]`. `DataManager.set_SelectedProductType` does the same set+save `[fn @0xcc5640]`.
Android Back → quit-confirm popup (`QuitGamePopup`, `EscapeButtonClickHandler`) `[M]`.
Orientation: manifest `screenOrientation=11` (`userLandscape`) `[X]`, but `InitialSettings.SetAppOrientation` toggles
`Screen.autorotateToLandscapeLeft/Right/Portrait/PortraitUpsideDown` at runtime from a flag `[fn @0x1c755e8]`; the selecting condition (device type?) is
**UNKNOWN**. `ForParentsSettings.ApplyOrientation/ResetOrientation` change it for the For-Parents area `[M]`.

## 3. Features

### 3.1 Content and delivery  *(corrects earlier draft)*
- 9 packs (`IAPProductTypes`: Animals, Underwater, Dinosaurs, Alien, Transport, Princess, Robots, Christmas, Fairytale) `[M]`; catalog lists `Prefabs/<theme>/0…14` + `Gallery` + `LoadStrokes` per theme → 15 pages/theme `[C]`.
- **Animals is the free/bundled pack.** `LoadGalleryContentCor` and `LoadPictureCor` download bundles only when pack ≠ `"Animals"` `[fn <LoadGalleryContentCor>d__37.MoveNext @0x1e356fc, <LoadPictureCor>d__38.MoveNext @0x1e359b4]`; `GetPicture` for Animals uses a local `"animals/"` path `[fn ContentDeliveryController.GetPicture @0x1e34ed4]`.
- **All other packs are delivered as AssetBundles from the CDN** (see §5): per pack `"{pack}_gallery"`, `"{pack}_strokes"`, and one bundle per page `"{pack}_{n}"` (pack = enum name lower-cased) `[fn <DownloadPackCor>d__39.MoveNext @0x1e35bf4; ContentDeliveryController.IsPackDownloaded @0x1e351b0]`. A pack counts as downloaded only if gallery, strokes and page bundles are all present `[fn @0x1e351b0 INFERRED]`. Bundle check = `.bundle` name + `-scene` suffix, checksum compare (`ContentDeliveryData.IsNeedDownload`) and `Caching.IsVersionCached` `[fn ContentDeliveryController.IsBundleDownloaded @0x1e3531c]`; download state JSON saved under `Application.persistentDataPath` `[fn ContentDeliveryData.SaveFullData @0x1e3640c]`.
- Whether non-Animals prefabs *also* ship inside the APK (the catalog lists them under a Resources provider) was **not verified** → UNKNOWN. What triggers `DownloadPack` (on purchase vs on entering the pack) is **UNKNOWN** (no direct caller found; likely scene-wired events).
- Gallery visibility of locked packs: see §4.2.

### 3.2 Painting (ColoringPage)
- Tools `BrushTypes {Marker, Pencil, Brush, Bucket, Spray, Shine, Pattern}`; palettes `PaletteTypes {Color, Shine, Pattern}` `[M]`.
- Colours/patterns/shines locked by the **Tools** product: `Palettes.SetLock @0xcbf804`, `PaletteContent.IsOpenedColor @0xcbe864`, `PaletteController.CheckBrush @0xcbeec4` each reference `"com.bimiboo.coloring.tools"` `[S]`. Which individual colours/brushes are free vs locked: UNKNOWN (scene data).
- Actions: Undo `Paintable.Undo @0xcbd904`; Clear-all (`ColoringPage.OnButtonTrash @0xcbcaf4`, PaintIn3D `P3dButtonClearAll`); Save (`ColoringPage.OnButtonSave @0xcbc8d8`, plays a sound and a DOTween sequence). Phone/tablet button sets `[M]`.
- Undo depth, brush sizes, colour values: UNKNOWN.

### 3.3 Saving artwork `[fn <OnSave>d__14.MoveNext @0x1b87180; SaveImage.SaveCameraView @0x1b86b24]`
Sequence: destroy particles → yield → `RateUs.IncreamentScore(+1)` → `SaveCameraView` (render the paint camera to a `RenderTexture` of size `Screen.width×Screen.height`, `ReadPixels`) → `EncodeToPNG` → `File.WriteAllBytes(path + name + ".png")` → read back, `CommonHelper.Resize` to an icon → `EncodeToPNG` → write `path + name + "-icon.png"` → small delay → `P3dButtonClearAll.ClearAll` (canvas reset) → destroy. So a saved artwork = full-screen PNG + a downsized `-icon.png`; the icon feeds main-menu/gallery thumbnails (`LoadIcons`, `GetCache`) `[M]`.
Base directory and file-name scheme (`path` field) are not literals → **UNKNOWN** (private storage, INFERRED; no storage permission `[X]`). No share/export UI found.

### 3.4 Settings
`SettingsController`: restore purchases (`OnRestoreButtonPressed @0x1b8cda4`: shows loading layer, starts `HideLoadingIfNoRestore` coroutine; checks platform), background-music switch, language list `[M]`.
Language: I2 Localization; ≈43 languages in catalog `[C <Language>/…]`. Default language logic `[fn Locale.get_GetShortCode @0x1b8f750]`: uses pref key `"shord-code"` if present, otherwise asks native `MyNativeBindings.GetPrefferedLanguage` and maps `pt-BR`, `zh-Hant`, `zh-Hans`, `fil` (device locale → default; INFERRED).

### 3.5 Parental gate  `[fn ParentalGate.GetInstance @0x1a31900, ParentalGateMath.Show @0x1a39f78, OnMathCompleted @0x1a3a270]`
- Two gate kinds (`ParentalGateType`): **math** (`ParentalGateMath` + `MathController`: generates a task, number pad, clear button, wrong-answer animation → new task, replay-task audio, `SetDifficultyLevel`) and **year entry** (`ParentalGateYear`, cell-by-cell number input, `OnAllCellsFilled`). Kind is chosen through an **A/B test** (`ParentalGate._isParticipatingInABTest`, `PostABTestSuccess @0x1a39140`). Unknown kind → `"[Unknown ParentalGateType]"` `[fn GetInstance]`.
- Callbacks: `Show(onSuccess, onFailure)`; failure for the shelf → `ShelfCanvasController.OnParentalGateFailed` `[M]`.
- **Only statically visible direct caller:** `ShelfCanvasController.OnShelfButtonPressed` `[fn @0x1a317e0]`. The IAP flow (`OnPurchaseButtonPressed`, `OnRestoreButtonPressed`) contains **no** gate call `[fn InAppPurchaseManager.OnPurchaseButtonPressed @0xccfaa0]`. Gates elsewhere (For-Parents links, social links) may be wired in scenes → UNKNOWN. Question ranges / difficulty values: UNKNOWN.

### 3.6 For Parents area
`ParentalMetaRequester` holds `https://cdn.bimiboo.net/apps-parents-page/for-parents/` and requests `metadata.json` under it `[D level7][fn ParentalMetaRequester.Awake @0x1e47698]`. `ParentalPageMenu`, `ShelfForParents` (grid of promoted apps loaded with `LoadAllShelfItems`) `[M]`. Static links found in scenes `[D sharedassets7/level7]`: bimiboo.net/.com `/contact/` and `/apps/`, mailto `info@bimiboo.…`, YouTube channel, Facebook, TikTok, Instagram, Pinterest, Twitter, plus Google Play/Apple parental-control support pages. Remote metadata schema: UNKNOWN.

### 3.7 Shelf (cross-promotion of other Bimi Boo apps)
- Metadata URL = `"https://shelf.bimiboo.net/shelf/v3/"` + *platform* + `"/metadata."` + *language code* + `".json"`; platform = `android | amazon | ios` (Amazon when the IAP store is Amazon); on empty/`"Not Found"`/invalid JSON it retries with `"en"`; failures log and retry `[fn ShelfData.GetShelfUrl @0x1c7edc8, GetCurrentPlatform @0x1c7f17c, OnRequestCompleted @0x1c7f258, <DownloadMetaJson>d__28.MoveNext @0x1c82558]`.
- Cache: metadata JSON saved to a file; pref `"shelf-hash"` compared to detect change; on change `ResetScores` (deletes `score_*` prefs) and re-download `[fn ValidateShelfMetadata @0x1c7f498]`. Icons under `/shelf/` in `persistentDataPath` `[S "/shelf/"]`.
- Rotation: per-app `score_<bundleId>` and `app_<…>` prefs; apps sorted by score (`SortAppsByScore`), filtered by store locale (only `"us"` special-cased) and by whether the app can already be opened/installed (`CanOpenApplication`); score updated by `OnCloseForParents` / `OnNotInstalledAppHasOpened` `[fn ShelfData.ShelfRotationLogic @0x1c802b0, FilterAppsByStoreLocale @0x1c813f8, OnCloseForParents @0x1c81b24]`.
- Shelf button opens via the parental gate (§3.5). Exact scoring weights, JSON schema, badge rule: UNKNOWN.

### 3.8 Calendar
`CalendarController` builds a month grid with year/month prev/next and date click; no external caller found (`Show → CreateCalendar` only) `[M][dump]`. Purpose: UNKNOWN.

### 3.9 Local notifications `[fn NotificationController.*]`
- Start: `DontDestroyOnLoad` `@0x1c7690c`. `RegisterForNotif @0x1c76980`: registers a notification channel (importance value 3 seen in the code, INFERRED = default) and starts `RequestNotificationPermission` (coroutine `@0x1c77ab0`) which uses prefs `HasKey/GetInt/SetInt` so the OS permission is requested once.
- `OnApplicationPause @0x1c76e7c` (INFERRED from call order: GetLocalizedText ×4, CancelAll×2, Schedule): when the app goes to background → cancel all displayed + scheduled notifications, then `ScheduleAndroidNotification`; on resume → cancel displayed. Text from I2 terms (title/body, translated; falls back to default-language strings) `[fn ScheduleAndroidNotification @0x1c76bbc]`.
- Fire time = `DateTime.Now + TimeSpan(days,hours,minuts,seconds)` from `NotificationSettings`, with a `RepeatInterval` also from settings `[fn @0x1c76bbc]`. **Numeric values are serialized in scene data (component not found in `data.unity3d`) → UNKNOWN.** Permissions `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED` `[X]`.

### 3.10 Rate-us `[fn RateUs.* @0x1c77c…]`
- Score pref `RateUsDialogue_Score` (int), flag `RateUsDialogue_Rated` (int), time `RateUsDialoguePreferencesKey_LastShownTime` (unix seconds as string) `[S]`.
- **+1 score per saved artwork** (`<OnSave>d__14.MoveNext @0x1b87348 → IncreamentScore(1)`).
- `GalleryMenu.Start @0xcca5a8` and `GalleryScroll.Start @0x1e32cb8` call `ShowIfNeeded(6, 30)`: show when score ≥ **6** if never rated, or ≥ **30** if already rated `[fn ShowIfNeeded @0x1c77ee8 (csel on Rated)]`.
- `ShowRateUsPopup @0x1c77f44`: throttled by last-shown time (log "Short time Show Popup not shown"; the minimum interval constant is held in a field → **UNKNOWN**); on show sets Rated=1, Score=0, stores time, then requests Play In-App Review (`RequestReviewAndroid @0x1c78234`) or Amazon review. A successful purchase also calls `ShowRateUsPopup` (arg 0) `[fn OnIAPRequestCompleted @0xcd03d4]`.

## 4. Monetization

### 4.1 Products (Google Play Billing via Unity IAP, non-consumable)
IDs `[S in fn DataManager..cctor @0xcc571c]`: `com.bimiboo.coloring.fullver`, `.tools`, `.pack2`…`.pack8`, `.fairytales` (the `IDs` list order: pack2…pack8, fairytales, fullver, tools). `TypeProduct {Full, Pack, Tools}` `[M]`. Pack-name→ID mapping: `DataManager.GetProductID` (two overloads `@0xcc2b98`, `@0xcbfa88`) looks up an enum/string dictionary; individual pairing UNKNOWN (9 packs vs 8 pack IDs; Animals is free).
- `OnPurchaseButtonPressed @0xccfaa0`: branches on the selected product string equal to `fullver` or `tools`, otherwise treats as a pack; shows `LoadingLayer`; if no internet → localized popup (`popup-title-error-internet`, `popup-text-error-internet`, OK) `[fn PurchasePack.OpenBuyMenu @0xcd0a78]`.
- Result handler `OnIAPRequestCompleted @0xcd03d4`: status codes 1/2/4 compared; success → log analytics event `purchase_full | purchase_pack | purchase_tools`, go to `MainMenu` (via `SceneTransition.LoadScene`) if not already there, then rate-us popup; failure → `"Fail!"`.
- Sale badge: `GetSalePercentage @0xccece0` computes % saving of the Full price vs the sum of unpurchased packs' prices (`GetProductPriceInDecimalFromStore`, Decimal math) `[fn]`; `GetLockedPacksCount @0xcd07a4` counts locked packs (LINQ `Count`).

### 4.2 Entitlement logic (free vs paid)
- Purchase state is stored in **PlayerPrefs with the product ID as the key, value int 1**: `IAPNonConsumable.ProcessPurchase @0x1deb130` → `SetInt(productId, …)` for recognised IDs (log "PASS", else "FAIL. Unrecognized product"); `ProductPurchased @0x1deb6ac` → `HasKey && GetInt`; `GalleryScroll.CheckPack @0x1e33e74` same via `GetProductID`. Restore replays `ProcessPurchase` ("If it is start then, it is restore Product").
- **Gallery rule** `[fn GalleryMenu.CheckForPurchasedPacks @0xccad4c, RemoveLockedGames @0xccaf3c]`: if `FullVersionPurchased()` → nothing removed. Else, for each pack panel: skip `"Animals"`; skip if `IsProductPurchased(GetProductID(pack))`; otherwise add to `packsToRemove`; `RemoveLockedGames` then **removes those panels from the scroll** (`SimpleScrollSnap.Remove`). So locked packs are **hidden** in the gallery scene, not shown with a lock; they are purchased from the main-menu/pack UI.
- Tools product gates palettes (§3.2). Full version unlocks all packs (and, INFERRED, tools — not verified).
- Subscriptions: none.

## 5. Network
| Endpoint | Use | Evidence |
|---|---|---|
| `https://cdn.bimiboo.net/<platform>/<bundleId>/<build>/…` | AssetBundles (`.bundle`), `checksum.json` | `AssetBundleManager..cctor @0x1c6f158` (base), `Start @0x1c6e448` and `ContentDeliveryLoader.SetURL @0x1e36d4c` (concat of platform `android|amazon|ios`, `/`, `Application.identifier`, `/`, native build number; logs "URL CDN: ") |
| `https://cdn.bimiboo.net/apps-parents-page/for-parents/metadata.json` | For-Parents page data | `[D level7]` |
| `https://shelf.bimiboo.net/shelf/v3/<platform>/metadata.<lang>.json` + `/shelf/…` icons | Promo shelf | §3.7 |
| A/B test service (POST JSON `{BundleId, Platform, ExperimentKeys…}`) | Chooses parental-gate variant; results posted back | `[fn ABTestRequester.RequestABTest @0x1e46638, ABTestResultPoster.PostABTestSuccess @0x1e46918, WebContentRequester.SendPostRequest @0x1e43a88]`; **URL UNKNOWN** (static field set outside literals) |
| Firebase Analytics/Crashlytics | Telemetry | `FirebaseSetup.Start @0xcca208`: after dependency check, `SetAnalyticsCollectionEnabled(true)` **unconditionally** (no consent gate seen); IAP events above |
| Google Play Billing / Review | Store | `[X]` |
- Transport: HTTPS via `UnityWebRequest`; retries on failure for shelf; no auth header observed; response schemas UNKNOWN. `CheckForChanges` fetches `checksum.json` and compares with cached state `[fn AssetBundleManager.CheckForChanges, <CheckForChanges>d__5]`.
- Privacy flags `[X]`: `google_analytics_adid_collection_enabled=false`, `ssaid_collection=false`, `default_allow_ad_personalization_signals=false`. No ad SDK present.

## 6. Persistence layout
All via Unity PlayerPrefs unless noted.
| Key / store | Type | Meaning | Evidence |
|---|---|---|---|
| `<productId>` (e.g. `com.bimiboo.coloring.fullver`) | int 1 | purchased | §4.2 |
| `SelectedProductType` | string (lower-case enum) | last selected pack | `IntroSceneColoring.StartGame` |
| `shord-code` | string | language short code | `Locale.get_GetShortCode` |
| `RateUsDialogue_Score` / `_Rated` / `…_LastShownTime` | int / int / unix-secs string | rate-us | §3.10 |
| `shelf-hash`, `score_<bundle>`, `app_<bundle>` | string / int | shelf cache & rotation | §3.7 |
| notification-permission asked flag | int | key name UNKNOWN | `<RequestNotificationPermission>d__10.MoveNext @0x1c77ab0` |
| I2 Localization (`I2Languages`, `LangSource_*`, `LastGoogleUpdate_*`), EazySoundManager (music/sound) | strings/floats | misc | `[S]`, `AppPlayerPrefs.{Get,Set}{String,Float}` |
| A/B test assignment (`AppPlayerPrefs`, keyed by experiment) | string | gate variant | `ABTestRequester.Awake` |
| `persistentDataPath/…` PNG + `-icon.png`, shelf icons/JSON, content-delivery JSON, bundle cache | files | §3.3, 3.1, 3.7 | |
Danger spot: `ABTestRequester.RequestABTest` calls `PlayerPrefs.DeleteAll()` in some branch (`IsAppPreviouslyInstalled`/platform check) — condition UNKNOWN; a clone must not copy this.

## 7. Error behavior and edge cases (observed in code)
- No internet when buying → localized error popup (§4.1). Restore with nothing to restore → loading layer hides via coroutine.
- Bundle failure strings: "Failed to load AssetBundle!", "Catalog bundle path is null."; checksum mismatch → re-download.
- Shelf: empty/invalid/"Not Found" JSON → retry then fallback `en`; request error → delete cached file and retry.
- Rate-us: unparsable last-shown time → LogError, treated as never shown.
- Parental gate wrong answer → animation + new task.
- Firebase dependency failure → `LogError`, analytics not enabled.
User-visible wording for most errors: UNKNOWN (I2 term values live in the catalog bundles `[C localization/*]`, not decoded).

## 8. Implementation guidance
Clone with **original art/audio/names**: menu, gallery, canvas; 9 themes × 15 outline pages (one free); 7 tools, 3 palette types; undo/clear/save PNG+icon; non-consumable IAP (full/pack/tools) with restore; parental gate on external promos; settings (music, language, restore); local notification schedule on background; rate-us rule (6/30) driven by saves; CDN-delivered paid packs with checksum + cache. Keep child-safety posture: no ad SDK, ad-ID off, **do not** copy unconditional analytics, `DeleteAll`, or ungated purchase button without a legal review.

## 9. Remaining UNKNOWNs and how to close them
1. A/B endpoint URL, shelf/for-parents/checksum JSON schemas → run on a device with mitmproxy.
2. Numeric notification delay/interval, rate-us min interval, parental-gate difficulty, which palette items are free → read serialized `NotificationController`/`PaletteColor` components (not found in `data.unity3d` by UnityPy; may live in Addressables bundles) or observe at runtime.
3. Exact PlayerPrefs file contents/path of saved PNG → `adb run-as` on a device.
4. Whether non-Animals packs ship in the APK → inspect `resources.assets`/`data.unity3d` object names (UnityPy) — not done.
5. Orientation rule (`InitialSettings`), calendar purpose, For-Parents gating → disassemble `InitialSettings`/scene wiring.

## 10. Legal note
Clean-room: implement only from this spec; do not reuse trademarks, characters, artwork, audio, localization strings, or the APK. Check the app's Terms of Use (https://bimiboo.net/terms-of-use/) and local law on reverse engineering.

---
## Appendix A — Listing of `com.bimiboo.kids.drawing` (NOT this APK)
Source: Play page + Data Safety, fetched 2026-10-20. GAME_EDUCATIONAL, rating "Todos", 4.18★/24.8k, 1M+ installs.
Claims: guided drawing by dotted-line tracing; animated figures+sounds; colouring book (animals, dinosaurs, cars, ocean…); many colours/tools; modes (colour outlines, free sketch, kaleidoscope mirror, neon-glitter); no ads/external links; offline; some free images; monthly + annual subscriptions.
Data Safety: device IDs shared for Analytics + Advertising/marketing; crash logs; app interactions; encrypted in transit; Families policy. Conflict "no ads" vs advertising-purpose sharing unresolved. None of these features were found in `com.bimiboo.coloring`.
