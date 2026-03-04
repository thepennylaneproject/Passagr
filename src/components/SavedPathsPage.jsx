import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import {
    archiveSavedPath,
    assignSavedPathContext,
    createSaveContext,
    createSavedPathNote,
    deleteSavedPathNote,
    fetchSaveContexts,
    fetchSavedPathNotes,
    fetchSavedPathsActive,
    updateSavedPathNote
} from '../lib/api';

const defaultContextNames = ['Plan A', 'Family', 'Work'];

const SavedPathNotesPanel = ({ savedPathId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [newBody, setNewBody] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');

    const reload = async () => {
        setLoading(true);
        try {
            const rows = await fetchSavedPathNotes(savedPathId);
            setNotes(rows);
            setError(null);
        } catch (err) {
            setError(err?.message || 'Unable to load notes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
    }, [savedPathId]);

    const handleCreate = async () => {
        if (!newBody.trim()) return;
        setSaving(true);
        try {
            await createSavedPathNote({
                savedPathId,
                title: newTitle.trim() || null,
                body: newBody.trim()
            });
            setNewTitle('');
            setNewBody('');
            await reload();
        } catch (err) {
            setError(err?.message || 'Unable to create note.');
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (note) => {
        setEditingId(note.id);
        setEditTitle(note.title || '');
        setEditBody(note.body || '');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editBody.trim()) return;
        setSaving(true);
        try {
            await updateSavedPathNote({
                noteId: editingId,
                title: editTitle.trim() || null,
                body: editBody.trim()
            });
            setEditingId(null);
            await reload();
        } catch (err) {
            setError(err?.message || 'Unable to update note.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (noteId) => {
        setSaving(true);
        try {
            await deleteSavedPathNote(noteId);
            await reload();
        } catch (err) {
            setError(err?.message || 'Unable to delete note.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-4 border-top border-surface-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Notes</p>
            <p className="text-xs text-surface-500 mt-1">
                Notes are sensitive. For stronger account protection, enable a passkey or MFA.
            </p>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-surface-500 mt-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading notes...
                </div>
            ) : error ? (
                <p className="text-sm text-red-600 mt-3">{error}</p>
            ) : notes.length === 0 ? (
                <p className="text-sm text-surface-500 mt-3">No notes yet.</p>
            ) : (
                <div className="space-y-3 mt-3">
                    {notes.map((note) => (
                        <div key={note.id} className="border border-surface-200 rounded-sm p-3 bg-surface-50">
                            {editingId === note.id ? (
                                <div className="space-y-2">
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Optional title"
                                        className="w-full border border-surface-300 px-2 py-1 text-sm"
                                    />
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        rows={3}
                                        className="w-full border border-surface-300 px-2 py-1 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <button type="button" onClick={handleSaveEdit} className="text-xs text-primary-700 hover:text-primary-800">
                                            Save
                                        </button>
                                        <button type="button" onClick={() => setEditingId(null)} className="text-xs text-surface-600 hover:text-surface-700">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {note.title && <p className="text-sm font-semibold text-surface-800">{note.title}</p>}
                                    <p className="text-sm text-surface-700 mt-1 whitespace-pre-wrap">{note.body}</p>
                                    <div className="flex gap-3 mt-2">
                                        <button type="button" onClick={() => startEdit(note)} className="text-xs text-primary-700 hover:text-primary-800">
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(note.id)}
                                            className="text-xs text-red-700 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 space-y-2">
                <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Optional title"
                    className="w-full border border-surface-300 px-2 py-1 text-sm"
                />
                <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    rows={3}
                    placeholder="Add a planning note"
                    className="w-full border border-surface-300 px-2 py-1 text-sm"
                />
                <button
                    type="button"
                    disabled={saving || !newBody.trim()}
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700 hover:text-primary-800 disabled:opacity-50"
                >
                    <Plus className="w-3 h-3" />
                    Add note
                </button>
            </div>
        </div>
    );
};

export const SavedPathsPage = ({ onBack, onOpenPath }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savedPaths, setSavedPaths] = useState([]);
    const [contexts, setContexts] = useState([]);
    const [newContext, setNewContext] = useState('');
    const [saving, setSaving] = useState(false);

    const contextMap = useMemo(() => {
        const map = new Map();
        contexts.forEach((ctx) => map.set(ctx.id, ctx));
        return map;
    }, [contexts]);

    const reload = async () => {
        setLoading(true);
        try {
            const [pathRows, contextRows] = await Promise.all([
                fetchSavedPathsActive(),
                fetchSaveContexts()
            ]);
            setSavedPaths(pathRows);
            setContexts(contextRows);
            setError(null);
        } catch (err) {
            setError(err?.message || 'Unable to load saved paths.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
    }, []);

    const handleCreateContext = async (name) => {
        const trimmed = (name || '').trim();
        if (!trimmed) return;
        setSaving(true);
        try {
            await createSaveContext({ name: trimmed });
            setNewContext('');
            await reload();
        } catch (err) {
            setError(err?.message || 'Unable to create context.');
        } finally {
            setSaving(false);
        }
    };

    const handleAssignContext = async (savedPathId, contextId) => {
        setSaving(true);
        try {
            await assignSavedPathContext({
                savedPathId,
                contextId: contextId || null
            });
            await reload();
        } catch (err) {
            setError(err?.message || 'Unable to assign context.');
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (savedPathId) => {
        setSaving(true);
        try {
            await archiveSavedPath(savedPathId);
            await reload();
        } catch (err) {
            setError(err?.message || 'Unable to remove saved path.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>

            <div className="pathways-page__hero">
                <p className="pathways-page__eyebrow">Saved Paths</p>
                <h1 className="pathways-page__title">Your saved immigration paths</h1>
                <p className="pathways-page__sub">Group paths by planning context and keep sensitive notes in one place.</p>
            </div>

            <section className="profile-card mt-6">
                <div className="profile-card__header">
                    <h3>Context Buckets</h3>
                </div>
                <div className="profile-card__body">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {defaultContextNames.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => handleCreateContext(name)}
                                disabled={saving}
                                className="text-xs uppercase tracking-wide font-semibold px-2 py-1 border border-surface-300 text-surface-700 hover:text-primary-700 disabled:opacity-50"
                            >
                                + {name}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newContext}
                            onChange={(e) => setNewContext(e.target.value)}
                            placeholder="New context name"
                            className="border border-surface-300 px-2 py-1 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => handleCreateContext(newContext)}
                            disabled={saving || !newContext.trim()}
                            className="text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </section>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-surface-500 mt-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading saved paths...
                </div>
            ) : error ? (
                <div className="emptyState text-left mt-8">
                    <p className="emptyState__title">Unable to load saved paths</p>
                    <p className="emptyState__detail">{error}</p>
                </div>
            ) : savedPaths.length === 0 ? (
                <div className="emptyState text-left mt-8">
                    <p className="emptyState__title">No saved paths yet</p>
                    <p className="emptyState__detail">Open a visa path and use Save Path to create your first entry.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 mt-8">
                    {savedPaths.map((savedPath) => (
                        <article key={savedPath.id} className="country-card p-5">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-ink">{savedPath.saved_label || savedPath.canonical_name || 'Saved path'}</h3>
                                    <p className="text-sm text-surface-500 mt-1">
                                        {savedPath.canonical_type || 'Path type not specified'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onOpenPath(savedPath.canonical_path_id)}
                                        className="text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800"
                                    >
                                        Open path
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleArchive(savedPath.id)}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide font-semibold text-red-700 hover:text-red-800 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">Context</label>
                                <select
                                    value={savedPath.context_id || ''}
                                    onChange={(e) => handleAssignContext(savedPath.id, e.target.value || null)}
                                    className="mt-1 border border-surface-300 px-2 py-1 text-sm"
                                >
                                    <option value="">No context</option>
                                    {contexts.map((ctx) => (
                                        <option key={ctx.id} value={ctx.id}>{ctx.name}</option>
                                    ))}
                                </select>
                                {savedPath.context_id && contextMap.get(savedPath.context_id) && (
                                    <p className="text-xs text-surface-500 mt-1">
                                        Assigned to {contextMap.get(savedPath.context_id).name}
                                    </p>
                                )}
                            </div>

                            <SavedPathNotesPanel savedPathId={savedPath.id} />
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};
