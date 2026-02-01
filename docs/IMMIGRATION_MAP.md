# Immigration Map Integration Notes

## Data Consumption
- The `ImmigrationMap` component fetches `/public/countries` once (proxied via Vite) and expects a GeoJSON `FeatureCollection`. Each feature must include `geometry` (valid GeoJSON), `properties.name`, `properties.iso2`, and either `properties.pathways` or `properties.pathway_types` arrays.
- Pathway entries are deduplicated into `pathwayDetails`, unique pathway names/types are counted for `pathwayCount`, and `visualPathwayCount` is capped at 3 to drive the single-hue saturation ramp. No scoring, ranking, or other inference occurs.
- Responses are validated for HTTP success, JSON parseability, the `FeatureCollection` shape, and a non-empty `features` array before the map source/layers initialize; any failure shows a clear message and skips rendering.

## Extending With Overlays
1. Add a new `geojson` source to the map (e.g., `map.addSource('overlay-name', { type: 'geojson', data })`) and layer(s) that reference it, keeping their paint/layout configs scoped to the overlay.
2. Build a memoized selector in the component (similar to `normalizeFeatures`) that merges the overlay data with existing metadata to avoid re-processing when the overlay changes.
3. Guard the overlay layer styling with `map.getLayer('overlay-layer')` checks before `addLayer`/`setPaintProperty` to keep the base map rendering stable.
4. Tie any overlay controls to React state so user interactions trigger `setData` or `setPaintProperty` without reinitializing the base MapLibre instance.

By isolating the base `country-data` source/layers from any additional layers, new overlays can be added without refactoring the core rendering or interaction handlers.

## Failure modes and diagnostics
- **Network failure** – UI text “Map unavailable, cannot reach the data service.” Console logs `[ImmigrationMap] network {...}` with the original error message.
- **Non-200 HTTP response** – UI text “Map unavailable, server returned an error.” Console logs `[ImmigrationMap] non2xx {...}` with status, status text, content type, and truncated body.
- **Invalid JSON** – UI text “Map unavailable, invalid data format.” Console logs `[ImmigrationMap] invalidJson {...}` with parse error and snippet.
- **Wrong GeoJSON structure** – UI text “Map unavailable, unexpected GeoJSON structure.” Console logs `[ImmigrationMap] invalidGeoJson {...}` with a sample payload.
- **Empty features array** – UI text “Map unavailable, no country features were returned.” Console logs `[ImmigrationMap] empty {...}`.

Set `VITE_MAP_DEBUG=true` in your `.env` (or pass it when running `npm run dev`) to ungrouped console output. With debug enabled, every fetch reports its status, content type, and the first 1-2 feature property summaries (name, iso2, and geometry type) so you can confirm what `/api/countries` is returning without logging the full geometry.
