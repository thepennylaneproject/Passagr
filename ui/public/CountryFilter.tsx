// ui/public/CountryFilter.tsx
import React, { useState, useMemo } from 'react';

// Data model with new safety fields
interface CountrySummary {
    id: string;
    name: string;
    iso2: string;
    lgbtq_rights_index: number; // 0-5
    abortion_access_status: string;
    last_verified_at: string;
}

// --- MOCK DATA ---
const mockCountries: CountrySummary[] = [
    { id: 'c-por', name: 'Portugal', iso2: 'PT', lgbtq_rights_index: 5, abortion_access_status: 'Protected', last_verified_at: '2025-11-01' },
    { id: 'c-mex', name: 'Mexico', iso2: 'MX', lgbtq_rights_index: 4, abortion_access_status: 'Decriminalized/Regional', last_verified_at: '2025-11-10' },
    { id: 'c-can', name: 'Canada', iso2: 'CA', lgbtq_rights_index: 5, abortion_access_status: 'Protected', last_verified_at: '2025-10-25' },
    { id: 'c-pol', name: 'Poland', iso2: 'PL', lgbtq_rights_index: 1, abortion_access_status: 'Highly Restricted', last_verified_at: '2025-11-15' },
];

const getSafetyColor = (index: number) => {
    if (index >= 4) return 'bg-green-100 text-green-800';
    if (index >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};

export const CountryFilter: React.FC = () => {
    const [minLgbtqIndex, setMinLgbtqIndex] = useState(3);
    const [accessFilter, setAccessFilter] = useState('All');
    // Replace with API call: const [countries, setCountries] = useState(usePublicCountries());

    const filteredCountries = useMemo(() => {
        return mockCountries.filter(country => {
            const lgbtqMatch = country.lgbtq_rights_index >= minLgbtqIndex;
            const accessMatch = accessFilter === 'All' || country.abortion_access_status.includes(accessFilter);
            return lgbtqMatch && accessMatch;
        });
    }, [minLgbtqIndex, accessFilter]);

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-2">Find Your Safe Haven</h1>
            <p className="text-gray-600 mb-8">Filter destinations based on rights and legal protections critical to your safety.</p>

            <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LGBTQ+ Safety Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum LGBTQ+ Rights Score (0-5)</label>
                    <select
                        value={minLgbtqIndex}
                        onChange={(e) => setMinLgbtqIndex(Number(e.target.value))}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value={4}>4+ (Strong Legal Protections)</option>
                        <option value={3}>3+ (Legal but Ambiguous)</option>
                        <option value={2}>2+ (Basic Legal Recognition)</option>
                        <option value={0}>Any</option>
                    </select>
                </div>

                {/* Abortion Access Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Abortion Access Status</label>
                    <select
                        value={accessFilter}
                        onChange={(e) => setAccessFilter(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="All">All Countries</option>
                        <option value="Protected">Protected by Law</option>
                        <option value="Decriminalized">Decriminalized/Regional</option>
                        <option value="Restricted">Restricted/Criminalized (Caution)</option>
                    </select>
                </div>
            </div>

            {/* Filtered Results Display */}
            <h2 className="text-2xl font-semibold mb-4">Matching Destinations ({filteredCountries.length})</h2>
            <div className="space-y-4">
                {filteredCountries.map(country => (
                    <a key={country.id} href={`/countries/${country.id}`} className="block p-4 border rounded-lg shadow-sm hover:ring-2 hover:ring-indigo-400 transition">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">{country.name} ({country.iso2})</h3>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSafetyColor(country.lgbtq_rights_index)}`}>
                                LGBTQ+ Safety: {country.lgbtq_rights_index}/5
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                            <p>Abortion Access: **{country.abortion_access_status}**</p>
                            <p className="mt-1 text-xs text-gray-500">Data Verified: {new Date(country.last_verified_at).toLocaleDateString()}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};