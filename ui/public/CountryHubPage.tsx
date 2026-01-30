// ui/public/CountryHubPage.tsx (Safety-Focused Update)
import React from 'react';

// Data model with new safety fields
interface CountryData {
    id: string;
    name: string;
    iso2: string;
    lgbtq_rights_index: number; // 0-5
    abortion_access_status: string;
    hate_crime_law_snapshot: string;
    tax_snapshot: string;
    healthcare_overview: string;
    last_verified_at: string;
}

interface VisaPathSummary {
    id: string;
    name: string;
    type: string;
    to_pr_citizenship_timeline: string;
    estimated_first_year_cost: number;
    currency: string;
}

// --- MOCK DATA ---
const mockCountryData: CountryData = {
    id: "c-por",
    name: "Portugal",
    iso2: "PT",
    lgbtq_rights_index: 5,
    abortion_access_status: "Protected (Legally guaranteed, accessible)",
    hate_crime_law_snapshot: "Comprehensive laws cover sexual orientation, gender identity, race, and ethnicity. Penalties are often enhanced.",
    tax_snapshot: "Residents are taxed on worldwide income...",
    healthcare_overview: "National Health Service (SNS) is available to all legal residents...",
    last_verified_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
};

const mockVisaSummaries: VisaPathSummary[] = [
    { id: 'v1', name: 'D7 Passive Income Visa', type: 'retirement', to_pr_citizenship_timeline: '5 years', estimated_first_year_cost: 3500, currency: 'EUR' },
    { id: 'v2', name: 'Digital Nomad Visa', type: 'digital_nomad', to_pr_citizenship_timeline: '5 years', estimated_first_year_cost: 4500, currency: 'EUR' },
];

const SafetyScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    let colorClass = '';
    let status = '';
    
    if (score === 5) {
        colorClass = 'bg-emerald-600';
        status = 'Excellent Protection';
    } else if (score >= 3) {
        colorClass = 'bg-yellow-600';
        status = 'Good Protection';
    } else {
        colorClass = 'bg-red-600';
        status = 'Caution Advised';
    }

    return (
        <div className={`text-white p-4 rounded-lg shadow-xl ${colorClass}`}>
            <div className="text-4xl font-extrabold flex items-center justify-between">
                <div>{score}/5</div> 
                <span className="text-xl font-semibold">{status}</span>
            </div>
            <p className="text-sm mt-1">LGBTQ+ Rights Index</p>
        </div>
    );
};


export const CountryHubPage: React.FC = () => {
    const country = mockCountryData; // Replace with API call
    const visaPaths = mockVisaSummaries; // Replace with API call

    return (
        <div className="container mx-auto p-4 md:p-10">
            {/* Header and Last Verified Stamp */}
            <header className="mb-8 border-b pb-4">
                <h1 className="text-4xl font-extrabold text-gray-900">Your Guide to Safety and Freedom in {country.name}</h1>
                <p className="text-sm text-gray-500 mt-2">Data Verified: **{new Date(country.last_verified_at).toLocaleDateString()}**</p>
            </header>

            {/* --- CRITICAL SAFETY SCORECARDS (Dominant Visuals) --- */}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Safety & Legal Climate</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* LGBTQ+ RIGHTS INDEX */}
                <div className="md:col-span-1">
                    <SafetyScoreBadge score={country.lgbtq_rights_index} />
                </div>
                
                {/* ABORTION ACCESS STATUS */}
                <div className="p-4 border border-gray-200 rounded-lg shadow-md bg-white md:col-span-1">
                    <h3 className="text-xl font-bold mb-1 text-gray-800">Abortion Access</h3>
                    <p className="text-lg font-semibold text-emerald-600">{country.abortion_access_status}</p>
                    <p className="text-xs text-gray-500 mt-1">Source data updated within 30 days.</p>
                </div>

                {/* HATE CRIME SNAPSHOT */}
                <div className="p-4 border border-gray-200 rounded-lg shadow-md bg-white md:col-span-1">
                    <h3 className="text-xl font-bold mb-1 text-gray-800">Hate Crime Laws</h3>
                    <p className="text-sm text-gray-700">{country.hate_crime_law_snapshot}</p>
                    <p className="text-xs text-gray-500 mt-1">Specific protections for race, identity, and orientation.</p>
                </div>
            </div>

            {/* General Living Snapshots */}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Living & Financial Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-xl font-semibold mb-2">Tax Snapshot</h3>
                    <p className="text-sm text-gray-700">{country.tax_snapshot}</p>
                </div>
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-xl font-semibold mb-2">Healthcare Overview</h3>
                    <p className="text-sm text-gray-700">{country.healthcare_overview}</p>
                </div>
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h3 className="text-xl font-semibold mb-2">Critical Gotchas</h3>
                    <p className="text-sm text-red-700">Potential pitfalls related to rights or residency.</p>
                </div>
            </div>

            {/* Residency Paths and Vibe */}
            <section>
                <h2 className="text-3xl font-bold mb-6">Verified Paths to Residency</h2>
                <div className="space-y-6">
                    {visaPaths.map((path) => (
                        <a key={path.id} href={`/visa-paths/${path.id}`} className="block border rounded-lg p-6 hover:bg-indigo-50 transition duration-150 ease-in-out">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-semibold uppercase text-indigo-600 tracking-wider">{path.type.replace('_', ' ')}</span>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{path.name}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">~{path.estimated_first_year_cost.toLocaleString()} {path.currency}</p>
                                    <p className="text-sm text-gray-500">Estimated First-Year Cost</p>
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-6 text-sm">
                                <span className="font-medium text-gray-700">Time to PR/Citizenship:</span>
                                <span className="text-indigo-700">{path.to_pr_citizenship_timeline}</span>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
};