import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Loader2, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json';
const TOOLTIP_DELAY_MS = 150;
const MAP_DEBUG = import.meta.env.VITE_MAP_DEBUG === 'true';
const COUNTRY_API_ENDPOINT = '/public/countries';

const FAILURE_MESSAGES = {
    network: 'Map unavailable, cannot reach the data service.',
    non2xx: 'Map unavailable, server returned an error.',
    invalidJson: 'Map unavailable, invalid data format.',
    invalidGeoJson: 'Map unavailable, unexpected GeoJSON structure.',
    empty: 'Map unavailable, no country features were returned.'
};

const truncateText = (value, limit = 400) => {
    if (typeof value !== 'string') return value;
    return value.length > limit ? `${value.slice(0, limit)}…` : value;
};

const safeStringify = (value) => {
    try {
        return JSON.stringify(value);
    } catch {
        return '[Circular]';
    }
};

const logMapDebug = (label, payload) => {
    if (!MAP_DEBUG) return;
    console.groupCollapsed(`[ImmigrationMap] ${label}`);
    console.debug(payload);
    console.groupEnd();
};

const isFeatureCollection = (candidate) => {
    return candidate?.type === 'FeatureCollection' && Array.isArray(candidate.features);
};

const extractFeatureCollection = (payload) => {
    if (isFeatureCollection(payload)) return payload;
    if (payload?.data && isFeatureCollection(payload.data)) return payload.data;
    if (payload?.document && isFeatureCollection(payload.document)) return payload.document;
    return null;
};

// MapLibre expressions are immutable once added, so we pre-build the single-hue stops (0–3+ options).
const colorExpression = [
    'case',
    ['==', ['get', 'visualPathwayCount'], 0], '#d8dce2',
    ['==', ['get', 'visualPathwayCount'], 1], '#bfe8f0',
    ['==', ['get', 'visualPathwayCount'], 2], '#3db1c1',
    '#116470'
];

const normalizePathway = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
        return { name: value, type: value };
    }

    if (typeof value === 'object') {
        return {
            name: value.name || value.title || value.pathway_type || value.type || null,
            type: value.pathway_type || value.type || value.category || null,
            description: value.description || value.summary || null
        };
    }

    return null;
};

const normalizeFeatures = (rawGeoJson) => {
    if (!rawGeoJson?.features) return { type: 'FeatureCollection', features: [] };

    const features = rawGeoJson.features.map((feature) => {
        const props = feature.properties || {};
        const countryName = props.name || props.country_name || props.ADMIN || props.NAME || 'Unknown';
        const isoCandidate = (props.iso2 || props.iso_a2 || props.iso || props.country_code || '').toString().toUpperCase();
        const iso2 = isoCandidate.length === 2 ? isoCandidate : null;

        const rawPaths = Array.isArray(props.pathways)
            ? props.pathways
            : Array.isArray(props.pathway_types)
                ? props.pathway_types
                : [];

        const pathwayDetails = [];
        rawPaths.forEach((raw) => {
            const normalized = normalizePathway(raw);
            if (normalized && (normalized.name || normalized.type)) {
                const alreadyPresent = pathwayDetails.some((entry) =>
                    entry.name === normalized.name && entry.type === normalized.type
                );
                if (!alreadyPresent) pathwayDetails.push(normalized);
            }
        });

        const pathwayTypes = Array.from(
            new Set(
                pathwayDetails
                    .map((entry) => entry.name || entry.type)
                    .filter(Boolean)
            )
        );

        const pathwayCount = pathwayTypes.length;
        // Cap to 3 so that 3+ pathways share the darkest saturation without adding more stops.
        const visualPathwayCount = pathwayCount === 0 ? 0 : Math.min(pathwayCount, 3);

        return {
            ...feature,
            id: iso2 || countryName,
            properties: {
                ...props,
                countryName,
                iso2,
                pathwayDetails,
                pathwayTypes,
                pathwayCount,
                visualPathwayCount
            }
        };
    });

    return { type: 'FeatureCollection', features };
};

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const query = window.matchMedia('(max-width: 768px)');
        const handleChange = (event) => setIsMobile(event.matches);
        setIsMobile(query.matches);
        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
};

const ImmigrationMap = () => {
    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    const tooltipRef = useRef(null);
    const tooltipTimer = useRef(null);
    const highlightedFeatureId = useRef(null);

    const [geoJson, setGeoJson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [activeFeature, setActiveFeature] = useState(null);

    const isMobile = useIsMobile();

    const normalizedGeoJson = useMemo(() => normalizeFeatures(geoJson), [geoJson]);

    const accessibleFeatures = useMemo(() => {
        // Keep the keyboard list alphabetized so users can reliably find countries via Tab order.
        return [...(normalizedGeoJson?.features || [])].sort((a, b) =>
            (a.properties.countryName || '').localeCompare(b.properties.countryName || '', undefined, { sensitivity: 'base' })
        );
    }, [normalizedGeoJson]);

    const mapIsInitialized = useRef(false);

    useEffect(() => {
        const initMap = () => {
            if (!mapContainer.current || mapInstance.current) return;
            const map = new maplibregl.Map({
                container: mapContainer.current,
                style: MAP_STYLE_URL,
                center: [0, 20],
                zoom: 1.25,
                minZoom: 1,
                maxZoom: 5,
                attributionControl: false
            });

            map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
            map.dragRotate.disable();
            map.touchZoomRotate.disableRotation();

            map.on('load', () => {
                mapIsInitialized.current = true;
                setMapReady(true);
            });

            mapInstance.current = map;
        };

        initMap();

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapReady || !normalizedGeoJson) return;
        const map = mapInstance.current;
        if (!map) return;

        if (map.getSource('country-data')) {
            map.getSource('country-data').setData(normalizedGeoJson);
        } else {
            map.addSource('country-data', {
                type: 'geojson',
                data: normalizedGeoJson
            });

            map.addLayer({
                id: 'country-fill',
                type: 'fill',
                source: 'country-data',
                paint: {
                    'fill-color': colorExpression,
                    'fill-opacity': 0.85
                }
            });

            map.addLayer({
                id: 'country-border',
                type: 'line',
                source: 'country-data',
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 0.5,
                    'line-opacity': 0.4
                }
            });

            map.addLayer({
                id: 'country-hover',
                type: 'line',
                source: 'country-data',
                paint: {
                    'line-color': '#f2e7d5',
                    'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 0],
                    'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0]
                }
            });
        }
    }, [mapReady, normalizedGeoJson]);

    useEffect(() => {
        if (!mapReady || !normalizedGeoJson) return;
        const map = mapInstance.current;
        if (!map) return;

        const clearHover = () => {
            if (highlightedFeatureId.current) {
                map.setFeatureState(
                    { source: 'country-data', id: highlightedFeatureId.current },
                    { hover: false }
                );
                highlightedFeatureId.current = null;
            }
        };

        const applyHighlight = (feature) => {
            const featureId = feature?.id;
            if (!featureId) return;
            if (highlightedFeatureId.current && highlightedFeatureId.current !== featureId) {
                map.setFeatureState(
                    { source: 'country-data', id: highlightedFeatureId.current },
                    { hover: false }
                );
            }
            map.setFeatureState({ source: 'country-data', id: featureId }, { hover: true });
            highlightedFeatureId.current = featureId;
        };

        const hideTooltip = () => {
            if (tooltipRef.current) {
                tooltipRef.current.dataset.visible = 'false';
            }
        };

        const scheduleTooltip = (feature, point) => {
            if (!feature || !tooltipRef.current) return;
            if (tooltipTimer.current) clearTimeout(tooltipTimer.current);

            // A small delay mitigates flicker during fast mouse moves and respects the requirement.
            tooltipTimer.current = window.setTimeout(() => {
                const props = feature.properties || {};
                tooltipRef.current.dataset.visible = 'true';
                tooltipRef.current.style.left = `${point.x + 12}px`;
                tooltipRef.current.style.top = `${point.y + 12}px`;
                tooltipRef.current.innerHTML = '';

                const title = document.createElement('strong');
                title.textContent = props.countryName;
                tooltipRef.current.appendChild(title);

                const countLine = document.createElement('div');
                countLine.textContent = `Pathway count: ${props.pathwayCount}`;
                tooltipRef.current.appendChild(countLine);

                const typesLine = document.createElement('div');
                const typesText = (props.pathwayTypes || []).join(', ');
                typesLine.textContent = typesText ? `Types: ${typesText}` : 'Types: None recorded';
                tooltipRef.current.appendChild(typesLine);

                const hint = document.createElement('div');
                hint.textContent = 'Click to view details';
                tooltipRef.current.appendChild(hint);
            }, TOOLTIP_DELAY_MS);
        };

        const handleMouseMove = (event) => {
            const features = map.queryRenderedFeatures(event.point, { layers: ['country-fill'] });
            if (!features.length) {
                clearHover();
                hideTooltip();
                return;
            }
            const feature = features[0];
            applyHighlight(feature);
            scheduleTooltip(feature, event.point);
        };

        const handleMouseLeave = () => {
            clearHover();
            if (tooltipTimer.current) {
                clearTimeout(tooltipTimer.current);
            }
            hideTooltip();
        };

        const handleClick = (event) => {
            const features = map.queryRenderedFeatures(event.point, { layers: ['country-fill'] });
            if (!features.length) return;
            const feature = features[0];
            setActiveFeature(feature);
            applyHighlight(feature);
            if (tooltipTimer.current) {
                clearTimeout(tooltipTimer.current);
            }
            hideTooltip();
        };

        map.on('mousemove', 'country-fill', handleMouseMove);
        map.on('mouseleave', 'country-fill', handleMouseLeave);
        map.on('click', 'country-fill', handleClick);

        return () => {
            map.off('mousemove', 'country-fill', handleMouseMove);
            map.off('mouseleave', 'country-fill', handleMouseLeave);
            map.off('click', 'country-fill', handleClick);
            if (tooltipTimer.current) {
                clearTimeout(tooltipTimer.current);
            }
        };
    }, [mapReady, normalizedGeoJson]);

const handleMapError = useCallback((failureType, details = {}) => {
    const message = FAILURE_MESSAGES[failureType] || 'Unable to show the map right now.';
    const detailsPayload = Object.keys(details).length ? safeStringify(details) : '{}';
    console.error(`[ImmigrationMap] ${failureType} ${detailsPayload}`);
    logMapDebug('Map load error', { failureType, ...details });
    setError(message);
    setActiveFeature(null);
}, []);

    useEffect(() => {
        const fetchGeo = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(COUNTRY_API_ENDPOINT);
                const status = response.status;
                const contentType = response.headers.get('content-type') || 'unknown';
                logMapDebug('Geo fetch response', { status, contentType, url: COUNTRY_API_ENDPOINT });

                if (!response.ok) {
                    const body = await response.text();
                    handleMapError('non2xx', {
                        status,
                        statusText: response.statusText,
                        contentType,
                        body: truncateText(body)
                    });
                    return;
                }

                const clone = response.clone();
                let payload;
                try {
                    payload = await response.json();
                } catch (jsonError) {
                    const body = await clone.text();
                    handleMapError('invalidJson', {
                        error: jsonError.message,
                        contentType,
                        body: truncateText(body)
                    });
                    return;
                }

                const featureCollection = extractFeatureCollection(payload);
                if (!featureCollection) {
                handleMapError('invalidGeoJson', {
                    payloadSample: truncateText(safeStringify(payload)),
                    contentType
                });
                    return;
                }

                if (!featureCollection.features.length) {
                    handleMapError('empty', {
                        featureCount: 0,
                        contentType
                    });
                    return;
                }

                logMapDebug('Geo feature sample', {
                    featureCount: featureCollection.features.length,
                    sample: featureCollection.features.slice(0, 2).map((feature) => ({
                        id: feature.id,
                        geometryType: feature.geometry?.type,
                        properties: {
                            name: feature.properties?.name || feature.properties?.country_name,
                            iso2: feature.properties?.iso2,
                            pathwayKeys: Array.isArray(feature.properties?.pathways) ? 'pathways' : Array.isArray(feature.properties?.pathway_types) ? 'pathway_types' : null
                        }
                    }))
                });

                setGeoJson(featureCollection);
            } catch (err) {
                handleMapError('network', { message: err.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchGeo();
    }, [handleMapError]);

    useEffect(() => {
        const handleResize = () => {
            mapInstance.current?.resize();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reuse the tooltip slot when shifting focus so NVDA/VoiceOver can read the same content as pointer users.
    const handleAccessibleFocus = useCallback((feature) => {
        if (!feature || !mapInstance.current) return;
        const map = mapInstance.current;
        const point = { x: map.getCanvas().width / 2, y: map.getCanvas().height / 2 };
        if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
        map.setFeatureState({ source: 'country-data', id: feature.id }, { hover: true });
        highlightedFeatureId.current = feature.id;
        if (tooltipRef.current) {
            tooltipRef.current.dataset.visible = 'true';
            tooltipRef.current.style.left = `${point.x}px`;
            tooltipRef.current.style.top = `${point.y}px`;
            tooltipRef.current.innerHTML = '';

            const title = document.createElement('strong');
            title.textContent = feature.properties.countryName;
            tooltipRef.current.appendChild(title);

            const countLine = document.createElement('div');
            countLine.textContent = `Pathway count: ${feature.properties.pathwayCount}`;
            tooltipRef.current.appendChild(countLine);

            const typesLine = document.createElement('div');
            const typesText = (feature.properties.pathwayTypes || []).join(', ');
            typesLine.textContent = typesText ? `Types: ${typesText}` : 'Types: None recorded';
            tooltipRef.current.appendChild(typesLine);

            const hint = document.createElement('div');
            hint.textContent = 'Press Enter to view details';
            tooltipRef.current.appendChild(hint);
        }
    }, []);

    const handleAccessibleBlur = useCallback(() => {
        if (!tooltipRef.current) return;
        tooltipRef.current.dataset.visible = 'false';
    }, []);

    const handleAccessibleSelection = useCallback((feature) => {
        if (!feature) return;
        setActiveFeature(feature);
    }, []);

    const handleAccessibleKeyDown = useCallback((event, feature) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleAccessibleSelection(feature);
        }
    }, [handleAccessibleSelection]);

    const handleCloseDrawer = () => setActiveFeature(null);

    const drawerLink = `/countries/${(activeFeature?.properties?.iso2 || '').toLowerCase()}`;

    return (
        <div className="map-panel">
            <div className="map-panel__header">
                <div>
                    <p className="map-panel__eyebrow">Global pathway index</p>
                    <h3 className="map-panel__title">See where verified pathways exist</h3>
                </div>
                <a className="map-panel__table-link" href="#country-table">View as table</a>
            </div>

            <div className="map-viewer" aria-live="polite">
                <div ref={mapContainer} className="map-viewer__canvas" />
                <div ref={tooltipRef} className="map-tooltip" role="tooltip" data-visible="false" />
                {isLoading && (
                    <div className="map-viewer__state">
                        <Loader2 className="map-viewer__loader" />
                        <p>Loading map data…</p>
                    </div>
                )}
                {error && (
                    <div className="map-viewer__state">
                        <p>Unable to show the map right now.</p>
                        <p className="text-xs opacity-70">{error}</p>
                    </div>
                )}

                <div className="map-accessibility-grid" aria-label="Country navigation">
                    {accessibleFeatures.map((feature) => (
                        <button
                            key={feature.id}
                            type="button"
                            className="map-accessibility-grid__item"
                            onFocus={() => handleAccessibleFocus(feature)}
                            onBlur={handleAccessibleBlur}
                            onClick={() => handleAccessibleSelection(feature)}
                            onKeyDown={(event) => handleAccessibleKeyDown(event, feature)}
                            aria-label={`View pathways for ${feature.properties.countryName}`}
                        >
                            {feature.properties.countryName}
                        </button>
                    ))}
                </div>
            </div>

            <div
                className={`country-drawer${activeFeature ? ' country-drawer--open' : ''}${isMobile ? ' country-drawer--mobile' : ''}`}
                role="dialog"
                aria-modal={isMobile}
                aria-labelledby={activeFeature ? 'country-drawer-title' : undefined}
            >
                <div className="country-drawer__header">
                    <h4 id="country-drawer-title">{activeFeature?.properties?.countryName || 'Select a country'}</h4>
                    <button type="button" onClick={handleCloseDrawer} className="country-drawer__close" aria-label="Close country details">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {activeFeature ? (
                    <div className="country-drawer__body">
                        <p className="text-xs uppercase tracking-wide text-surface-500">
                            ISO: {activeFeature.properties.iso2 || 'N/A'}
                        </p>
                        <p className="text-sm text-surface-600 mb-4">
                            Pathway count: {activeFeature.properties.pathwayCount}
                        </p>
                        <div className="country-drawer__list">
                            {(activeFeature.properties.pathwayDetails || []).map((pathway, index) => (
                                <article className="country-drawer__row" key={`${activeFeature.id}-${index}`}>
                                    <div>
                                        <p className="country-drawer__row-title">{pathway.name || pathway.type}</p>
                                        <p className="country-drawer__row-subtitle">{pathway.type || 'Pathway'}</p>
                                    </div>
                                    {pathway.description && (
                                        <p className="country-drawer__row-copy">{pathway.description}</p>
                                    )}
                                </article>
                            ))}
                            {(activeFeature.properties.pathwayDetails || []).length === 0 && (
                                <p className="text-xs text-surface-500">Pathway details are not available in this snapshot.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="country-drawer__body">
                        <p className="text-sm text-surface-600">Select a country on the map to see the available pathways.</p>
                    </div>
                )}
                <div className="country-drawer__footer">
                    <a
                        href={activeFeature ? drawerLink : '#'}
                        className="country-drawer__button"
                        onClick={(event) => {
                            if (!activeFeature) event.preventDefault();
                        }}
                    >
                        View full country profile
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ImmigrationMap;
