'use client';

// Sin caché
export const dynamic = 'force-dynamic';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-google-api');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test Google API</h1>
      <button 
        onClick={runTest}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {loading ? 'Probando...' : 'Probar API de Google'}
      </button>
      
      {result && (
        <pre style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#1a1a1a',
          color: '#0f0',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '80vh',
        }}>
          {result}
        </pre>
      )}
    </div>
  );
}

