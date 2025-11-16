"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  _id: string;
  title: string;
  category: string;
  priceCents: number;
}

export default function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setResults(data.items || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  function handleSelect(product: SearchResult) {
    router.push(`/products/${product._id}`);
    setQuery('');
    setShowResults(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query)}`);
      setQuery('');
      setShowResults(false);
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search products..."
          className="w-full rounded-md border border-gray-800 bg-gray-900 pl-12 pr-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X size={18} />
          </button>
        )}
      </form>

      {showResults && (results.length > 0 || loading) && (
        <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Searching...</div>
          ) : (
            <>
              {results.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleSelect(product)}
                  className="w-full text-left p-4 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{product.title}</p>
                      <p className="text-sm text-gray-400 capitalize">{product.category}</p>
                    </div>
                    <p className="text-white font-semibold ml-4">
                      ${(product.priceCents / 100).toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
              {results.length > 0 && (
                <div className="p-2 border-t border-gray-800">
                  <button
                    onClick={handleSubmit}
                    className="w-full text-center text-blue-400 hover:text-blue-300 text-sm py-2"
                  >
                    View all results →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

