// ui/public/VisaPathPage_Checklist.tsx
import React, { useMemo } from 'react';

interface Requirement { 
    label: string; 
    details: string;
    doc_list: string[];
    notarization_needed: boolean; 
    apostille_needed: boolean; 
    prep_mode: 'remote_only' | 'in_person' | 'on_arrival'; 
}

const mockRequirements: Requirement[] = [
    { label: "Financial Solvency Proof", details: "12 months of certified bank statements.", doc_list: ["Bank Statements"], notarization_needed: true, apostille_needed: false, prep_mode: 'remote_only' },
    { label: "Online Application Form", details: "Submit the main application via the official government portal.", doc_list: ["Completed Form"], notarization_needed: false, apostille_needed: false, prep_mode: 'remote_only' },
    { label: "Original Passport", details: "Must be presented at the consulate interview.", doc_list: ["Valid Passport"], notarization_needed: false, apostille_needed: false, prep_mode: 'in_person' },
    { label: "Certified Solvency Letter", details: "The notarized letter must be presented to the consular officer.", doc_list: ["Notarized Letter"], notarization_needed: true, apostille_needed: true, prep_mode: 'in_person' },
    { label: "Local Residency Registration", details: "Register your address with the nearest immigration office.", doc_list: ["Proof of Address"], notarization_needed: false, apostille_needed: false, prep_mode: 'on_arrival' },
];

const getPhaseDetails = (mode: 'remote_only' | 'in_person' | 'on_arrival') => {
    switch (mode) {
        case 'remote_only':
            return { title: 'Phase 1: Remote Preparation (Your Home Checklist)', icon: '🏠', description: 'These steps can be completed from your current home and device. Minimize outside travel.' };
        case 'in_person':
            return { title: 'Phase 2: In-Person Appointment (The Travel Checklist)', icon: '🏛️', description: 'Documents and steps requiring a physical visit to a consulate or embassy. **Do not travel until Phase 1 is complete.**' };
        case 'on_arrival':
            return { title: 'Phase 3: On Arrival (Post-Landing Tasks)', icon: '✈️', description: 'Required registration steps after you have successfully entered the host country.' };
        default:
            return { title: '', icon: '', description: '' };
    }
};

export const VisaPathChecklist: React.FC<{ requirements: Requirement[] }> = ({ requirements = mockRequirements }) => {
    
    const requirementsByPhase = useMemo(() => {
        return requirements.reduce((acc, req) => {
            if (!acc[req.prep_mode]) {
                acc[req.prep_mode] = [];
            }
            acc[req.prep_mode].push(req);
            return acc;
        }, {} as Record<Requirement['prep_mode'], Requirement[]>);
    }, [requirements]);

    const phases: Requirement['prep_mode'][] = ['remote_only', 'in_person', 'on_arrival'];

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-bold text-indigo-700">Preparedness Checklist: Your Path to Safety</h2>
            <p className="text-gray-600">Follow these steps sequentially to minimize travel and ensure you bring the correct documents to your critical appointments.</p>
            
            {phases.map(mode => {
                const phaseData = getPhaseDetails(mode);
                const list = requirementsByPhase[mode] || [];
                if (list.length === 0) return null;

                return (
                    <section key={mode} className="p-6 border border-gray-200 rounded-lg bg-white shadow-lg">
                        <h3 className="text-2xl font-bold mb-2 flex items-center">
                            {phaseData.icon} {phaseData.title}
                        </h3>
                        <p className="text-md text-gray-500 mb-6">{phaseData.description}</p>
                        
                        <ul className="space-y-4">
                            {list.map((req, index) => (
                                <li key={index} className="border-l-4 border-indigo-400 pl-4 py-2 bg-indigo-50 rounded-r-md">
                                    <h4 className="font-semibold text-gray-900">{req.label}</h4>
                                    <p className="text-sm text-gray-700 mt-1">{req.details}</p>
                                    <div className="flex space-x-3 text-xs mt-2">
                                        <span className="text-indigo-600 font-medium">Documents: {req.doc_list.join(', ')}</span>
                                        {req.notarization_needed && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Requires Notary</span>}
                                        {req.apostille_needed && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Requires Apostille</span>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
};