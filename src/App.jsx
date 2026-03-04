import React, { useState, useMemo, useEffect } from 'react';
import { Shield, MapPin, Anchor, Heart, AlertTriangle, Loader2, ArrowLeft, FileText, ChevronRight, BookmarkPlus } from 'lucide-react';
import './index.css';
import { PassagrLockup } from './components/PassagrMarks.jsx';
import { fetchCountries, fetchCountryById, fetchCountrySources, fetchVisaPaths, fetchVisaPathDetail, createSavedPath, fetchSaveContexts } from './lib/api';
import { formatVerifiedDate, formatProcessingRange } from './lib/formatters';
import ImmigrationMap from './components/ImmigrationMap.jsx';
import MapErrorBoundary from './components/MapErrorBoundary.jsx';
import { SavedPathsPage } from './components/SavedPathsPage.jsx';
import { PrivacyPage } from './components/PrivacyPage.jsx';
import { PathChecklistExperience } from './components/PathChecklistExperience.jsx';

// --- UTILITY FUNCTIONS ---

const getSafetyColor = (index) => {
    if (index === 5) return 'bg-secondary-600 text-surface-600 hover:text-green';
    if (index >= 4) return 'bg-secondary-500 text-surface-600 hover:text-green';
    if (index >= 2) return 'bg-accent-500 text-surface-600 hover:text-yellow';
    return 'bg-red-500 text-surface-600 hover:text-red';
};

const getSafetyVibe = (index) => {
    if (index === 5) return 'Excellent Protection';
    if (index >= 4) return 'Strong Legal Framework';
    if (index >= 2) return 'Basic Recognition';
    return 'High Caution';
};

const isoToFlag = (iso2) => {
    if (!iso2 || iso2.length !== 2) return '';
    const codePoints = iso2
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

const humanizeToken = (value) => {
    if (typeof value !== 'string') return '';
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const toTitleCase = (value) => {
    const input = humanizeToken(value);
    if (!input) return '';
    return input
        .split(' ')
        .map((word) => {
            if (!word) return word;
            if (/^[A-Z0-9]{2,4}$/.test(word)) return word;
            if (/^[A-Za-z]+\/[A-Za-z_]+$/.test(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

const formatDisplay = (value, style = 'title') => {
    if (typeof value !== 'string') return '';
    if (/^[A-Za-z]+\/[A-Za-z_]+$/.test(value)) return value;
    if (/^[A-Z]{2,5}$/.test(value)) return value;
    if (style === 'title') return toTitleCase(value);
    const normalized = humanizeToken(value);
    return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase() : '';
};

const formatList = (value, style = 'title') => {
    if (Array.isArray(value)) return value.filter(Boolean).map((entry) => formatDisplay(entry, style)).join(', ');
    if (typeof value === 'string') return formatDisplay(value, style);
    return '';
};

const normalizeVisaPathTypeLabel = (type) => {
    if (typeof type !== 'string' || !type.trim()) return 'Unspecified';
    const key = type.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    const labelMap = {
        work: 'Skilled Work',
        skilled_work: 'Skilled Work',
        remote_work: 'Remote Work',
        digital_nomad: 'Digital Nomad',
        retirement: 'Retirement',
        passive_income: 'Passive Income',
        study: 'Study',
        family: 'Family',
        asylum: 'Asylum / Protection',
        protection: 'Asylum / Protection',
        special_status: 'Special Status',
        ancestry: 'Ancestry'
    };
    return labelMap[key] || toTitleCase(type);
};

const normalizeSourceLabel = (value) => {
    const label = humanizeToken(value);
    if (!label) return '';
    if (/^(file|source|doc|web)\s+\d+$/i.test(label)) return toTitleCase(label);
    return value;
};

const extractCitations = (text) => {
    if (!text) return { text, citations: [] };
    const citations = [];
    const replaced = text.replace(/\[(file|source|doc|web):([^\]]+)\]/gi, (_, type, id) => {
        const key = `${type.toLowerCase()}:${id}`;
        let index = citations.indexOf(key);
        if (index === -1) {
            citations.push(key);
            index = citations.length - 1;
        }
        return `[[CITATION_${index + 1}]]`;
    });
    return { text: replaced, citations };
};

const buildSourceIndex = (sources) => {
    const index = new Map();
    (sources || []).forEach((source) => {
        (source?.file_refs || []).forEach((ref) => {
            if (!index.has(ref)) {
                index.set(ref, []);
            }
            index.get(ref).push(source);
        });
    });
    return index;
};

const renderCitedText = (text, sourceIndex) => {
    const { text: withTokens, citations } = extractCitations(text);
    if (!withTokens) return { nodes: null, citations: [], sources: [] };
    const parts = withTokens.split(/(\[\[CITATION_\d+\]\])/g);
    const nodes = parts.map((part, index) => {
        const match = part.match(/\[\[CITATION_(\d+)\]\]/);
        if (match) {
            return (
                <sup key={`cite-${index}`} className="text-xs text-surface-500 ml-1 align-super">
                    {match[1]}
                </sup>
            );
        }
        return <span key={`text-${index}`}>{part}</span>;
    });

    const sources = [];
    const seen = new Set();
    citations.forEach((citationKey) => {
        const matching = sourceIndex?.get(citationKey) || [];
        if (matching.length === 0) {
            const fallback = { label: normalizeSourceLabel(citationKey.replace(':', ' ')) };
            const key = fallback.label;
            if (!seen.has(key)) {
                sources.push(fallback);
                seen.add(key);
            }
            return;
        }
        matching.forEach((source) => {
            const label = normalizeSourceLabel(source?.title || source?.publisher || source?.url || citationKey);
            const key = source?.url || label;
            if (seen.has(key)) return;
            sources.push({
                label,
                url: source?.url || null,
                publisher: source?.publisher || null,
                retrieved_at: source?.retrieved_at || null
            });
            seen.add(key);
        });
    });

    return { nodes, citations, sources };
};

const extractFileRefsFromText = (text) => {
    if (!text || typeof text !== 'string') return [];
    const refs = [];
    const matches = text.matchAll(/\[(file|source|doc|web):([^\]]+)\]/gi);
    for (const match of matches) {
        refs.push(`${match[1].toLowerCase()}:${match[2]}`);
    }
    return Array.from(new Set(refs));
};

const AbortionStatusBadge = ({ status, tier }) => {
    let color = 'bg-surface-100 text-surface-700';
    let icon = <AlertTriangle className="w-3 h-3 mr-1" />;

    if (tier === 'protected') {
        color = 'bg-surface-100 text-surface-600 border-surface-200 hover:text-green';
        icon = <Heart className="w-3 h-3 mr-1" />;
    } else if (tier === 'restricted') {
        color = 'bg-surface-100 text-surface-600 border-surface-200 hover:text-red';
        icon = <AlertTriangle className="w-3 h-3 mr-1" />;
    } else if (tier === 'decriminalized') {
        color = 'bg-surface-100 text-surface-600 border-surface-200 hover:text-yellow';
    }

    const label = status || (tier ? tier.replace('_', ' ') : 'Unknown');

    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${color}`}>
            {icon} {label}
        </span>
    );
};

// --- COMPONENTS ---

const CountryCard = ({ country, onClick }) => {
    const safetyClass = getSafetyColor(country.lgbtq_rights_index);
    const pathwayCount = typeof country.pathway_count === 'number' ? country.pathway_count : 0;
    const pathwayTypes = Array.isArray(country.pathway_types) ? country.pathway_types : [];
    const ctaLabel = pathwayCount > 0 ? 'View pathways' : 'View country profile';

    return (
        <div
            onClick={() => onClick(country)}
            className="group py-6 border-t border-surface-200 cursor-pointer transition-all flex flex-col justify-between hover:bg-surface-100/50 -mx-4 px-4 md:mx-0 md:px-0"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-serif font-bold text-ink group-hover:text-primary-600 transition-colors">
                        {country.name}
                    </h3>
                    <span className="text-sm font-sans text-surface-500 font-medium tracking-wide">{country.iso2}</span>
                </div>
                {country.regions && (
                    <span className="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded-md">
                        {country.regions[0]}
                    </span>
                )}
            </div>

            <div className="pt-2">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                    Abortion Access
                </p>
                <AbortionStatusBadge status={country.abortion_access_status} tier={country.abortion_access_tier} />
            </div>
            <div className="space-y-4">
                <div className={`py-3 flex items-center justify-between ${safetyClass} bg-transparent p-0 text-surface-500`}>
                    <Shield className="w-6 h-6 opacity-90" />
                    <div className="text-right">
                        <p className="text-xl font-bold leading-none">{country.lgbtq_rights_index}/5</p>
                        <p className="text-xs font-medium opacity-90 mt-1">{getSafetyVibe(country.lgbtq_rights_index)}</p>
                    </div>
                </div>

                <div className="pt-2">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Immigration Pathways</p>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-surface-700">
                            {pathwayCount > 0 ? `${pathwayCount} verified` : 'No verified pathways yet'}
                        </span>
                        <span className="inline-flex items-center text-xs font-semibold text-primary-700 group-hover:text-primary-800 transition-colors">
                            {ctaLabel} <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                    </div>
                    {pathwayCount > 0 && pathwayTypes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {pathwayTypes.slice(0, 4).map((type) => (
                                <span key={type} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-surface-100 text-surface-700">
                                    {type}
                                </span>
                            ))}
                            {pathwayTypes.length > 4 && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-surface-100 text-surface-700">
                                    +{pathwayTypes.length - 4} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 text-xs text-surface-400 pt-4 border-t border-surface-100 flex items-center justify-between">
                <span>{country.last_verified_at ? 'Verified' : 'Verification status'}</span>
                <span>{formatVerifiedDate(country.last_verified_at)}</span>
            </div>
        </div>
    );
};

const VisaPathList = ({ countryId, countryName: initialCountryName, onSelectPath, onBack }) => {
    const [paths, setPaths] = useState([]);
    const [countryName, setCountryName] = useState(initialCountryName || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        setCountryName(initialCountryName || '');
    }, [initialCountryName]);

    useEffect(() => {
        if (countryId) {
            setLoading(true);
            Promise.all([
                fetchVisaPaths(countryId),
                fetchCountryById(countryId).catch(() => null)
            ])
                .then(([pathData, countryData]) => {
                    setPaths(pathData);
                    if (countryData?.name) {
                        setCountryName(countryData.name);
                    }
                    setError(null);
                })
                .catch((err) => {
                    console.error(err);
                    setError(err?.message || 'Unable to load visa pathways.');
                })
                .finally(() => setLoading(false));
        }
    }, [countryId, reloadToken]);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" /></div>;
    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <button onClick={onBack} className="flex items-start text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Country Profile
                </button>
                <div className="emptyState text-left">
                    <p className="emptyState__title">Unable to load visa pathways</p>
                    <p className="emptyState__detail">{error}</p>
                    <button
                        type="button"
                        onClick={() => setReloadToken((value) => value + 1)}
                        className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-wide text-primary-700 hover:text-primary-800 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="relative z-10 pathways-page">
                <button onClick={onBack} className="flex items-start text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Country Profile
                </button>
                <div className="pathways-page__hero">
                    <p className="pathways-page__eyebrow">Immigration Pathways</p>
                    <h2 className="pathways-page__title">{countryName || 'Country'}</h2>
                    <p className="pathways-page__sub">
                        Structured options in the current snapshot. Compare type and requirements to choose your next review.
                    </p>
                    <div className="pathways-page__meta">
                        <span className="pathways-page__count">{paths.length}</span>
                        <span>{paths.length === 1 ? 'pathway' : 'pathways'} available</span>
                    </div>
                </div>
                <div className="pathways-grid">
                    {paths.map(path => (
                        <button
                            key={path.id}
                            onClick={() => onSelectPath(path.id)}
                            className="country-card pathway-card group"
                            type="button"
                        >
                            <div className="pathway-card__content">
                                <div className="country-card__top">
                                    <span className="country-card__chip">{formatDisplay(path.type)}</span>
                                </div>
                                <h3 className="country-card__title pathway-card__title">{path.name}</h3>
                                <p className="pathway-card__description">{path.description || 'No description provided yet.'}</p>
                                <div className="country-card__footer">
                                    <span className="country-card__meta">Review pathway</span>
                                    <span className="pathway-card__cta">Open</span>
                                </div>
                            </div>
                            <ChevronRight className="pathway-card__chevron w-5 h-5" />
                        </button>
                    ))}
                    {paths.length === 0 && (
                        <div className="text-center py-10 text-surface-500 border-2 border-dashed border-surface-200 rounded-sm">
                            <p>No verified pathways yet.</p>
                            <p className="text-xs mt-2 text-surface-400">This snapshot may not include all national options.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CountryProfile = ({ countryId, onBack, hasPathways, onViewPathways, onViewSources, onLoadCountry }) => {
    const [country, setCountry] = useState(null);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const sourceIndex = buildSourceIndex(sources);
    const rightsContent = country?.rights_snapshot ? renderCitedText(country.rights_snapshot, sourceIndex) : null;
    const healthcareContent = country?.healthcare_overview ? renderCitedText(country.healthcare_overview, sourceIndex) : null;
    const taxContent = country?.tax_snapshot ? renderCitedText(country.tax_snapshot, sourceIndex) : null;
    const safetyContent = country?.hate_crime_law_snapshot ? renderCitedText(country.hate_crime_law_snapshot, sourceIndex) : null;
    const aggregatedSources = (() => {
        const items = [
            ...(rightsContent?.sources || []),
            ...(healthcareContent?.sources || []),
            ...(taxContent?.sources || []),
            ...(safetyContent?.sources || [])
        ];
        const seen = new Set();
        return items.filter((source) => {
            const key = source?.url || source?.label;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    })();

    useEffect(() => {
        if (!countryId) return;
        setLoading(true);
        setError(null);
        Promise.all([fetchCountryById(countryId), fetchCountrySources(countryId)])
            .then(([countryData, sourcesData]) => {
                setCountry(countryData);
                setSources(sourcesData?.sources || []);
                if (onLoadCountry) onLoadCountry(countryData);
            })
            .catch((err) => setError(err?.message || 'Failed to load country profile'))
            .finally(() => setLoading(false));
    }, [countryId, onLoadCountry, reloadToken]);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" /></div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="relative z-10">
                <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Countries
                </button>

                {error ? (
                    <div className="emptyState text-left">
                        <p className="emptyState__title">Country profile unavailable</p>
                        <p className="emptyState__detail">{error}</p>
                        <button
                            type="button"
                            onClick={() => setReloadToken((value) => value + 1)}
                            className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-wide text-primary-700 hover:text-primary-800 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : !country ? (
                    <div className="emptyState text-left">
                        <p className="emptyState__title">Country not found</p>
                        <p className="emptyState__detail">This country could not be loaded.</p>
                    </div>
                ) : (
                    <>
                        <div className="country-hero">
                            <div className="country-hero__title">
                                <span className="country-hero__flag" aria-hidden="true">
                                    {isoToFlag(country.iso2)}
                                </span>
                                <div>
                                    <h1 className="text-4xl font-serif font-bold text-primary-900 mb-2 mt-6">{country.name}</h1>
                                    <div className="country-hero__meta">
                                        <span className="country-hero__iso">{country.iso2}</span>
                                        {country.last_verified_at && (
                                            <span className="country-hero__verified">
                                                <div className="mb-6">
                                                    Last verified {formatVerifiedDate(country.last_verified_at)}
                                                </div>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="country-hero__row">
                                {formatList(country.regions) && (
                                    <div className="country-hero__item">
                                        <span>Region</span>
                                        <strong>{formatList(country.regions)}</strong>
                                    </div>
                                )}
                                {formatList(country.languages) && (
                                    <div className="country-hero__item">
                                        <span>Languages</span>
                                        <strong>{formatList(country.languages)}</strong>
                                    </div>
                                )}
                                {formatList(country.timezones) && (
                                    <div className="country-hero__item">
                                        <span>Time zone</span>
                                        <strong>{formatList(country.timezones)}</strong>
                                    </div>
                                )}
                                {country.currency && (
                                    <div className="country-hero__item">
                                        <span>Currency</span>
                                        <strong>{country.currency}</strong>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="country-snapshot">
                            <div className="country-snapshot__header">
                                <h2 className="text-xl font-serif font-bold text-ink">Key Snapshot</h2>
                            </div>
                            <div className="country-snapshot__grid">
                                <div className="country-snapshot__item">
                                    <span>Verified pathways</span>
                                    <strong>{hasPathways === true ? 'Available' : hasPathways === false ? 'None yet' : 'Check availability'}</strong>
                                </div>
                                <div className="country-snapshot__item">
                                    <span>LGBTQ+ rights</span>
                                    <strong>{country.lgbtq_rights_index ? `${getSafetyVibe(country.lgbtq_rights_index)} · ${country.lgbtq_rights_index}/5` : 'Data coming soon'}</strong>
                                </div>
                                <div className="country-snapshot__item">
                                    <span>Reproductive rights</span>
                                    <strong>{country.abortion_access_status ? formatDisplay(country.abortion_access_status) : 'Data coming soon'}</strong>
                                </div>
                                <div className="country-snapshot__item">
                                    <span>Healthcare</span>
                                    <strong>{country.healthcare_overview ? 'Overview available' : 'Data coming soon'}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="country-sections">
                            <section className="profile-card">
                                    <div className="profile-card__header hover:text-accent-500">
                                        <h3>Immigration pathways</h3>
                                    <button
                                        type="button"
                                        onClick={onViewPathways}
                                        className="profile-card__link"
                                    >
                                        View pathways
                                    </button>
                                </div>
                                <p className="profile-card__body">
                                    {hasPathways === true
                                        ? 'Verified pathways are available for this destination.'
                                        : hasPathways === false
                                            ? 'No verified pathways yet.'
                                            : 'Check for verified pathways in the current snapshot.'}
                                </p>
                            </section>

                            {rightsContent && (() => {
                                const { nodes, sources: citedSources } = rightsContent;
                                return (
                                    <section className="profile-card">
                                        <div className="profile-card__header">
                                            <h3>Rights snapshot</h3>
                                        </div>
                                        <p className="profile-card__body whitespace-pre-wrap">{nodes}</p>
                                        {citedSources.length > 0 && (
                                            <div className="profile-card__sources">
                                                Sources:{' '}
                                                {citedSources.map((source, index) => (
                                                    <span key={`rights-source-${index}`}>
                                                        {source.url ? (
                                                            <a href={source.url} target="_blank" rel="noreferrer">
                                                                {source.label}
                                                            </a>
                                                        ) : (
                                                            <span>{source.label}</span>
                                                        )}
                                                        {index < citedSources.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                                {' '}
                                                <button type="button" className="profile-card__link profile-card__link--inline" onClick={() => onViewSources?.('rights')}>
                                                    View all sources
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                );
                            })()}

                            {healthcareContent && (() => {
                                const { nodes, sources: citedSources } = healthcareContent;
                                return (
                                    <section className="profile-card">
                                        <div className="profile-card__header">
                                            <h3>Healthcare overview</h3>
                                        </div>
                                        <p className="profile-card__body whitespace-pre-wrap">{nodes}</p>
                                        {citedSources.length > 0 && (
                                            <div className="profile-card__sources">
                                                Sources:{' '}
                                                {citedSources.map((source, index) => (
                                                    <span key={`health-source-${index}`}>
                                                        {source.url ? (
                                                            <a href={source.url} target="_blank" rel="noreferrer">
                                                                {source.label}
                                                            </a>
                                                        ) : (
                                                            <span>{source.label}</span>
                                                        )}
                                                        {index < citedSources.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                                {' '}
                                                <button type="button" className="profile-card__link profile-card__link--inline" onClick={() => onViewSources?.('healthcare')}>
                                                    View all sources
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                );
                            })()}

                            {taxContent && (() => {
                                const { nodes, sources: citedSources } = taxContent;
                                return (
                                    <section className="profile-card">
                                        <div className="profile-card__header">
                                            <h3>Tax snapshot</h3>
                                        </div>
                                        <p className="profile-card__body whitespace-pre-wrap">{nodes}</p>
                                        {citedSources.length > 0 && (
                                            <div className="profile-card__sources">
                                                Sources:{' '}
                                                {citedSources.map((source, index) => (
                                                    <span key={`tax-source-${index}`}>
                                                        {source.url ? (
                                                            <a href={source.url} target="_blank" rel="noreferrer">
                                                                {source.label}
                                                            </a>
                                                        ) : (
                                                            <span>{source.label}</span>
                                                        )}
                                                        {index < citedSources.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                                {' '}
                                                <button type="button" className="profile-card__link profile-card__link--inline" onClick={() => onViewSources?.('tax')}>
                                                    View all sources
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                );
                            })()}

                            {safetyContent && (() => {
                                const { nodes, sources: citedSources } = safetyContent;
                                return (
                                    <section className="profile-card">
                                        <div className="profile-card__header">
                                            <h3>Safety notes</h3>
                                        </div>
                                        <p className="profile-card__body whitespace-pre-wrap">{nodes}</p>
                                        {citedSources.length > 0 && (
                                            <div className="profile-card__sources">
                                                Sources:{' '}
                                                {citedSources.map((source, index) => (
                                                    <span key={`safety-source-${index}`}>
                                                        {source.url ? (
                                                            <a href={source.url} target="_blank" rel="noreferrer">
                                                                {source.label}
                                                            </a>
                                                        ) : (
                                                            <span>{source.label}</span>
                                                        )}
                                                        {index < citedSources.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                                {' '}
                                                <button type="button" className="profile-card__link profile-card__link--inline" onClick={() => onViewSources?.('safety')}>
                                                    View all sources
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                );
                            })()}

                            {(country.climate_tags || country.timezones) && (
                                <section className="profile-card">
                                    <div className="profile-card__header">
                                        <h3>Climate & time</h3>
                                    </div>
                                    <p className="profile-card__body">
                                        {formatList(country.climate_tags) && (
                                            <span>Climate: {formatList(country.climate_tags)}. </span>
                                        )}
                                        {formatList(country.timezones) && (
                                            <span>Time zone: {formatList(country.timezones)}.</span>
                                        )}
                                    </p>
                                </section>
                            )}

                            {aggregatedSources.length > 0 && (
                                <section className="profile-card">
                                    <div className="profile-card__header">
                                        <h3>Sources</h3>
                                        <button type="button" onClick={() => onViewSources?.('all')} className="profile-card__link">
                                            Open sources page
                                        </button>
                                    </div>
                                    <div className="profile-card__body">
                                        {aggregatedSources.map((source, index) => (
                                            <div key={`agg-source-${index}`}>
                                                {source.url ? (
                                                    <a href={source.url} target="_blank" rel="noreferrer">
                                                        {source.label}
                                                    </a>
                                                ) : (
                                                    <span>{source.label}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const CountrySourcesPage = ({ countryId, onBack }) => {
    const [country, setCountry] = useState(null);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!countryId) return;
        setLoading(true);
        setError(null);
        Promise.all([fetchCountryById(countryId), fetchCountrySources(countryId)])
            .then(([countryData, sourceData]) => {
                setCountry(countryData);
                setSources(sourceData?.sources || []);
            })
            .catch((err) => setError(err?.message || 'Unable to load sources.'))
            .finally(() => setLoading(false));
    }, [countryId]);

    const sectionRefs = useMemo(() => ({
        rights: extractFileRefsFromText(country?.rights_snapshot),
        healthcare: extractFileRefsFromText(country?.healthcare_overview),
        tax: extractFileRefsFromText(country?.tax_snapshot),
        safety: extractFileRefsFromText(country?.hate_crime_law_snapshot)
    }), [country]);

    const getUsedIn = (source) => {
        const refs = Array.isArray(source?.file_refs) ? source.file_refs : [];
        const usedIn = [];
        if (refs.some((ref) => sectionRefs.rights.includes(ref))) usedIn.push('Rights');
        if (refs.some((ref) => sectionRefs.healthcare.includes(ref))) usedIn.push('Healthcare');
        if (refs.some((ref) => sectionRefs.tax.includes(ref))) usedIn.push('Tax');
        if (refs.some((ref) => sectionRefs.safety.includes(ref))) usedIn.push('Safety');
        return usedIn;
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" /></div>;
    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Country Profile
                </button>
                <div className="emptyState text-left">
                    <p className="emptyState__title">Sources unavailable</p>
                    <p className="emptyState__detail">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Country Profile
            </button>
            <div className="pathways-page__hero">
                <p className="pathways-page__eyebrow">Evidence</p>
                <h1 className="pathways-page__title">Sources for {country?.name || 'Country'}</h1>
                <p className="pathways-page__sub">
                    Reference materials used in this snapshot. Each source is mapped to relevant profile sections when possible.
                </p>
                <div className="pathways-page__meta">
                    <span className="pathways-page__count">{sources.length}</span>
                    <span>{sources.length === 1 ? 'source' : 'sources'}</span>
                </div>
            </div>

            <div className="sources-grid">
                {sources.map((source, index) => {
                    const usedIn = getUsedIn(source);
                    return (
                        <article key={`${source.url || source.title || 'source'}-${index}`} className="country-card source-card">
                            <div className="country-card__top">
                                <h3 className="country-card__title source-card__title">{source.title || 'Source'}</h3>
                            </div>
                            <p className="country-card__meta source-card__meta">
                                {source.publisher ? `${formatDisplay(source.publisher)} · ` : ''}
                                {source.reliability ? `Reliability: ${formatDisplay(source.reliability)}` : 'Reliability: Not specified'}
                            </p>
                            <div className="country-card__footer source-card__footer">
                                {source.retrieved_at ? (
                                    <span className="country-card__meta source-card__meta">Retrieved {formatVerifiedDate(source.retrieved_at)}</span>
                                ) : (
                                    <span className="country-card__meta source-card__meta">No retrieval date</span>
                                )}
                                {source.url ? (
                                    <a className="source-card__link" href={source.url} target="_blank" rel="noreferrer">
                                        Open source
                                    </a>
                                ) : (
                                    <span className="country-card__meta source-card__meta">No URL</span>
                                )}
                            </div>
                            {usedIn.length > 0 && (
                                <div className="source-card__chips">
                                    {usedIn.map((label) => (
                                        <span key={label} className="country-card__chip source-card__chip">{label}</span>
                                    ))}
                                </div>
                            )}
                        </article>
                    );
                })}
                {sources.length === 0 && (
                    <div className="emptyState text-left">
                        <p className="emptyState__title">No sources in this snapshot</p>
                        <p className="emptyState__detail">This country currently has no source metadata attached.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const VisaPathDetail = ({ pathId, onBack, onResolveCountryId, countryName }) => {
    const [path, setPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [resolvedCountryName, setResolvedCountryName] = useState(countryName || '');
    const [contexts, setContexts] = useState([]);
    const [saveContextId, setSaveContextId] = useState('');
    const [saveLabel, setSaveLabel] = useState('');
    const [savingPath, setSavingPath] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    useEffect(() => {
        if (pathId) {
            setLoading(true);
            fetchVisaPathDetail(pathId)
                .then((data) => {
                    setPath(data);
                    setError(null);
                    if (onResolveCountryId && data?.country_id) {
                        onResolveCountryId(data.country_id);
                    }
                })
                .catch((err) => {
                    console.error(err);
                    setError(err?.message || 'Unable to load visa pathway details.');
                })
                .finally(() => setLoading(false));
        }
    }, [pathId, reloadToken]);

    useEffect(() => {
        if (countryName) {
            setResolvedCountryName(countryName);
        }
    }, [countryName]);

    useEffect(() => {
        const countryId = path?.country_id;
        if (!countryId || resolvedCountryName) return;
        fetchCountryById(countryId)
            .then((country) => {
                if (country?.name) {
                    setResolvedCountryName(country.name);
                }
            })
            .catch(() => {});
    }, [path?.country_id, resolvedCountryName]);

    useEffect(() => {
        fetchSaveContexts()
            .then((rows) => setContexts(rows))
            .catch(() => setContexts([]));
    }, []);

    const handleSavePath = async () => {
        if (!path?.id) return;
        setSavingPath(true);
        setSaveStatus(null);
        try {
            await createSavedPath({
                canonicalPathId: path.id,
                contextId: saveContextId || null,
                savedLabel: saveLabel || null
            });
            setSaveStatus({ type: 'success', message: 'Path saved.' });
        } catch (err) {
            setSaveStatus({ type: 'error', message: err?.message || 'Unable to save path.' });
        } finally {
            setSavingPath(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" /></div>;
    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pathways
                </button>
                <div className="emptyState text-left">
                    <p className="emptyState__title">Visa pathway unavailable</p>
                    <p className="emptyState__detail">{error}</p>
                    <button
                        type="button"
                        onClick={() => setReloadToken((value) => value + 1)}
                        className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-wide text-primary-700 hover:text-primary-800 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    if (!path) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pathways
                </button>
                <div className="emptyState text-left">
                    <p className="emptyState__title">Visa pathway not found</p>
                    <p className="emptyState__detail">This pathway could not be loaded.</p>
                </div>
            </div>
        );
    }

    const processingLabel = formatProcessingRange(path.processing_min_days, path.processing_max_days);
    const normalizedTypeLabel = normalizeVisaPathTypeLabel(path.type);

    return (
        <><div className="max-w-4xl mx-auto px-4 py-10">

            <div className="relative z-10">
                <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pathways
                </button>
                <div class="pathways-page__hero">
                    {resolvedCountryName && (
                        <p className="pathways-page__eyebrow">{resolvedCountryName}</p>
                    )}
                    <h2 className="pathways-page__title">{path.name}</h2>
                    <p className="pathways-page__sub">{path.description}</p>
                    <div className="pathways-page__meta">
                        <span className="country-card__chip">{normalizedTypeLabel}</span>
                    </div>
                    {processingLabel && (
                        <div className="pathways-page__meta">
                            <span className="country-card__chip">{processingLabel}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="border-top border-surface-200 overflow-hidden">
                <PathChecklistExperience visaPathId={path.id} />
            </div>
            <div className="p-6 border-t border-surface-200 bg-surface-50">
                <div className="flex items-center gap-2 mb-2">
                    <BookmarkPlus className="w-4 h-4 text-primary-600" />
                    <h3 className="text-sm font-semibold text-surface-800">Save Path</h3>
                </div>
                <p className="text-xs text-surface-500 mb-3">Save this path to track it in your personal workspace.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                        value={saveLabel}
                        onChange={(e) => setSaveLabel(e.target.value)}
                        placeholder="Optional label"
                        className="border border-surface-300 px-2 py-1 text-sm"
                    />
                    <select
                        value={saveContextId}
                        onChange={(e) => setSaveContextId(e.target.value)}
                        className="border border-surface-300 px-2 py-1 text-sm"
                    >
                        <option value="">No context</option>
                        {contexts.map((ctx) => (
                            <option key={ctx.id} value={ctx.id}>{ctx.name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleSavePath}
                        disabled={savingPath}
                        className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-50"
                    >
                        {savingPath ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookmarkPlus className="w-3 h-3" />}
                        Save path
                    </button>
                </div>
                {saveStatus && (
                    <p className={`text-xs mt-2 ${saveStatus.type === 'error' ? 'text-red-700' : 'text-primary-700'}`}>
                        {saveStatus.message}
                    </p>
                )}
            </div>
        </div><div className="border-top border-surface-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-surface-100 bg-surface-50">
                    <h2 className="text-2xl font-serif font-bold flex items-center">
                        Process Steps
                    </h2>
                </div>
                <div className="p-6">
                    {Array.isArray(path.steps) && path.steps.length > 0 ? (
                        <ol className="space-y-4">
                            {path.steps.map((step) => (
                                <li key={step.id} className="p-4 border border-surface-200 rounded-sm bg-var(--color-ivory)">
                                    <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                                        Step {step.order_int ?? ''}
                                    </p>
                                    <p className="text-lg font-semibold text-surface-900">{step.title || 'Untitled step'}</p>
                                    {step.description && (
                                        <p className="text-sm text-surface-600 mt-2">{step.description}</p>
                                    )}
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-surface-500 italic">No steps have been listed for this pathway yet.</p>
                    )}
                </div>
            </div></>
    );
};

const CountryFilterContainer = ({ onSelectCountry, onOpenSavedPaths, onOpenPrivacy }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [minLgbtqIndex, setMinLgbtqIndex] = useState(3);
    const [accessFilter, setAccessFilter] = useState('All');
    const [regionFilter, setRegionFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState(null);
    const [mapSelectionError, setMapSelectionError] = useState(null);
    const [mapSelectionIso2, setMapSelectionIso2] = useState(null);

    useEffect(() => {
        const loadCountries = async () => {
            try {
                setIsLoading(true);
                const data = await fetchCountries();
                setCountries(data);
            } catch (err) {
                console.error("Error fetching countries:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadCountries();
    }, []);

    const availableRegions = useMemo(() => {
        const regions = new Set();
        countries.forEach(c => c.regions && c.regions.forEach(r => regions.add(r)));
        return Array.from(regions).sort();
    }, [countries]);

    const filteredCountries = useMemo(() => {
        return countries.filter(country => {
            const nameMatch = country.name.toLowerCase().includes(searchQuery.toLowerCase());
            const lgbtqMatch = country.lgbtq_rights_index >= minLgbtqIndex;
            const accessMatch = accessFilter === 'All' ||
                (country.abortion_access_tier && country.abortion_access_tier === accessFilter);
            const regionMatch = regionFilter === 'All' || (country.regions && country.regions.includes(regionFilter));

            return nameMatch && lgbtqMatch && accessMatch && regionMatch;
        });
    }, [countries, searchQuery, minLgbtqIndex, accessFilter, regionFilter]);   

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
{/* Editorial Masthead */}
<header className="relative z-10 bg-surface-50 text-surface-900 pt-10 pb-7 px-4 md:px-8 border-b border-surface-200">
  <div className="max-w-7xl mx-auto flex items-start justify-between gap-5">
    {/* Left stack: lockup + tagline (nested) */}
    <div className="flex flex-col items-start gap-2">
      <div className="masthead__brand">
        <span className="masthead__sigil" aria-hidden="true">
          <PassagrLockup className="masthead__lockup" />
        </span>
        <span className="masthead__dot" aria-hidden="true" />
      </div>

      <p className="max-w-2xl text-xs md:text-sm text-surface-500 font-medium tracking-wide text-left leading-relaxed">
        Verified immigration pathways prioritized by safety, rights, and healthcare access.
      </p>
    </div>

    <div className="flex items-center gap-3">
        <button
            type="button"
            onClick={onOpenSavedPaths}
            className="text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800"
        >
            Saved Paths
        </button>
        <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-xs uppercase tracking-wide font-semibold text-surface-600 hover:text-surface-800"
        >
            Privacy
        </button>
    </div>
  </div>
</header>



            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
                <section className="filters mb-12">
                    <div className="filters__header">
                        <div className="filters__title">
                            <span className="filters__titleMark" />
                            Filter Destinations
                        </div>
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search countries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full search-input bg-transparent placeholder:text-surface-400 focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Region Filter */}
                        {/* Region Filter */}
                        <div className="max-w-xs">
                            <label className="filters__label">
                                Region
                            </label>
                            <div className="relative">
                                <select
                                    value={regionFilter}
                                    onChange={(e) => setRegionFilter(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="All">All Regions</option>
                                    {availableRegions.map(region => (
                                        <option key={region} value={region}>{region}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* LGBTQ+ Safety Filter */}
                        <div className="max-w-xs">
                            <label className="filters__label">
                                Minimum LGBTQ+ Rights Score
                            </label>
                            <div className="relative">
                                <select
                                    value={minLgbtqIndex}
                                    onChange={(e) => setMinLgbtqIndex(Number(e.target.value))}
                                    className="w-full"
                                >
                                    <option value={5}>5 - Excellent Protection</option>
                                    <option value={4}>4+ - Strong Legal Protections</option>
                                    <option value={3}>3+ - Legal but Ambiguous</option>
                                    <option value={2}>2+ - Basic Recognition</option>
                                    <option value={0}>Any Score</option>
                                </select>
                            </div>
                        </div>

                        {/* Abortion Access Filter */}
                        {/* Reproductive Rights Filter */}
                        <div className="max-w-xs">
                            <label className="filters__label">
                                Reproductive Rights Status
                            </label>
                            <div className="relative">
                                <select
                                    value={accessFilter}
                                    onChange={(e) => setAccessFilter(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="All">All Countries</option>
                                    <option value="protected">Protected</option>
                                    <option value="decriminalized">Decriminalized</option>
                                    <option value="restricted">Restricted</option>
                                </select>
                            </div>
                        </div>
                    </div>

                <div className="mb-10">
                    <MapErrorBoundary>
                    <ImmigrationMap
                        onSelectCountry={(iso2, intent) => {
                            if (!iso2) return;
                            const match = countries.find((country) => country.iso2?.toUpperCase() === iso2.toUpperCase());
                            if (match) {
                                setMapSelectionError(null);
                                setMapSelectionIso2(null);
                                onSelectCountry(match, intent);
                            } else {
                                setMapSelectionIso2(iso2.toUpperCase());
                                setMapSelectionError('This country is not included in the verified dataset.');
                            }
                        }}
                    />
                    </MapErrorBoundary>
                    {mapSelectionError && (
                        <div className="emptyState text-left mt-4">
                            <p className="emptyState__title">Country unavailable</p>
                            <p className="emptyState__detail">{mapSelectionError}</p>
                            {mapSelectionIso2 && (
                                <p className="emptyState__detail text-xs mt-2">
                                    ISO code selected: {mapSelectionIso2}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Section Header */}
                <section id="country-table">
                    <div className="filters__header mt-16">
                        <div className="filters__title">
                            <span className="filters__titleMark" />
                            Matching Destinations
                        </div>
                        <span className="text-surface-500 font-medium text-xs uppercase tracking-wide">
                            {filteredCountries.length} results
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-surface-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-500" />
                            <p>Loading destinations...</p>
                        </div>
                    ) : error ? (
                        <div className="emptyState text-left">
                            <p className="emptyState__title">Unable to load countries</p>
                            <p className="emptyState__detail">{error}</p>
                        </div>
                    ) : filteredCountries.length === 0 ? (
                        <div className="emptyState text-left">
                            <p className="emptyState__title">No matching destinations</p>
                            <p className="emptyState__detail">Try lowering the Rights Score or broadening Access Status.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredCountries.map(country => (
                                <CountryCard key={country.id} country={country} onClick={onSelectCountry} />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Footer */}
            <footer className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-20 mt-12">
                <div className="disclaimer">
                    <div className="disclaimer__title">
                        <span className="filters__titleMark" />
                        Important Disclaimer
                    </div>
                    <p className="leading-relaxed">
                        The content on this platform is for informational purposes only. It is built on verified public data but does not substitute for consultation with a licensed immigration attorney or government official.
                    </p>
                </div>
            </footer>

        </div>
    );
};

export default function App() {
    const [view, setView] = useState('list'); // 'list', 'country', 'paths', 'path', 'sources', 'saved', 'privacy'
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCountryId, setSelectedCountryId] = useState(null);
    const [selectedPathId, setSelectedPathId] = useState(null);
    const suppressHistory = React.useRef(false);

    const parseLocation = (pathname) => {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length === 0) return { view: 'list' };
        if (parts[0] === 'countries' && parts[1]) {
            if (parts[2] === 'paths') return { view: 'paths', countryId: parts[1] };
            if (parts[2] === 'sources') return { view: 'sources', countryId: parts[1] };
            return { view: 'country', countryId: parts[1] };
        }
        if (parts[0] === 'paths' && parts[1]) {
            return { view: 'path', pathId: parts[1] };
        }
        if (parts[0] === 'saved-paths') return { view: 'saved' };
        if (parts[0] === 'privacy') return { view: 'privacy' };
        return { view: 'list' };
    };

    const buildPath = (nextView, countryId, pathId) => {
        if (nextView === 'country' && countryId) return `/countries/${countryId}`;
        if (nextView === 'paths' && countryId) return `/countries/${countryId}/paths`;
        if (nextView === 'sources' && countryId) return `/countries/${countryId}/sources`;
        if (nextView === 'path' && pathId) return `/paths/${pathId}`;
        if (nextView === 'saved') return '/saved-paths';
        if (nextView === 'privacy') return '/privacy';
        return '/';
    };

    useEffect(() => {
        const { view: nextView, countryId, pathId } = parseLocation(window.location.pathname);
        suppressHistory.current = true;
        setView(nextView);
        setSelectedCountryId(countryId || null);
        setSelectedPathId(pathId || null);
    }, []);

    useEffect(() => {
        const handlePop = () => {
            const { view: nextView, countryId, pathId } = parseLocation(window.location.pathname);
            suppressHistory.current = true;
            setView(nextView);
            setSelectedCountryId(countryId || null);
            setSelectedPathId(pathId || null);
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []);

    useEffect(() => {
        if (suppressHistory.current) {
            suppressHistory.current = false;
            return;
        }
        const nextPath = buildPath(view, selectedCountryId, selectedPathId);
        if (nextPath !== window.location.pathname) {
            window.history.pushState({}, '', nextPath);
        }
    }, [view, selectedCountryId, selectedPathId]);

    useEffect(() => {
        if (view === 'country' && !(selectedCountryId || selectedCountry?.id)) {
            setView('list');
        }
        if (view === 'paths' && !(selectedCountryId || selectedCountry?.id)) {
            setView('list');
        }
        if (view === 'sources' && !(selectedCountryId || selectedCountry?.id)) {
            setView('list');
        }
        if (view === 'path' && !selectedPathId) {
            setView('list');
        }
    }, [view, selectedCountryId, selectedPathId, selectedCountry]);

    const handleSelectCountry = (country, intent = 'profile') => {
        setSelectedCountry(country);
        setSelectedCountryId(country?.id || null);
        if (intent === 'pathways' && typeof country?.pathway_count === 'number' && country.pathway_count > 0) {
            setView('paths');
        } else {
            setView('country');
        }
    };

    const handleSelectPath = (pathId) => {
        setSelectedPathId(pathId);
        setView('path');
    };

    const handleViewPaths = () => {
        setSelectedPathId(null);
        setView('paths');
    };

    const handleBackToCountries = () => {
        setView('list');
        setSelectedCountry(null);
        setSelectedCountryId(null);
    };

    const handleBackToPaths = () => {
        setView('paths');
        setSelectedPathId(null);
    };

    const handleViewSources = () => {
        setView('sources');
    };

	    return (
	        <div className="min-h-screen bg-surface-50 font-sans">
            {view === 'list' && (
                <CountryFilterContainer
                    onSelectCountry={handleSelectCountry}
                    onOpenSavedPaths={() => setView('saved')}
                    onOpenPrivacy={() => setView('privacy')}
                />
            )}
            {view === 'country' && (selectedCountryId || selectedCountry?.id) && (
                <CountryProfile
                    countryId={selectedCountryId || selectedCountry?.id}
                    onBack={handleBackToCountries}
                    hasPathways={
                        typeof selectedCountry?.pathway_count === 'number'
                            ? selectedCountry.pathway_count > 0
                            : null
                    }
                    onViewPathways={handleViewPaths}
                    onViewSources={handleViewSources}
                    onLoadCountry={(country) => {
                        if (country?.id && !selectedCountryId) {
                            setSelectedCountryId(country.id);
                        }
                    }}
                />
            )}
            {view === 'paths' && (selectedCountryId || selectedCountry?.id) && (
                <VisaPathList
                    countryId={selectedCountryId || selectedCountry?.id}
                    countryName={selectedCountry?.name}
                    onSelectPath={handleSelectPath}
                    onBack={() => setView('country')}
                />
            )}
            {view === 'sources' && (selectedCountryId || selectedCountry?.id) && (
                <CountrySourcesPage
                    countryId={selectedCountryId || selectedCountry?.id}
                    onBack={() => setView('country')}
                />
            )}
            {view === 'path' && selectedPathId && (
                <VisaPathDetail
                    pathId={selectedPathId}
                    onBack={handleBackToPaths}
                    countryName={selectedCountry?.name}
                    onResolveCountryId={(countryId) => {
                        if (countryId && countryId !== selectedCountryId) {
                            setSelectedCountryId(countryId);
                        }
                    }}
                />
            )}
            {view === 'saved' && (
                <SavedPathsPage
                    onBack={() => setView('list')}
                    onOpenPath={(pathId) => {
                        setSelectedPathId(pathId);
                        setView('path');
                    }}
                />
            )}
            {view === 'privacy' && (
                <PrivacyPage onBack={() => setView('list')} />
            )}
        </div>
    );
}
