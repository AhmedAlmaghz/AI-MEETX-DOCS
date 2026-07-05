'use client';

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
        {error.message ?? 'An unexpected error occurred.'}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: '#0066FF',
          color: '#FFFFFF',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Try again
      </button>
    </div>
  );
}
