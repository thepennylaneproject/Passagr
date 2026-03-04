import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import {
    archiveChecklist,
    createLiveChecklist,
    fetchChecklistTemplateById,
    fetchChecklistTemplateByVisaPath,
    fetchChecklistTemplateItems,
    fetchLatestChecklistForSavedPath,
    fetchLatestSavedPathByCanonical,
    fetchLiveChecklistItems,
    fetchTemplateVersion,
    findOrCreateSavedPathForCanonical,
    getCurrentUser,
    updateLiveChecklistItem
} from '../lib/api';

const dateLabel = (isoValue) => {
    if (!isoValue) return 'Unknown';
    const value = new Date(isoValue);
    if (Number.isNaN(value.getTime())) return 'Unknown';
    return value.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const normalizeItemKey = (item) => `${(item?.title || '').trim().toLowerCase()}::${(item?.description || '').trim().toLowerCase()}`;

const buildDiffSummary = (oldItems, newItems) => {
    const oldKeys = new Set((oldItems || []).map(normalizeItemKey));
    const newKeys = new Set((newItems || []).map(normalizeItemKey));

    let added = 0;
    let removed = 0;
    newKeys.forEach((key) => {
        if (!oldKeys.has(key)) added += 1;
    });
    oldKeys.forEach((key) => {
        if (!newKeys.has(key)) removed += 1;
    });

    return { added, removed };
};

const statusOptions = [
    { value: 'incomplete', label: 'Not started' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed', label: 'Done' }
];

const ReferenceChecklist = ({ items }) => {
    if (!items.length) {
        return <p className="text-sm text-surface-500">No checklist items are published yet for this guidance template.</p>;
    }

    return (
        <ol className="space-y-3">
            {items.map((item) => (
                <li key={item.id} className="border border-surface-200 rounded-sm p-3 bg-surface-50">
                    <p className="text-xs uppercase tracking-wide text-surface-500 font-semibold">
                        Step {Number.isFinite(item.sort_order) ? item.sort_order + 1 : '-'}
                    </p>
                    <p className="text-sm font-semibold text-surface-800 mt-1">{item.title}</p>
                    {item.description && <p className="text-sm text-surface-600 mt-1">{item.description}</p>}
                </li>
            ))}
        </ol>
    );
};

const LiveChecklist = ({ items, notesDraft, onDraftChange, onStatusChange, onSaveNotes, busyItemId }) => {
    if (!items.length) {
        return <p className="text-sm text-surface-500">No live checklist items found.</p>;
    }

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <article key={item.id} className="border border-surface-200 rounded-sm p-4 bg-var(--color-ivory)">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-surface-800">{item.item_title}</p>
                            {item.item_description && (
                                <p className="text-sm text-surface-600 mt-1">{item.item_description}</p>
                            )}
                        </div>
                        <select
                            value={item.status}
                            onChange={(e) => onStatusChange(item, e.target.value)}
                            className="border border-surface-300 px-2 py-1 text-sm"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-3">
                        <label className="text-xs uppercase tracking-wide text-surface-500 font-semibold">Item notes</label>
                        <textarea
                            value={notesDraft[item.id] ?? item.notes ?? ''}
                            onChange={(e) => onDraftChange(item.id, e.target.value)}
                            rows={2}
                            className="w-full border border-surface-300 px-2 py-1 text-sm mt-1"
                            placeholder="Add context for your own tracking."
                        />
                        <button
                            type="button"
                            onClick={() => onSaveNotes(item)}
                            disabled={busyItemId === item.id}
                            className="text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-50 mt-2 inline-flex items-center gap-2"
                        >
                            {busyItemId === item.id && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save note
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
};

export const PathChecklistExperience = ({ visaPathId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [template, setTemplate] = useState(null);
    const [templateItems, setTemplateItems] = useState([]);
    const [templateVersion, setTemplateVersion] = useState(null);
    const [liveChecklist, setLiveChecklist] = useState(null);
    const [liveItems, setLiveItems] = useState([]);
    const [liveTemplate, setLiveTemplate] = useState(null);
    const [liveTemplateVersion, setLiveTemplateVersion] = useState(null);
    const [notesDraft, setNotesDraft] = useState({});
    const [startingLive, setStartingLive] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [busyItemId, setBusyItemId] = useState(null);
    const [consentUpgrade, setConsentUpgrade] = useState(false);
    const [info, setInfo] = useState('');

    const reload = async (signal) => {
        setLoading(true);
        setError(null);
        setInfo('');

        try {
            const activeTemplate = await fetchChecklistTemplateByVisaPath(visaPathId);
            if (signal?.aborted) return;
            setTemplate(activeTemplate);

            if (!activeTemplate) {
                setTemplateItems([]);
                setTemplateVersion(null);
                setLiveChecklist(null);
                setLiveItems([]);
                return;
            }

            const [activeItems, activeVersionLink, user] = await Promise.all([
                fetchChecklistTemplateItems(activeTemplate.id),
                fetchTemplateVersion(activeTemplate.id),
                getCurrentUser().catch(() => null)
            ]);
            if (signal?.aborted) return;
            setTemplateItems(activeItems);
            setTemplateVersion(activeVersionLink);

            if (!user) {
                setLiveChecklist(null);
                setLiveItems([]);
                return;
            }

            const savedPath = await fetchLatestSavedPathByCanonical(visaPathId);
            if (signal?.aborted) return;
            if (!savedPath) {
                setLiveChecklist(null);
                setLiveItems([]);
                return;
            }

            const checklist = await fetchLatestChecklistForSavedPath(savedPath.id);
            if (signal?.aborted) return;
            if (!checklist) {
                setLiveChecklist(null);
                setLiveItems([]);
                return;
            }

            const [items, checklistTemplate, checklistVersion] = await Promise.all([
                fetchLiveChecklistItems(checklist.id),
                fetchChecklistTemplateById(checklist.template_id),
                fetchTemplateVersion(checklist.template_id)
            ]);
            if (signal?.aborted) return;
            setLiveChecklist(checklist);
            setLiveItems(items);
            setLiveTemplate(checklistTemplate);
            setLiveTemplateVersion(checklistVersion);
        } catch (err) {
            if (signal?.aborted) return;
            setError(err?.message || 'Checklist unavailable.');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        reload(controller.signal);
        return () => controller.abort();
    }, [visaPathId]);

    // FE-3: Restore note drafts from localStorage on mount / checklist change
    useEffect(() => {
        if (!liveChecklist?.id) return;
        const key = `passagr-notes-draft-${liveChecklist.id}`;
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    setNotesDraft(parsed);
                }
            }
        } catch {
            // Corrupted localStorage entry — ignore
        }
    }, [liveChecklist?.id]);

    // FE-3: Persist note drafts to localStorage (debounced)
    useEffect(() => {
        if (!liveChecklist?.id) return;
        const key = `passagr-notes-draft-${liveChecklist.id}`;
        const timer = setTimeout(() => {
            try {
                if (Object.keys(notesDraft).length > 0) {
                    localStorage.setItem(key, JSON.stringify(notesDraft));
                } else {
                    localStorage.removeItem(key);
                }
            } catch {
                // localStorage full or unavailable — ignore
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [notesDraft, liveChecklist?.id]);

    const upgradeAvailable = useMemo(() => {
        if (!liveChecklist || !template || liveChecklist.template_id === template.id) return false;
        const liveVersion = liveTemplateVersion?.version_number || 0;
        const activeVersion = templateVersion?.version_number || 0;
        return activeVersion > liveVersion;
    }, [liveChecklist, template, templateVersion, liveTemplateVersion]);

    const diffSummary = useMemo(() => {
        if (!upgradeAvailable) return null;
        return buildDiffSummary(liveItems, templateItems);
    }, [upgradeAvailable, liveItems, templateItems]);

    const handleStartLive = async () => {
        if (!template) return;
        setStartingLive(true);
        setError(null);
        setInfo('');
        try {
            const savedPath = await findOrCreateSavedPathForCanonical(visaPathId);
            const checklist = await createLiveChecklist({
                savedPathId: savedPath.id,
                templateId: template.id
            });
            const items = await fetchLiveChecklistItems(checklist.id);
            setLiveChecklist(checklist);
            setLiveItems(items);
            setLiveTemplate(template);
            setLiveTemplateVersion(templateVersion);
            setInfo('Live checklist started. Use this tracker for planning steps only.');
        } catch (err) {
            setError(err?.message || 'Unable to start live checklist.');
        } finally {
            setStartingLive(false);
        }
    };

    const handleStatusChange = useCallback(async (item, status) => {
        setBusyItemId(item.id);
        setError(null);
        try {
            await updateLiveChecklistItem({
                itemStateId: item.id,
                status,
                notes: notesDraft[item.id] ?? item.notes ?? null
            });
            const items = await fetchLiveChecklistItems(item.user_path_checklist_id);
            setLiveItems(items);
        } catch (err) {
            setError(err?.message || 'Unable to update item.');
        } finally {
            setBusyItemId(null);
        }
    }, [notesDraft]);

    const handleSaveNotes = useCallback(async (item) => {
        setBusyItemId(item.id);
        setError(null);
        try {
            await updateLiveChecklistItem({
                itemStateId: item.id,
                status: item.status,
                notes: notesDraft[item.id] ?? ''
            });
            const items = await fetchLiveChecklistItems(item.user_path_checklist_id);
            setLiveItems(items);
        } catch (err) {
            setError(err?.message || 'Unable to save notes.');
        } finally {
            setBusyItemId(null);
        }
    }, [notesDraft]);

    const handleUpgrade = async () => {
        if (!template || !liveChecklist) return;
        if (!consentUpgrade) {
            setError('Please confirm before upgrading checklist guidance.');
            return;
        }

        setUpgrading(true);
        setError(null);
        setInfo('');
        try {
            await archiveChecklist(liveChecklist.id);
            const replacement = await createLiveChecklist({
                savedPathId: liveChecklist.saved_path_id,
                templateId: template.id
            });
            const items = await fetchLiveChecklistItems(replacement.id);
            setLiveChecklist(replacement);
            setLiveItems(items);
            setLiveTemplate(template);
            setLiveTemplateVersion(templateVersion);
            setConsentUpgrade(false);
            setInfo('Checklist upgraded to the latest guidance version.');
        } catch (err) {
            setError(err?.message || 'Unable to upgrade checklist.');
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-surface-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading checklist...
            </div>
        );
    }

    if (error && !template) {
        return (
            <div className="emptyState text-left">
                <p className="emptyState__title">Checklist unavailable</p>
                <p className="emptyState__detail">{error}</p>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="emptyState text-left">
                <p className="emptyState__title">No checklist template published</p>
                <p className="emptyState__detail">This path currently has no checklist guidance template.</p>
            </div>
        );
    }

    const guidanceVersion = templateVersion?.version_number || 1;
    const guidanceUpdatedAt = template.updated_at || template.created_at;

    return (
        <section className="border-top border-surface-200 overflow-hidden">
            <div className="p-6 border-b border-surface-100 bg-surface-50">
                <h2 className="text-2xl font-serif font-bold">Checklist</h2>
                <p className="text-sm text-surface-600 mt-2">
                    Checklist based on guidance version {guidanceVersion}, last updated {dateLabel(guidanceUpdatedAt)}.
                </p>
                <p className="text-xs text-surface-500 mt-1">
                    Guidance supports planning and preparation. It does not guarantee eligibility, approval, or outcomes.
                </p>
            </div>

            <div className="p-6 space-y-5">
                {info && <p className="text-sm text-primary-700">{info}</p>}
                {error && (
                    <p className="text-sm text-red-700 inline-flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {error}
                    </p>
                )}

                {liveChecklist ? (
                    <>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-surface-800 inline-flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary-600" />
                                Live mode
                            </p>
                            <span className="text-xs uppercase tracking-wide text-surface-500">
                                {liveTemplateVersion?.version_number ? `Version ${liveTemplateVersion.version_number}` : 'Version unknown'}
                            </span>
                        </div>

                        {upgradeAvailable && (
                            <div className="border border-accent-300 bg-accent-50 rounded-sm p-3">
                                <p className="text-sm font-semibold text-surface-800">Upgrade available</p>
                                <p className="text-sm text-surface-700 mt-1">
                                    New guidance version {templateVersion?.version_number || '?'} is available.
                                </p>
                                {diffSummary && (
                                    <p className="text-xs text-surface-600 mt-1">
                                        Diff summary: {diffSummary.added} added, {diffSummary.removed} removed.
                                    </p>
                                )}
                                <label className="flex items-start gap-2 mt-2 text-xs text-surface-700">
                                    <input
                                        type="checkbox"
                                        checked={consentUpgrade}
                                        onChange={(e) => setConsentUpgrade(e.target.checked)}
                                    />
                                    I understand this creates a new checklist from the latest guidance version.
                                </label>
                                <button
                                    type="button"
                                    onClick={handleUpgrade}
                                    disabled={upgrading || !consentUpgrade}
                                    className="text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-50 mt-2 inline-flex items-center gap-2"
                                >
                                    {upgrading && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Upgrade checklist
                                </button>
                            </div>
                        )}

                        <LiveChecklist
                            items={liveItems}
                            notesDraft={notesDraft}
                            onDraftChange={(id, value) => setNotesDraft((prev) => ({ ...prev, [id]: value }))}
                            onStatusChange={handleStatusChange}
                            onSaveNotes={handleSaveNotes}
                            busyItemId={busyItemId}
                        />
                    </>
                ) : (
                    <>
                        <p className="text-sm text-surface-700">
                            Reference mode shows the current published guidance checklist for this visa path.
                        </p>
                        <ReferenceChecklist items={templateItems} />
                        <button
                            type="button"
                            onClick={handleStartLive}
                            disabled={startingLive}
                            className="text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {startingLive && <Loader2 className="w-3 h-3 animate-spin" />}
                            Start live checklist
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};
