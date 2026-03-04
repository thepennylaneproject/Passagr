import request from 'supertest';
import express from 'express';
import { getCountries, getVisaPathById } from '../api/public';
import { pgPool } from '../api/db';

const app = express();
app.get('/public/countries', getCountries);
app.get('/public/visa-paths/:id', getVisaPathById);

describe('Public API alignment', () => {
    const mockQuery = pgPool.query as jest.Mock;

    beforeEach(() => {
        mockQuery.mockReset();
    });

    it('GET /public/countries uses listable pathway counts only', async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: [
                    { id: 'c1', iso2: 'PT', name: 'Portugal' },
                    { id: 'c2', iso2: 'ES', name: 'Spain' }
                ]
            })
            .mockResolvedValueOnce({
                rows: [
                    { country_id: 'c1', name: 'Digital Nomad', type: 'remote', description: 'Nomad visa' },
                    { country_id: 'c1', name: 'Startup', type: 'startup', description: 'Startup visa' }
                ]
            });

        const response = await request(app).get('/public/countries').expect(200);

        const featurePortugal = response.body.features.find((feature: any) =>
            feature.properties?.iso2 === 'PT'
        );

        expect(featurePortugal.properties.pathway_count).toBe(2);
        expect(featurePortugal.properties.pathway_types).toEqual(expect.arrayContaining(['remote', 'startup']));

        const countriesQuery = mockQuery.mock.calls[0][0] as string;
        expect(countriesQuery).toContain("status IN ('published', 'verified')");

        const visaPathsQuery = mockQuery.mock.calls[1][0] as string;
        expect(visaPathsQuery).toContain("status = 'published'");
    });

    it('GET /public/visa-paths/:id filters subrecords to published', async () => {
        mockQuery
            .mockResolvedValueOnce({
                rows: [{ id: 'vp1', name: 'Digital Nomad', status: 'published' }]
            })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

        await request(app).get('/public/visa-paths/vp1').expect(200);

        const requirementsQuery = mockQuery.mock.calls[1][0] as string;
        const stepsQuery = mockQuery.mock.calls[2][0] as string;

        expect(requirementsQuery).toContain("status = 'published'");
        expect(stepsQuery).toContain("status = 'published'");
    });
});
