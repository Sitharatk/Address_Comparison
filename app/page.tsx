'use client';

import { useState } from 'react';

export default function Home() {
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const compareAddresses = async () => {
    if (!address1 || !address2) {
      setError('Both addresses are required');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setUsingFallback(false);

    try {
      const response = await fetch('/api/compare-addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address1, address2 }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare addresses');
      }

      setResult(data);
      
      // Check if we're using the fallback implementation
      // This is a heuristic - if the reasoning contains "Base similarity score", it's likely the local implementation
      if (data.reasoning && data.reasoning.includes('Base similarity score')) {
        setUsingFallback(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while comparing addresses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Address Comparison Tool</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <div className="mb-6">
            <label htmlFor="address1" className="block text-sm font-medium mb-2">
              Address 1
            </label>
            <textarea
              id="address1"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900"
              rows={3}
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="Enter the first address"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="address2" className="block text-sm font-medium mb-2">
              Address 2
            </label>
            <textarea
              id="address2"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900"
              rows={3}
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Enter the second address"
            />
          </div>
          
          <button
            onClick={compareAddresses}
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-black text-white font-medium rounded-md transition-colors disabled:bg-blue-400"
          >
            {loading ? 'Comparing...' : 'Compare Addresses'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        {result && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Comparison Result</h2>
            
            {usingFallback && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
                Note: Using local comparison algorithm. For better results, add a valid Gemini API key to your .env.local file.
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <span className="font-medium mr-2">Match:</span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  result.match ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.match ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="mb-2">
                <span className="font-medium">Confidence:</span>{' '}
                <span>{(result.confidence * 100).toFixed(1)}%</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${result.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {result.reasoning && (
                <div className="mt-4">
                  <span className="font-medium">Reasoning:</span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{result.reasoning}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}