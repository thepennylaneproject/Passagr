import React, { useMemo } from 'react';
import { CheckCircle2, FileText, Globe, MapPin } from 'lucide-react';
import { normalizeDocList } from '../lib/formatters';

const PHASE_CONFIG = {
    'remote_only': {
        label: 'Phase 1: Before You Go',
        description: 'Complete these steps remotely from your home country.',
        icon: Globe,
        color: 'bg-primary-50 border-primary-200 text-primary-900'
    },
    'in_person': {
        label: 'Phase 2: In-Country Appointments',
        description: 'Requires physical presence at a consulate or government office.',
        icon: MapPin,
        color: 'bg-secondary-50 border-secondary-200 text-secondary-900'
    },
    'on_arrival': {
        label: 'Phase 3: On Arrival',
        description: 'Steps to take immediately upon entering the country.',
        icon: CheckCircle2,
        color: 'bg-accent-50 border-accent-200 text-accent-900'
    }
};

const RequirementItem = ({ req }) => (
    <div className="flex items-start p-4 bg-var(--color-ivory) border border-surface-200 rounded-lg mb-3 shadow-sm hover:shadow-md transition-shadow">
        <FileText className="w-5 h-5 text-surface-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
            <h4 className="font-semibold text-surface-900">{req.label}</h4>
            {req.details && <p className="text-sm text-surface-600 mt-1">{req.details}</p>}
            {normalizeDocList(req.doc_list).length > 0 && (
                <div className="mt-2">
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Documents:</p>
                    <ul className="list-disc list-inside text-xs text-surface-600 space-y-0.5 ml-1">
                        {normalizeDocList(req.doc_list).map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="mt-2 flex gap-2">
                {req.notarization_needed && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                        Notarization Required
                    </span>
                )}
                {req.apostille_needed && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                        Apostille Required
                    </span>
                )}
            </div>
        </div>
    </div>
);

export const VisaPathChecklist = ({ requirements }) => {
    const groupedRequirements = useMemo(() => {
        if (!Array.isArray(requirements)) return {};
        const groups = {};
        requirements.forEach(req => {
            const mode = req.prep_mode || 'remote_only';
            if (!groups[mode]) groups[mode] = [];
            groups[mode].push(req);
        });
        return groups;
    }, [requirements]);

    if (!requirements || requirements.length === 0) {
        return (
            <div className="text-center py-10 text-surface-500 italic">
                No specific requirements listed for this path yet.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {Object.entries(groupedRequirements).map(([mode, reqs]) => {
                const config = PHASE_CONFIG[mode] || {
                    label: `Phase: ${mode}`,
                    description: '',
                    icon: FileText,
                    color: 'bg-surface-50 border-surface-200 text-surface-900'
                };
                const Icon = config.icon;

                return (
                    <div key={mode} className={`rounded-xs overflow-hidden`}>
                        <div className={`p-4 border-top border-var(--color-rule) flex items-start gap-3`}>
                            <div>
                                <h3 className="text-md text-[var(--color-ink)]">{config.label}</h3>
                                <p className="text-sm opacity-90">{config.description}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-surface-50/50">
                            {reqs.map(req => (
                                <RequirementItem key={req.id} req={req} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    )}