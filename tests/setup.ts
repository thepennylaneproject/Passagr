// Test setup file
// This runs before each test file

// Mock pg Pool before any imports to prevent database connections
jest.mock('pg', () => {
    const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
    const mockRelease = jest.fn();
    const mockConnect = jest.fn().mockResolvedValue({
        query: mockQuery,
        release: mockRelease,
    });
    const mockEnd = jest.fn();
    const mockOn = jest.fn();

    class MockPool {
        query = mockQuery;
        connect = mockConnect;
        end = mockEnd;
        on = mockOn;
    }

    return { Pool: MockPool };
});

// Suppress console.error during tests to keep output clean
if (!process.env.DEBUG) {
    const originalError = console.error;
    global.console.error = jest.fn((...args) => {
        // Only suppress expected test errors
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('Error in') ||
            message.includes('failed:')
        )) {
            return;
        }
        originalError(...args);
    });
}

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.ADMIN_API_KEY = 'test-admin-key';
process.env.CORS_ORIGIN = '*';
