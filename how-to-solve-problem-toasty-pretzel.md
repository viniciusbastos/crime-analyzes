# Fix slow "intense data load" wait — quick wins

## Context

Opening the dashboard, applying a filter, and using the crimes-management
table all stall on a spinner for seconds. Root cause is **not** data volume
(`crimes` table ≈ 2,151 rows). It is architecture:

- Dashboard load fires ~16 parallel queries via `useCrimeDataSets`
  (`frontend/src/hooks/useCrimeData.js:240`), including an **unbounded full-dataset
  GeoJSON fetch that runs on every load** even when the cluster map is never
  opened (`useCrimeData.js:71`, `CrimeDashboard.jsx:55`; backend `/heatmap/geojson`
  does `query…all()` with no limit, `backend/routes/routes.py:402-422`).
- `useCrimeTypes` pulls **10,000 crime rows** just to derive the distinct
  type list client-side (`useCrimeData.js:216-226`).
- Any filter change rebuilds every query key → **all 16 queries refetch**, and
  React Query shows the loading spinner instead of keeping old content
  (`CrimeDashboard.jsx:23,109-111`).
- Crimes-management table renders every row with no pagination/virtualization,
  re-filters + re-parses dates on every render/keystroke, no debounce
  (`CrimeManagement.jsx:113-123,420-434,437-530`).
- No gzip on responses; backend re-materializes rows 3× (ORM → dicts → pandas)
  per analytics call.
- Backend cold start loads the MLX chat model + RAG service at import
  (`rag_service.py:341`, `chat_service.py:240` via `routes.py:25-26`), so the
  first request after a restart waits behind model load.

Scope: **quick wins only** — no DB schema changes, no materialized views, no
infra. Target the three reported pain points: initial load, filter apply,
crimes table.

## Changes

### A. Frontend — perceived speed (React Query)

1. **Keep old content during refetch.** In `frontend/src/main.jsx:9-24`
   QueryClient `defaultOptions.queries`, add
   `placeholderData: (prev) => prev` (v5 `keepPreviousData`). Eliminates the
   spinner flash on every filter apply — content updates in place.
2. **Stop the always-on GeoJSON fetch.** `useGeoJsonData(filters)` in
   `CrimeDashboard.jsx:55` / `useCrimeData.js:64-74` — pass `enabled` gated on
   the cluster-map section being active (mirror the existing
   `shouldLoadMapData` pattern at `CrimeDashboard.jsx:32-33`). It should not run
   on dashboard or non-map sections.
3. **Lazy-load trend queries.** `CrimeDashboard.jsx:37-52` fires all
   `useYearOverYear` / `useGrowthRates` / `useMovingAverages` /
   `useWeeklyMovingAverages` / `useForecast` immediately. Gate them (via their
   `enabled` option in `useCrimeData.js:127-197`) on
   `activeSection === "trends" || activeSection === "dashboard"` so opening a
   non-trends view doesn't pay for them.
4. **Replace the full-screen spinner gate.** `CrimeDashboard.jsx:127-142`
   blocks the whole page on `isLoadingEssential`. Render the section shell +
   per-card `LoadingSpinner` / skeletons instead, so the frame and nav paint
   immediately. (Cards already guard data with `?.`.)

### B. Frontend — fewer / smaller requests

1. **Distinct crime types without 10k rows.** Add a tiny backend endpoint
   `GET /api/crimes/types` returning `SELECT DISTINCT crime_type` (copy the
   pattern of `/api/police/unidades` etc., `backend/routes/routes.py:900-955`,
   `@cached_api_call`). Point `useCrimeTypes` (`useCrimeData.js:216-226`) at it
   and drop the `per_page=10000` fetch + client-side `Set/map/sort`.
2. **Scope cache invalidations.** Mutations (`useUploadData`, `useClearCache`,
   and the manual handlers in `CrimeManagement.jsx:155-190`) call
   `queryClient.invalidateQueries()` with no key → full refetch storm. Pass the
   specific query-key prefixes actually affected (`["crimes"]`, `["summary"]`,
   `["heatmap"]`, …). Use the already-present-but-unused `useInvalidateQueries()`
   (`CrimeDashboard.jsx:57`).

### C. Frontend — crimes-management table

1. In `frontend/src/components/CrimeManagement.jsx`:
   - `useMemo` the filtered + sorted list keyed on `[crimes, debouncedSearch,
     sortState]` instead of the inline IIFE at `:420-434`.
   - Debounce `searchTerm` ~300ms before it feeds the filter (`:283`).
   - Format each row's date once when `crimes` is fetched/stored (`:135`),
     not per render in `formatDateTime` (`:113-123`).
2. **Use the server pagination that already exists.** `/api/crimes` returns a
   `pagination` block (`routes.py:210-230`); `CrimeManagement.jsx:130` fetches
   with no `page`/`per_page` and ignores it. Adopt the pattern from
   `UserManagement.jsx:11-17,372-446` (`per_page: 25`, page state, prev/next
   controls). Removes the unbounded render path.

### D. Backend — cheap, low-risk

1. **Gzip responses.** Add `flask-compress` in `backend/app.py` (`Compress(app)`
   after `app` is created, ~line 76). Shrinks summary / temporal / trends /
   GeoJSON / export payloads ~70–90% with no code changes elsewhere.
2. **Cap `/heatmap/geojson`.** `backend/routes/routes.py:402-422` — add a
    `limit` arg (default e.g. 20000) + optional `sample=true`
    (`ORDER BY random()`), matching `/heatmap` (`routes.py:349`). Prevents a
    worst-case full-table serialization even after change #2.
3. **Fix cross-user cache bleed (correctness).** `generate_cache_key`
    (`backend/services/cache_service.py`) omits JWT identity, but
    `apply_user_unidade_filter` (`routes.py:32-48`) scopes rows by the user's
    `unidade`. Include the caller's `unidade` / user id in the key so
    unit-filtered users don't serve/see each other's cached data.
4. **Lazy backend cold start.** Make `rag_service` (`rag_service.py:341`) and
    `chat_service` (`chat_service.py:240`) lazy singletons (module-level
    `get_chat_service()` that builds on first call) instead of instantiating at
    import time in `routes.py:25-26`. First dashboard request after a restart no
    longer waits behind MLX model load; only `/chat` pays it.

## Out of scope (noted, not done here)

- `category_parent` / hour-dow-month expression indexes (schema work).
- `/spatial` DBSCAN + KMeans k=2..10 + O(n²) silhouette rework
  (`backend/utils/analysis.py:78-155`) — map view not a reported pain point.
- Replacing the ORM→dict→DataFrame triple-copy with SQL `GROUP BY` aggregates.
- Combining the 5 `/trends/*` endpoints into one `/trends/all`.
- Leaflet marker clustering plugin for `/spatial` up-to-10k `circleMarker`s.

## Verification

1. **Backend up:** `docker compose up -d db redis` then run the Flask app
   (`cd backend && flask run` or the compose service). Confirm
   `GET /api/crimes/types` returns a JSON string array and is fast.
2. **Cold-start check:** restart the backend, immediately
   `curl -w '%{time_total}\n' -o /dev/null -s localhost:5000/api/summary`.
   Should return in well under a second (previously blocked on model import).
3. **Gzip:** `curl -H 'Accept-Encoding: gzip' -I localhost:5000/api/heatmap/geojson`
   → `Content-Encoding: gzip`.
4. **Frontend:** `cd frontend && npm run dev`. In DevTools Network:
   - Initial dashboard load: **no** request to `/heatmap/geojson`, **no**
     `/crimes?per_page=10000`; trend requests only fire when the Trends section
     is opened. Frame + nav paint before data resolves.
   - Apply a filter: content stays visible (no full-page spinner); request
     count is the visible section's queries, not ~16.
   - Crimes management: table paginates (25/page); typing in search does not
     lag; React Profiler shows the filtered list is memoized, not recomputed per
     keystroke.
5. **Cache isolation:** with two users on different `unidade`s, hit `/api/summary`
   as each; confirm totals differ (no shared cached response).
6. **Existing tests:** `cd backend && pytest` — the `convert_crime_data` suite
   and any route tests still pass.
