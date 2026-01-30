// ui/editor/ReviewPanel.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Diff, diffArrays } from 'diff';

interface Review {
    id: string;
    entity_type: string;
    entity_id: string;
    notes: string;
    created_at: string;
}

interface ReviewDetails {
    review: Review;
    current_entity: any;
    proposed_entity: any;
}

// A simplified diff component for display
const JsonDiff: React.FC<{ current: any, proposed: any }> = ({ current, proposed }) => {
    const diff = diffArrays(
        JSON.stringify(current, null, 2).split('\n'),
        JSON.stringify(proposed, null, 2).split('\n')
    );

    return (
        <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto">
            {diff.map((part, index) => {
                const color = part.added ? 'bg-green-200' : part.removed ? 'bg-red-200' : '';
                return (
                    <span key={index} className={color}>
                        {part.value}
                    </span>
                );
            })}
        </pre>
    );
};

const ReviewPanel: React.FC<{ reviewId: string }> = ({ reviewId }) => {
    const [details, setDetails] = useState<ReviewDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axios.get(`/admin/reviews/${reviewId}`);
                setDetails(response.data);
            } catch (err) {
                setError("Failed to load review details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [reviewId]);

    const handleApprove = async () => {
        // This would call the admin API
        // await axios.post(`/admin/reviews/${reviewId}/approve`, { reviewer_uid: 'editor-1' });
        console.log("Approved.");
    };

    const handleReject = async () => {
        // await axios.post(`/admin/reviews/${reviewId}/reject`, { reviewer_uid: 'editor-1', notes: 'Reason for rejection' });
        console.log("Rejected.");
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!details) return <div>Review not found.</div>;

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Reviewing Changes for {details.review.entity_type}</h1>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h2 className="text-lg font-semibold">Current Version</h2>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(details.current_entity, null, 2)}
                    </pre>
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Proposed Version</h2>
                    {/* In a real scenario, this would be populated with the data from the review */}
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(details.proposed_entity, null, 2)}
                    </pre>
                </div>
            </div>
            
            <div className="mt-4">
                <h2 className="text-lg font-semibold">Diff Highlights</h2>
                <JsonDiff current={details.current_entity} proposed={details.proposed_entity} />
            </div>

            <div className="mt-8 flex space-x-4">
                <button onClick={handleApprove} className="px-6 py-2 bg-green-500 text-white rounded-md">Approve</button>
                <button onClick={handleReject} className="px-6 py-2 bg-red-500 text-white rounded-md">Reject</button>
            </div>
            
        </div>
    );
};

export default ReviewPanel;