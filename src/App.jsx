import React, { useState, useMemo, useEffect } from 'react';
import { Shield, MapPin, Anchor, Heart, AlertTriangle, Loader2, ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import './index.css';
import { PassagrLockup } from './components/PassagrMarks.jsx';
import { fetchCountries, fetchVisaPaths, fetchVisaPathDetail } from './lib/api';
import ImmigrationMap from './components/ImmigrationMap.jsx';

// --- UTILITY FUNCTIONS ---

const getSafetyColor = (index) => {
    if (index === 5) return 'bg-secondary-600 text-white';
    if (index >= 4) return 'bg-secondary-500 text-white';
    if (index >= 2) return 'bg-accent-500 text-surface-900';
    return 'bg-red-500 text-white';
};

const getSafetyVibe = (index) => {
    if (index === 5) return 'Excellent Protection';
    if (index >= 4) return 'Strong Legal Framework';
    if (index >= 2) return 'Basic Recognition';
    return 'High Caution';
};

const AbortionStatusBadge = ({ status }) => {
    let color = 'bg-surface-100 text-surface-700';
    let icon = <AlertTriangle className="w-3 h-3 mr-1" />;

    if (status && (status.includes('Legal') || status.includes('Protected'))) {
        color = 'bg-secondary-100 text-secondary-800 border-secondary-200';
        icon = <Heart className="w-3 h-3 mr-1" />;
    } else if (status && status.includes('Restricted')) {
        color = 'bg-accent-100 text-accent-800 border-accent-200';
        icon = <AlertTriangle className="w-3 h-3 mr-1" />;
    } else if (status && status.includes('Decriminalized')) {
        color = 'bg-primary-100 text-primary-800 border-primary-200';
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${color}`}>
            {icon} {status || 'Unknown'}
        </span>
    );
};

// --- COMPONENTS ---

const CountryCard = ({ country, onClick }) => {
    const safetyClass = getSafetyColor(country.lgbtq_rights_index);

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

            <div className="space-y-4">
                <div className={`py-3 flex items-center justify-between ${safetyClass} bg-transparent p-0 text-current`}>
                    <Shield className="w-6 h-6 opacity-90" />
                    <div className="text-right">
                        <p className="text-xl font-bold leading-none">{country.lgbtq_rights_index}/5</p>
                        <p className="text-xs font-medium opacity-90 mt-1">{getSafetyVibe(country.lgbtq_rights_index)}</p>
                    </div>
                </div>

                <div className="pt-2">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Abortion Access</p>
                    <AbortionStatusBadge status={country.abortion_access_status} />
                </div>
            </div>

            <div className="mt-6 text-xs text-surface-400 pt-4 border-t border-surface-100 flex items-center justify-between">
                <span>Verified</span>
                <span>{new Date(country.last_verified_at).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

const VisaPathList = ({ countryId, onSelectPath, onBack }) => {
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (countryId) {
            setLoading(true);
            fetchVisaPaths(countryId)
                .then(setPaths)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [countryId]);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" /></div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="relative z-10">
                <button onClick={onBack} className="flex items-start text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Countries
                </button>
                <h2 className="text-3xl font-serif font-bold mb-8">Available Visa Pathways</h2>
                <div className="grid gap-4">
                    {paths.map(path => (
                        <div
                            key={path.id}
                            onClick={() => onSelectPath(path.id)}
                            className="p-6 rounded-sm border border-surface-200 hover:border-primary-200 cursor-pointer transition-all flex justify-between items-center group"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-primary-900 group-hover:text-primary-600 transition-colors">{path.name}</h3>
                                <p className="text-surface-600 mt-1">{path.description}</p>
                                <span className="inline-block mt-3 px-2 py-1 bg-surface-100 text-surface-600 text-xs rounded font-medium uppercase tracking-wide">{path.type}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-surface-400 group-hover:text-primary-500" />
                        </div>
                    ))}
                    {paths.length === 0 && (
                        <div className="text-center py-10 text-surface-500 border-2 border-dashed border-surface-200 rounded-sm">
                            No visa paths found for this country yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const VisaPathDetail = ({ pathId, onBack }) => {
    const [path, setPath] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (pathId) {
            setLoading(true);
            fetchVisaPathDetail(pathId)
                .then(setPath)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [pathId]);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" /></div>;
    if (!path) return <div>Path not found</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">

            <div className="relative z-10">
                <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pathways
                </button>

                <div className="mb-10">
                    <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">{path.name}</h1>
                    <p className="text-xl text-surface-600 leading-relaxed">{path.description}</p>

                    <div className="flex gap-4 mt-6">
                        <div className="px-4 py-2 bg-surface-100 rounded-sm">
                            <span className="block text-xs font-bold text-surface-500 uppercase">Type</span>
                            <span className="font-medium text-surface-900">{path.type}</span>
                        </div>
                        {path.processing_min_days && (
                            <div className="px-4 py-2 bg-surface-100 rounded-sm">
                                <span className="block text-xs font-bold text-surface-500 uppercase">Processing</span>
                                <span className="font-medium text-surface-900">{path.processing_min_days} - {path.processing_max_days} days</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-sm border border-surface-200 overflow-hidden">
                    <div className="p-6 border-b border-surface-100 bg-surface-50">
                        <h2 className="text-2xl font-serif font-bold flex items-center">
                            <FileText className="w-6 h-6 mr-3 text-primary-600" />
                            Requirements Checklist
                        </h2>
                    </div>
                    <div className="p-6">
                        <VisaPathChecklist requirements={path.requirements} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const CountryFilterContainer = ({ onSelectCountry }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [minLgbtqIndex, setMinLgbtqIndex] = useState(3);
    const [accessFilter, setAccessFilter] = useState('All');
    const [regionFilter, setRegionFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState(null);

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
                (country.abortion_access_status && country.abortion_access_status.toLowerCase().includes(accessFilter.toLowerCase()));
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

    {/* Right side: keep empty for now, or later put nav/status here */}
    <div className="hidden md:block" aria-hidden="true" />
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
                                    <option value="Legal">Legal / Protected</option>
                                    <option value="Decriminalized">Decriminalized</option>
                                    <option value="Restricted">Restricted</option>
                                </select>
                            </div>
                        </div>
                    </div>

                <div className="mb-10">
                    <ImmigrationMap />
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
                            <p>Verifying latest data...</p>
                        </div>
                    ) : error ? (
                        <div className="emptyState text-left">
                            <p className="emptyState__title">No data available yet</p>
                            <p className="emptyState__detail">Verified country data could not be loaded at this time.</p>
                        </div>
                    ) : filteredCountries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredCountries.map(country => (
                                <CountryCard key={country.id} country={country} onClick={onSelectCountry} />
                            ))}
                        </div>
                    ) : (
                        <div className="emptyState text-left">
                            <p className="emptyState__title">No matching destinations</p>
                            <p className="emptyState__detail">Try lowering the Rights Score or broadening Access Status.</p>
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
    const [view, setView] = useState('list'); // 'list', 'country', 'path'
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedPathId, setSelectedPathId] = useState(null);

    const handleSelectCountry = (country) => {
        setSelectedCountry(country);
        setView('country');
    };

    const handleSelectPath = (pathId) => {
        setSelectedPathId(pathId);
        setView('path');
    };

    const handleBackToCountries = () => {
        setView('list');
        setSelectedCountry(null);
    };

    const handleBackToPaths = () => {
        setView('country');
        setSelectedPathId(null);
    };

    return (
        <div className="min-h-screen bg-surface-50 font-sans">
            {view === 'list' && <CountryFilterContainer onSelectCountry={handleSelectCountry} />}
            {view === 'country' && selectedCountry && <VisaPathList countryId={selectedCountry.id} onSelectPath={handleSelectPath} onBack={handleBackToCountries} />}
            {view === 'path' && selectedPathId && <VisaPathDetail pathId={selectedPathId} onBack={handleBackToPaths} />}
        </div>
    );
}
