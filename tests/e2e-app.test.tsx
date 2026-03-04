/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { fetchCountries, fetchCountryById, fetchVisaPaths, fetchVisaPathDetail } from '../src/lib/api';

jest.mock('../src/lib/api', () => ({
    fetchCountries: jest.fn(),
    fetchCountryById: jest.fn(),
    fetchVisaPaths: jest.fn(),
    fetchVisaPathDetail: jest.fn()
}));

jest.mock('../src/components/ImmigrationMap.jsx', () => ({
    __esModule: true,
    default: ({ onSelectCountry }: { onSelectCountry: (iso2: string) => void }) => (
        <button type="button" onClick={() => onSelectCountry('PT')}>
            Select Portugal
        </button>
    )
}));

describe('App E2E flows', () => {
    const mockedFetchCountries = fetchCountries as jest.Mock;
    const mockedFetchCountryById = fetchCountryById as jest.Mock;
    const mockedFetchVisaPaths = fetchVisaPaths as jest.Mock;
    const mockedFetchVisaPathDetail = fetchVisaPathDetail as jest.Mock;

    beforeEach(() => {
        mockedFetchCountries.mockReset();
        mockedFetchCountryById.mockReset();
        mockedFetchVisaPaths.mockReset();
        mockedFetchVisaPathDetail.mockReset();
    });

    it('browse → filter → open country → open path', async () => {
        mockedFetchCountries.mockResolvedValue([
            {
                id: 'c1',
                name: 'Portugal',
                iso2: 'PT',
                regions: ['Europe'],
                last_verified_at: '2024-01-01T00:00:00Z',
                lgbtq_rights_index: 4,
                abortion_access_status: 'Protected',
                abortion_access_tier: 'protected',
                pathway_count: 1,
                pathway_types: ['remote']
            },
            {
                id: 'c2',
                name: 'Spain',
                iso2: 'ES',
                regions: ['Europe'],
                last_verified_at: '2024-01-01T00:00:00Z',
                lgbtq_rights_index: 3,
                abortion_access_status: 'Protected',
                abortion_access_tier: 'protected',
                pathway_count: 0,
                pathway_types: []
            }
        ]);

        mockedFetchCountryById.mockResolvedValue({
            id: 'c1',
            name: 'Portugal',
            iso2: 'PT'
        });

        mockedFetchVisaPaths.mockResolvedValue([
            { id: 'vp1', name: 'Digital Nomad', type: 'remote', description: 'Nomad visa' }
        ]);

        mockedFetchVisaPathDetail.mockResolvedValue({
            id: 'vp1',
            name: 'Digital Nomad',
            description: 'Nomad visa',
            type: 'remote',
            requirements: [{ id: 'r1', label: 'Passport', doc_list: ['Passport'] }]
        });

        render(<App />);

        expect(await screen.findByText('Portugal')).toBeInTheDocument();

        const searchInput = screen.getByPlaceholderText('Search countries...');
        await userEvent.type(searchInput, 'Portugal');
        expect(screen.queryByText('Spain')).not.toBeInTheDocument();

        await userEvent.click(screen.getByText('Portugal'));

        expect(await screen.findByText('Country Profile')).toBeInTheDocument();
        await userEvent.click(screen.getByText('View pathways'));

        expect(await screen.findByText('Available Visa Pathways')).toBeInTheDocument();
        await userEvent.click(screen.getByText('Digital Nomad'));

        expect(await screen.findByText('Requirements Checklist')).toBeInTheDocument();
    });

    it('map select → drawer → open profile', async () => {
        mockedFetchCountries.mockResolvedValue([
            {
                id: 'c1',
                name: 'Portugal',
                iso2: 'PT',
                regions: ['Europe'],
                last_verified_at: '2024-01-01T00:00:00Z',
                lgbtq_rights_index: 4,
                abortion_access_status: 'Protected',
                abortion_access_tier: 'protected',
                pathway_count: 1,
                pathway_types: ['remote']
            }
        ]);

        mockedFetchCountryById.mockResolvedValue({
            id: 'c1',
            name: 'Portugal',
            iso2: 'PT'
        });

        render(<App />);

        await userEvent.click(await screen.findByText('Select Portugal'));

        expect(await screen.findByText('Country Profile')).toBeInTheDocument();
    });

    it('backend failure shows explicit error UI for pathways', async () => {
        mockedFetchCountries.mockResolvedValue([
            {
                id: 'c1',
                name: 'Portugal',
                iso2: 'PT',
                regions: ['Europe'],
                last_verified_at: '2024-01-01T00:00:00Z',
                lgbtq_rights_index: 4,
                abortion_access_status: 'Protected',
                abortion_access_tier: 'protected',
                pathway_count: 1,
                pathway_types: ['remote']
            }
        ]);

        mockedFetchCountryById.mockResolvedValue({
            id: 'c1',
            name: 'Portugal',
            iso2: 'PT'
        });

        mockedFetchVisaPaths.mockRejectedValue(new Error('Network down'));

        render(<App />);

        await userEvent.click(await screen.findByText('Portugal'));
        await userEvent.click(await screen.findByText('View pathways'));

        await waitFor(() => {
            expect(screen.getByText('Unable to load visa pathways')).toBeInTheDocument();
            expect(screen.getByText('Network down')).toBeInTheDocument();
        });
    });
});
