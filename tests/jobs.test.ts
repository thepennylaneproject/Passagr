// Cron Jobs API Tests
import request from 'supertest';
import express from 'express';
import { verifyCronAuth, handleFreshnessScan, handleLinkCheck, handleIndexRefresh } from '../api/jobs';

const app = express();
app.use(express.json());
app.post('/jobs/freshness-scan', verifyCronAuth, handleFreshnessScan);
app.post('/jobs/link-check', verifyCronAuth, handleLinkCheck);
app.post('/jobs/index-refresh', verifyCronAuth, handleIndexRefresh);

describe('Cron Jobs API Endpoints', () => {
    const validCronSecret = 'test-cron-secret';
    const invalidCronSecret = 'wrong-secret';

    describe('Authentication', () => {
        it('should reject requests without cron secret', async () => {
            const response = await request(app)
                .post('/jobs/freshness-scan')
                .expect(401);

            expect(response.body.error).toBe('Unauthorized');
        });

        it('should reject requests with invalid cron secret', async () => {
            const response = await request(app)
                .post('/jobs/freshness-scan')
                .set('x-cron-secret', invalidCronSecret)
                .expect(401);

            expect(response.body.error).toBe('Unauthorized');
        });

        it('should accept requests with valid cron secret', async () => {
            const response = await request(app)
                .post('/jobs/freshness-scan')
                .set('x-cron-secret', validCronSecret);

            // May succeed or fail depending on DB state, but should not be 401
            expect(response.status).not.toBe(401);
        });
    });

    describe('POST /jobs/freshness-scan', () => {
        it('should execute freshness scan job', async () => {
            const response = await request(app)
                .post('/jobs/freshness-scan')
                .set('x-cron-secret', validCronSecret);

            // Job may succeed or fail, but should return proper structure
            expect(response.body.job).toBe('freshness-scan');
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('POST /jobs/link-check', () => {
        it('should execute link check job', async () => {
            const response = await request(app)
                .post('/jobs/link-check')
                .set('x-cron-secret', validCronSecret);

            expect(response.body.job).toBe('link-check');
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('POST /jobs/index-refresh', () => {
        it('should execute index refresh job', async () => {
            const response = await request(app)
                .post('/jobs/index-refresh')
                .set('x-cron-secret', validCronSecret);

            expect(response.body.job).toBe('index-refresh');
            expect(response.body.timestamp).toBeDefined();
        });
    });
});
