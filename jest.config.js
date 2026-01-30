module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        'api/**/*.ts',
        'workers/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
