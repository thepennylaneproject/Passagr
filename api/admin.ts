// api/admin.ts - Admin endpoints for editorial review
import { pgPool as pool } from './server';
import { Request, Response } from 'express';

// Middleware for admin authentication
export function verifyAdminAuth(req: Request, res: Response, next: Function) {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_API_KEY || 'dev-admin-key';

    if (adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
}

// Helper to map entity types to table names
// SECURITY: Strict allowlist to prevent SQL injection
function getTableName(entityType: string): string {
    const tableMap: { [key: string]: string } = {
        'country': 'countries',
        'visa_path': 'visa_paths',
        'requirement': 'requirements',
        'step': 'steps'
    };

    const tableName = tableMap[entityType];
    if (!tableName) {
        throw new Error(`Invalid entity type: ${entityType}`);
    }

    return tableName;
}

// GET /admin/reviews/pending - List all pending reviews
export const getPendingReviews = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT id, entity_type, entity_id, status, notes, diff_summary, created_at
       FROM editorial_reviews 
       WHERE status = 'pending'
       ORDER BY created_at ASC`
        );

        res.json({
            pending_reviews: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching pending reviews:', error);
        res.status(500).json({ error: 'Failed to fetch pending reviews' });
    }
};

// GET /admin/reviews/:id - Get review details with diff
export const getReviewDetails = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Get review with proposed data and diff
        const reviewResult = await pool.query(
            `SELECT id, entity_type, entity_id, status, notes, 
              proposed_data, diff_summary, diff_fields, 
              created_at, reviewer_uid, resolved_at
       FROM editorial_reviews 
       WHERE id = $1`,
            [id]
        );

        if (reviewResult.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const review = reviewResult.rows[0];

        // Fetch current entity if it exists
        let currentEntity = null;
        if (review.entity_id) {
            const tableName = getTableName(review.entity_type);
            const entityResult = await pool.query(
                `SELECT * FROM ${tableName} WHERE id = $1`,
                [review.entity_id]
            );

            if (entityResult.rows.length > 0) {
                currentEntity = entityResult.rows[0];
            }
        }

        res.json({
            review: {
                id: review.id,
                entity_type: review.entity_type,
                entity_id: review.entity_id,
                status: review.status,
                notes: review.notes,
                diff_summary: review.diff_summary,
                created_at: review.created_at,
                reviewer_uid: review.reviewer_uid,
                resolved_at: review.resolved_at
            },
            current_entity: currentEntity,
            proposed_entity: review.proposed_data,
            diff_fields: review.diff_fields
        });
    } catch (error) {
        console.error('Error fetching review details:', error);
        res.status(500).json({ error: 'Failed to fetch review details' });
    }
};

// POST /admin/reviews/:id/approve - Approve review
export const approveReview = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewer_uid, notes } = req.body;

    try {
        const result = await pool.query(
            `UPDATE editorial_reviews 
       SET status = 'approved', 
           reviewer_uid = $1, 
           notes = $2, 
           resolved_at = NOW()
       WHERE id = $3
       RETURNING *`,
            [reviewer_uid || 'admin', notes || 'Approved', id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // TODO: Trigger Publisher agent with approved data
        console.log(`Review ${id} approved. Would trigger publisher here.`);

        res.json({
            success: true,
            message: 'Review approved. Publication will be triggered.',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Error approving review:', error);
        res.status(500).json({ error: 'Failed to approve review' });
    }
};

// POST /admin/reviews/:id/reject - Reject review
export const rejectReview = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewer_uid, notes } = req.body;

    try {
        const result = await pool.query(
            `UPDATE editorial_reviews 
       SET status = 'rejected', 
           reviewer_uid = $1, 
           notes = $2, 
           resolved_at = NOW()
       WHERE id = $3
       RETURNING *`,
            [reviewer_uid || 'admin', notes || 'Rejected', id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json({
            success: true,
            message: 'Review rejected.',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Error rejecting review:', error);
        res.status(500).json({ error: 'Failed to reject review' });
    }
};