# Frontend Component Audit — Passagr

**Scope:** [PathChecklistExperience.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx), [ImmigrationMap.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx), [VisaPathChecklist.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/VisaPathChecklist.jsx) (src/), [VisaPathPage_Checklist.tsx](file:///Users/sarahsahl/Desktop/passagr/ui/public/VisaPathPage_Checklist.tsx) (ui/public/)
**Audit dimensions:** React hooks correctness · Async data handling · Client-side data exposure · Map performance · Checklist state persistence · Accessibility · Component coupling

---

## Severity Key

| Label | Meaning |
|---|---|
| 🔴 Critical | Data loss, security exposure, or crash path |
| 🟠 High | Likely user-visible bug or meaningful risk |
| 🟡 Medium | Correctness concern, edge-case failure, or pattern debt |
| 🟢 Low | Code quality or minor UX gap |
| ℹ️ Info | Non-actionable observation |

---

## 1 — [PathChecklistExperience.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx)

### 1.1 React Hooks Correctness

**🟠 High — [reload](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#141-201) is not stable; `useEffect` captures it as a stale closure**

```js
// Line 141
const reload = async () => { ... };

// Line 202-204
useEffect(() => {
    reload();
}, [visaPathId]);
```

[reload](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#141-201) is re-created on every render. The `useEffect` correctly only re-fires when `visaPathId` changes, but ESLint's `react-hooks/exhaustive-deps` would flag this because [reload](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#141-201) is an unstated dependency. In practice this is safe today, but if any additional state were added to the closure without updating the dependency, silently stale data would result. **Fix:** wrap [reload](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#141-201) in `useCallback` with `[visaPathId]` as deps, or inline the body.

**🟢 Low — `useMemo` deps are correct and appropriately narrow**

`upgradeAvailable` (L206) and `diffSummary` (L213) both enumerate the correct state variables. No issues.

---

### 1.2 Async Data Handling

**🟠 High — Sequential async waterfall without AbortController**

[reload](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#141-201) makes up to 6+ serial Supabase calls. If `visaPathId` changes (parent re-renders with a new prop) before the first load completes, both in-flight fetches can race to `setState`, causing the component to display data from the *old* path briefly or permanently.

```js
// No cleanup / cancellation on visaPathId change
useEffect(() => {
    reload();
}, [visaPathId]);
```

**Fix:** add an `isCancelled` flag (or `AbortController` for the non-Supabase calls) and gate all `setState` calls behind it:
```js
useEffect(() => {
    let cancelled = false;
    const run = async () => {
        // ... all setState calls wrapped: if (!cancelled) setState(...)
    };
    run();
    return () => { cancelled = true; };
}, [visaPathId]);
```

**🟡 Medium — Error state is partially suppressed when a template exists**

```js
// Line 317
if (error && !template) { /* show full error */ }
// Line 351-356 — error renders inline when template is present
```

If the initial [fetchChecklistTemplateByVisaPath](file:///Users/sarahsahl/Desktop/passagr/src/lib/api.js#382-396) succeeds but a downstream call throws, `error` is set but the component still renders the normal template. The inline error banner at L352 is fine for mutations, but on initial load the user may see "Checklist based on guidance version 1" alongside an error that says a critical parallel fetch failed. Consider distinguishing load-time errors from mutation errors.

**🟢 Low — All null-guard paths are handled explicitly**

`activeTemplate`, `user`, `savedPath`, `checklist` are all early-returned with null state cleanups (L150–L184). No unguarded `.data` accesses.

---

### 1.3 Client-Side Data Exposure

**ℹ️ Info — Template items and live checklist items are fetched client-side via Supabase**

[fetchChecklistTemplateItems](file:///Users/sarahsahl/Desktop/passagr/src/lib/api.js#409-420) calls go directly to `checklist_template_items` and `user_checklist_item_states` tables via the Supabase client. Authorization correctness depends entirely on RLS policies — the frontend applies no additional gating. If RLS on `checklist_templates` doesn't also filter to `is_active = true` at the DB level, a user could request an inactive template's items by ID.

> [!IMPORTANT]
> Confirm RLS on `checklist_templates` filters to `is_active = true`, not just [eq('is_active', true)](file:///Users/sarahsahl/Desktop/passagr/ui/public/VisaPathPage_Checklist.tsx#4-12) in the JS query. RLS should be the last line of defense, not the query filter.

**🟢 Low — User isolation is delegated to the DB correctly**

`user_path_checklists` and `user_checklist_item_states` write / read flows use `user_id` inserted server-side (in [createLiveChecklist](file:///Users/sarahsahl/Desktop/passagr/src/lib/api.js#488-527), L491). There's no client-controlled `user_id` assignment at the component level.

---

### 1.4 Checklist State Persistence

**🔴 Critical — Checklist progress is NOT persisted on mid-checklist abandon for notes drafts**

`notesDraft` (L134) is pure in-memory React state. If a user types a note in the textarea and closes the tab or navigates away without clicking "Save note", the draft is silently lost. Status changes *are* persisted immediately via [updateLiveChecklistItem](file:///Users/sarahsahl/Desktop/passagr/src/lib/api.js#540-557) (L246), but note drafts are not.

**Fix options (in order of preference):**
1. Auto-save notes on `onBlur` of the textarea (debounced).
2. Persist `notesDraft` to `localStorage` keyed by `checklist.id + item.id` and clear on successful save.
3. Prompt the user before navigation using `beforeunload` if `notesDraft` has unsaved keys.

**🟡 Medium — Upgrade flow archives the old checklist atomically on success but not on failure**

```js
// Line 289-294
await archiveChecklist(liveChecklist.id);           // step 1
const replacement = await createLiveChecklist(...); // step 2
const items = await fetchLiveChecklistItems(...);   // step 3
```

If step 2 or 3 throws after step 1 succeeds, the user's existing checklist is archived but the new one doesn't exist in local state. The component will reload into "no checklist" mode, but the old checklist is still archived in the DB. The user silently loses their progress and would need to restart. 

**Fix:** reload from DB on upgrade error (call [reload()](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#141-201) in the catch block), which will surface the still-archived checklist while surfacing the error.

---

### 1.5 Accessibility

**🟡 Medium — `<select>` for item status has no `aria-label`**

```jsx
// Line 89-97
<select
    value={item.status}
    onChange={(e) => onStatusChange(item, e.target.value)}
    className="border border-surface-300 px-2 py-1 text-sm"
>
```

No [id](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#369-374) or `aria-label` is provided. Screen readers will announce this as "combo box" without context. **Fix:** add `aria-label={`Status for ${item.item_title}`}`.

**🟡 Medium — The "Item notes" label is not associated to the textarea**

```jsx
// Lines 100-107
<label className="...">Item notes</label>
<textarea ... />
```

The `<label>` doesn't use `htmlFor` and the `<textarea>` doesn't have an [id](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#369-374). The association is purely visual. **Fix:** add `id={`notes-${item.id}`}` to the textarea, `htmlFor={`notes-${item.id}`}` to the label.

**🟢 Low — Upgrade consent checkbox lacks an [id](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#369-374)/`htmlFor` pair**

```jsx
// Lines 382-388
<label className="...">
    <input type="checkbox" checked={consentUpgrade} ... />
    I understand this creates a new checklist...
</label>
```

Wrapping `<label>` implicitly associates the input — this is fine. No fix required, but explicit [id](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#369-374)/`htmlFor` improves testability.

---

### 1.6 Component Coupling

**🟡 Medium — Component owns its own data fetching (tight API coupling)**

[PathChecklistExperience](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#124-431) calls 8+ different API functions directly and manages all loading / error states internally. This is reasonable for a self-contained experience widget, but it means the component cannot be used with different data sources (e.g., mock data in Storybook, or a different API) without mocking the entire `../lib/api` module.

**ℹ️ Info — `visaPathId` is the only prop; coupling to parent is minimal**

The component is externally clean. The only tight coupling is to the `../lib/api` module internally.

---

## 2 — [ImmigrationMap.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx)

### 2.1 React Hooks Correctness

**🟠 High — `handleAccessibleFocus` calls [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) which is defined inside a different `useEffect` scope**

```js
// Line 580-593 — useCallback at module level
const handleAccessibleFocus = useCallback((feature) => {
    ...
    if (tooltipRef.current) {
        renderTooltip(feature, 'Press Enter for details'); // ← calls renderTooltip
    }
}, []);

// renderTooltip is defined at Line 375 — INSIDE the useEffect at Line 341
```

[renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) is a function defined inside the third `useEffect` body (L341–L483). `handleAccessibleFocus` closes over the *initial* version of [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) from its definition scope, but because [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) is recreated on every effect run, the `useCallback` will actually close over `undefined` — [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) is not in scope at the `useCallback` call site. This will throw `TypeError: renderTooltip is not a function` the first time a keyboard user focuses a country button.

**Fix:** Either hoist [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) outside the effect (to module scope or as a `useCallback`), or move `handleAccessibleFocus` inside the same effect where [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) is defined and wire it up there.

**🟡 Medium — `handleMapError` `useCallback` dependency array is empty but correct (`[]`)**

```js
// Line 485-492
const handleMapError = useCallback((failureType, details = {}) => {
    ...
    setError(message);
    setActiveFeature(null);
}, []);
```

`setError` and `setActiveFeature` are stable state setter references from `useState` — the `[]` dep array is correct per React docs. No issue, but worth noting if the body ever expands to reference unstable values.

**🟡 Medium — Three separate `useEffect` hooks all depend on `[mapReady, normalizedGeoJson]`**

Effects 2 (L294) and 3 (L341) share the same dependency array. These run in order on the same render cycle, which is correct today, but adds subtle execution-order coupling. If effect 3's event listeners are wired *before* effect 2 has rendered the layer, `queryRenderedFeatures` on `'country-fill'` will silently return empty. In practice they run in order, but the pattern is fragile.

---

### 2.2 Async Data Handling

**🟠 High — No AbortController on the GeoJSON fetch; `reloadToken` changes can cause stale setState**

```js
// Line 494-568
useEffect(() => {
    const fetchGeo = async () => {
        setIsLoading(true);
        ...
        setGeoJson(featureCollection); // ← no guard if component unmounted or reloadToken changed again
    };
    fetchGeo();
}, [handleMapError, reloadToken]);
```

If the user clicks "Retry map" twice rapidly, two parallel fetches race. The second fetch's `setGeoJson` may overwrite the result of the first even if the first resolves later. **Fix:** use an `AbortController` and an `isCurrent` flag.

**🟢 Low — All five GeoJSON failure modes are explicitly handled**

`network`, `non2xx`, `invalidJson`, `invalidGeoJson`, and `empty` all map to user-friendly messages. Excellent defensive handling.

**🟢 Low — [extractFeatureCollection](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#126-132) safely traverses `payload.data` and `payload.document` fallbacks**

No unguarded property accesses. The `?.` chain and null returns are correct.

---

### 2.3 Client-Side Data Exposure

**🟡 Medium — The GeoJSON endpoint is unauthenticated (`/public/countries`) but includes pathway data**

```js
// Line 10
const COUNTRY_API_ENDPOINT = `${API_BASE.replace(/\/$/, '')}/public/countries`;
```

Pathway types, rights scores, and healthcare tiers are bundled into every GeoJSON feature and sent to all visitors, authenticated or not. If any of that data is considered editorial/non-public prior to a publish step, it would be exposed here. 

> [!IMPORTANT]
> Confirm the `/public/countries` API endpoint enforces the same `status = 'published'` gate used by the Supabase [fetchCountries](file:///Users/sarahsahl/Desktop/passagr/src/lib/api.js#40-113) function (L59). These are two separate code paths; a mismatch would leak unpublished country data on the map even if the table view filters correctly.

**ℹ️ Info — No auth-gated data rendered in this component**

The map drawer shows only public pathway and country data. No user-specific records are rendered here.

---

### 2.4 Map Performance

**🟠 High — [normalizeFeatures](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#159-214) runs on every render of the stable `geoJson` state**

```js
// Line 248
const normalizedGeoJson = useMemo(() => normalizeFeatures(geoJson), [geoJson]);
```

`geoJson` is set once on load, so `useMemo` will correctly recompute only when it changes. **This is fine.** However, [normalizeFeatures](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#159-214) iterates all features twice for each `pathwayDetails.some()` deduplication check (O(n²) inner loop). For a world-countries dataset (~195 features, typically 2–5 pathways each), this is inconsequential, but worth noting if pathway counts grow.

**🟡 Medium — [expandPathwayTypes](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#42-60) is called twice for the same country in the drawer render**

```jsx
// Lines 773 and 777
{expandPathwayTypes(activeFeature.properties.pathwayTypes).length > 0 && (
    <div>
        {Array.from(new Set(expandPathwayTypes(activeFeature.properties.pathwayTypes).map(...)))}
```

[expandPathwayTypes](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#42-60) is called twice for a single render. Since `pathwayTypes` is already deduplicated in [normalizeFeatures](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#159-214), this dual call is unnecessary. **Fix:** compute once:
```js
const types = Array.from(new Set(expandPathwayTypes(activeFeature.properties.pathwayTypes).map(formatPathwayLabel)));
```

**🟢 Low — GeoJSON source uses `setData` for updates rather than re-adding layers**

```js
// Lines 299-300
if (map.getSource('country-data')) {
    map.getSource('country-data').setData(normalizedGeoJson);
```

Correctly avoids tearing down and re-adding layers on data refresh — best practice for MapLibre.

**🟢 Low — Tooltip is implemented with imperative DOM mutation instead of React state**

The tooltip is a `ref`-driven DOM node. This prevents React reconciliation overhead every `mousemove` event. Correct and intentional for a hot-path interaction.

---

### 2.5 Accessibility

**🔴 Critical — [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) is not keyboard-accessible at all (function is undefined in `handleAccessibleFocus` scope)**

See §2.1 — the keyboard nav path silently breaks on first focus. Keyboard users get the accessible button grid but no tooltip feedback.

**🟡 Medium — The map `<canvas>` itself has no `aria-hidden`**

The MapLibre canvas produces no meaningful accessibility tree content. It should be `aria-hidden="true"` so screen readers ignore it entirely and rely on the accessible button grid below.

```jsx
// Line 625
<div ref={mapContainer} className="map-viewer__canvas" />
// Fix:
<div ref={mapContainer} className="map-viewer__canvas" aria-hidden="true" />
```

**🟡 Medium — `role="dialog"` on the drawer is never `aria-modal` for desktop**

```jsx
// Line 668
aria-modal={isMobile}
```

`aria-modal` is only set for mobile. On desktop, `aria-modal={false}` (or omitted) means screen readers won't trap focus inside the drawer when it opens. Either apply `aria-modal` consistently or use a `<dialog>` element.

**🟡 Medium — The "Retry map" button (L638) has no `aria-label`**

The button text "Retry map" is sufficient, but there's no description of what failed. Consider pairing with an `aria-describedby` pointing to the error message paragraph.

**🟢 Low — Accessible button grid has `aria-label="Country navigation"` — good**

The grid correctly uses a descriptive `aria-label` and each button has `aria-label={`View pathways for ${feature.properties.countryName}`}`. Well done.

---

### 2.6 Component Coupling

**🟡 Medium — `onSelectCountry` callback is optional but silently ignored with no user feedback**

```js
// Line 702
if (!iso2 || !onSelectCountry) return;
```

If `onSelectCountry` is not passed, clicking "View pathways" does nothing — no error, no navigation, no message. In a test or Storybook context this is fine, but a developer wiring this up incorrectly would see a silent failure.

**ℹ️ Info — The component is mostly self-contained; `onSelectCountry` is the only external coupling point**

Good abstraction surface.

---

## 3 — [VisaPathChecklist.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/VisaPathChecklist.jsx) (src/components/)

### 3.1 React Hooks Correctness

**🟢 Low — `useMemo` on `groupedRequirements` is correct**

Deps array `[requirements]` is accurate. The guard `if (!Array.isArray(requirements)) return {}` is a clean null-safety practice.

---

### 3.2 Async Data Handling

**ℹ️ Info — This is a pure presentational component**

No async operations, no side effects. All data is provided via props. No findings.

---

### 3.3 Client-Side Data Exposure

**🟡 Medium — No prop validation on `requirements`**

The component accepts `requirements` without runtime validation. Individual `req` objects are accessed as `req.label`, `req.details`, `req.doc_list`, etc. If the parent passes malformed data (e.g., `doc_list` is `null` instead of `[]`), [normalizeDocList](file:///Users/sarahsahl/Desktop/passagr/src/lib/formatters.js#17-22) handles it gracefully (L18–L20 of [formatters.js](file:///Users/sarahsahl/Desktop/passagr/src/lib/formatters.js)), but `req.notarization_needed` and `req.apostille_needed` render conditionally with no type guard — non-boolean truthy values (e.g., `"yes"`) would incorrectly show badges.

**Fix:** add PropTypes or TypeScript types to validate the `requirements` shape.

---

### 3.4 Checklist State Persistence

**ℹ️ Info — This component is stateless; no user progress is tracked**

[VisaPathChecklist.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/VisaPathChecklist.jsx) is a read-only reference view. No persistence responsibility.

---

### 3.5 Accessibility

**🟡 Medium — `<RequirementItem>` renders as a `<div>` inside what is visually a list**

The component renders requirement items as `<div>` elements with `<h4>` titles. These are not wrapped in a `<ul>`/`<li>` structure, which means screen readers don't announce a list or an item count.

**Fix:** change to:
```jsx
<ul>
    {reqs.map(req => <li key={req.id}><RequirementItem req={req} /></li>)}
</ul>
```

**🟢 Low — Phase icons (`Globe`, `MapPin`, `CheckCircle2`) are imported but never rendered**

```js
// Lines 7-10 — icon imported into PHASE_CONFIG
const PHASE_CONFIG = { 'remote_only': { icon: Globe, ... } }
// Lines 87-88 in render
const Icon = config.icon;
// But Icon is never used in JSX (no <Icon /> call)
```

The Icon variable is extracted but never mounted. This is dead code — the icons are defined in config but silently dropped. **Fix:** render `<Icon className="w-4 h-4" />` in the phase header, or remove from config.

---

### 3.6 Component Coupling

**🟢 Low — Minimal coupling; pure prop-driven component**

[VisaPathChecklist](file:///Users/sarahsahl/Desktop/passagr/src/components/VisaPathChecklist.jsx#58-107) depends only on `requirements` prop and [normalizeDocList](file:///Users/sarahsahl/Desktop/passagr/src/lib/formatters.js#17-22) from formatters. Highly reusable and testable.

---

## 4 — [VisaPathPage_Checklist.tsx](file:///Users/sarahsahl/Desktop/passagr/ui/public/VisaPathPage_Checklist.tsx) (ui/public/)

> [!WARNING]
> This component operates entirely on `mockRequirements` hardcoded in the file and defaults to them if no `requirements` prop is passed. It appears to be a **UI prototype / design reference**, not a production data-connected component.

### 4.1 React Hooks Correctness

**🟢 Low — `useMemo` for `requirementsByPhase` is correct**

Single dep `[requirements]`, body is a pure `.reduce()`. No issues.

---

### 4.2 Client-Side Data Exposure

**🔴 Critical — Mock data is bundled and shipped in production**

```ts
// Line 13-19
const mockRequirements: Requirement[] = [
    { label: "Financial Solvency Proof", ... },
    ...
];

// Line 34
export const VisaPathChecklist: React.FC<{ requirements: Requirement[] }> = ({ requirements = mockRequirements }) => {
```

If this component is imported anywhere in the production build without passing a `requirements` prop, it silently falls back to `mockRequirements` — a list of fake checklist items that look real to users. This is a **correctness and trust risk** in a compliance-sensitive immigration product.

**Fix:** remove the default value, or replace with `requirements = []` and render an empty-state message. Do not ship mock data as a prop default in production code.

---

### 4.3 Accessibility

**🟡 Medium — List items are keyed by `index` instead of [id](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#369-374)**

```tsx
// Line 66-67
{list.map((req, index) => (
    <li key={index} ...>
```

Index-keyed lists cause unnecessary React reconciliation and can cause screen readers to lose focus position on re-renders if the list order changes.

**Fix:** key by `req.label` (a de-facto unique field in this domain) or add a stable [id](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#369-374) to the [Requirement](file:///Users/sarahsahl/Desktop/passagr/ui/public/VisaPathPage_Checklist.tsx#4-12) interface.

**🟡 Medium — `<h2>` title text is also hardcoded**

```tsx
// Line 50
<h2 ...>Preparedness Checklist: Your Path to Safety</h2>
```

This heading is static and does not reflect the actual visa path name. When used in context, the heading would be misleading.

---

## Summary Table

| # | Component | Finding | Severity |
|---|---|---|---|
| 1 | PathChecklistExperience | No AbortController — race condition on `visaPathId` change | 🟠 High |
| 2 | PathChecklistExperience | [reload](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#141-201) not in `useEffect` deps (stale closure risk) | 🟠 High |
| 3 | PathChecklistExperience | Note drafts lost on tab close — no persistence | 🔴 Critical |
| 4 | PathChecklistExperience | Upgrade flow leaves user checklist-less if step 2 fails | 🟡 Medium |
| 5 | PathChecklistExperience | `<select>` status has no `aria-label` | 🟡 Medium |
| 6 | PathChecklistExperience | Notes `<label>` not associated to `<textarea>` via `htmlFor` | 🟡 Medium |
| 7 | PathChecklistExperience | Load-time and mutation errors share the same `error` state | 🟡 Medium |
| 8 | ImmigrationMap | [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) out of scope in `handleAccessibleFocus` → TypeError | 🔴 Critical |
| 9 | ImmigrationMap | No AbortController on GeoJSON fetch with `reloadToken` | 🟠 High |
| 10 | ImmigrationMap | `/public/countries` REST endpoint vs Supabase status gate may diverge | 🟡 Medium |
| 11 | ImmigrationMap | Map `<canvas>` missing `aria-hidden="true"` | 🟡 Medium |
| 12 | ImmigrationMap | `role="dialog"` not `aria-modal` on desktop | 🟡 Medium |
| 13 | ImmigrationMap | [expandPathwayTypes](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#42-60) called twice per drawer render | 🟢 Low |
| 14 | ImmigrationMap | `onSelectCountry` silently swallows omission | 🟢 Low |
| 15 | VisaPathChecklist (src) | Phase icons imported but never rendered (dead code) | 🟢 Low |
| 16 | VisaPathChecklist (src) | Requirements rendered as `<div>` not semantic list | 🟡 Medium |
| 17 | VisaPathChecklist (src) | No prop validation on `requirements` shape | 🟡 Medium |
| 18 | VisaPathPage_Checklist (ui) | Mock data ships as prop default in production build | 🔴 Critical |
| 19 | VisaPathPage_Checklist (ui) | List items keyed by array index | 🟡 Medium |

---

## Priority Fix Order

1. **Finding #8** — Fix [renderTooltip](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#375-425) scoping in [ImmigrationMap](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx#232-819) (keyboard accessibility is completely broken)
2. **Finding #3** — Add note draft persistence (`localStorage` or `onBlur` auto-save) in [PathChecklistExperience](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#124-431)
3. **Finding #18** — Remove `mockRequirements` default from [VisaPathPage_Checklist.tsx](file:///Users/sarahsahl/Desktop/passagr/ui/public/VisaPathPage_Checklist.tsx) or quarantine file from production bundle
4. **Finding #1 + #9** — Add `AbortController` / cancellation flags to both async fetch effects
5. **Findings #5, #6, #11, #12, #16** — Accessibility pass (labels, `aria-hidden`, `aria-modal`, semantic list structure)
6. **Finding #4** — Add [reload()](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx#141-201) call to upgrade error handler to restore checklist state
7. **Finding #10** — Cross-verify `/public/countries` API with Supabase `status` filter parity
