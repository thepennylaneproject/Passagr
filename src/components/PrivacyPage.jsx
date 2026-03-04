import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createPrivacyDeletionRequest, createPrivacyExport } from '../lib/api';

export const PrivacyPage = ({ onBack }) => {
    const [loadingExport, setLoadingExport] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleExport = async () => {
        setLoadingExport(true);
        setError('');
        setMessage('');
        try {
            const result = await createPrivacyExport();
            setMessage(`Export request created: ${result.job_id} (${result.status}).`);
        } catch (err) {
            setError(err?.message || 'Unable to create export request.');
        } finally {
            setLoadingExport(false);
        }
    };

    const handleDelete = async () => {
        setLoadingDelete(true);
        setError('');
        setMessage('');
        try {
            const result = await createPrivacyDeletionRequest();
            setMessage(`Deletion request created: ${result.request_id} (${result.status}).`);
        } catch (err) {
            setError(err?.message || 'Unable to create deletion request.');
        } finally {
            setLoadingDelete(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <button onClick={onBack} className="flex items-center text-surface-500 hover:text-primary-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>

            <div className="pathways-page__hero">
                <p className="pathways-page__eyebrow">Privacy</p>
                <h1 className="pathways-page__title">Privacy controls</h1>
                <p className="pathways-page__sub">
                    Manage exports and account deletion requests. For account safety, consider enabling a passkey or MFA.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <section className="profile-card">
                    <div className="profile-card__header">
                        <h3>Export your data</h3>
                    </div>
                    <p className="profile-card__body">Create a downloadable export of your saved paths, checklists, contexts, and notes.</p>
                    <div className="profile-card__body">
                        <a href="/v1/privacy/exports" className="text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800">
                            Export link
                        </a>
                    </div>
                    <div className="profile-card__body">
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={loadingExport}
                            className="text-xs uppercase tracking-wide font-semibold text-primary-700 hover:text-primary-800 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {loadingExport && <Loader2 className="w-3 h-3 animate-spin" />}
                            Request export
                        </button>
                    </div>
                </section>

                <section className="profile-card">
                    <div className="profile-card__header">
                        <h3>Delete account</h3>
                    </div>
                    <p className="profile-card__body">Create a deletion request for user-owned data and account identity according to policy.</p>
                    <div className="profile-card__body">
                        <a href="/v1/privacy/deletion-requests" className="text-xs uppercase tracking-wide font-semibold text-red-700 hover:text-red-800">
                            Delete account link
                        </a>
                    </div>
                    <div className="profile-card__body">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loadingDelete}
                            className="text-xs uppercase tracking-wide font-semibold text-red-700 hover:text-red-800 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {loadingDelete && <Loader2 className="w-3 h-3 animate-spin" />}
                            Request deletion
                        </button>
                    </div>
                </section>
            </div>

            {error && (
                <div className="emptyState text-left mt-6">
                    <p className="emptyState__title">Request failed</p>
                    <p className="emptyState__detail">{error}</p>
                </div>
            )}
            {message && (
                <div className="emptyState text-left mt-6">
                    <p className="emptyState__title">Request submitted</p>
                    <p className="emptyState__detail">{message}</p>
                </div>
            )}
        </div>
    );
};
