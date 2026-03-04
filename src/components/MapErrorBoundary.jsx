import React from 'react';

/**
 * FE-5: Error boundary for the ImmigrationMap component.
 * Catches WebGL crashes, runtime errors, and other unexpected failures
 * and renders a fallback UI instead of taking down the entire page.
 */
class MapErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[MapErrorBoundary] Map crashed:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: '2rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center'
                }}>
                    <h3 style={{ marginBottom: '0.5rem', color: '#495057' }}>
                        Map Unavailable
                    </h3>
                    <p style={{ color: '#6c757d', marginBottom: '1rem', maxWidth: '400px' }}>
                        The interactive map encountered an error and couldn't load.
                        This may be due to your browser's WebGL support.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#0d6efd',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MapErrorBoundary;
