'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface SearchSuggestionsProps {
  query: string;
  isOpen: boolean;
  onSelect: (suggestion: string) => void;
  className?: string;
}

// Popular searches - could be fetched from analytics in production
const POPULAR_SEARCHES = [
  'hoodies',
  'new arrivals',
  'sale',
  't-shirts',
  'jackets',
];

export function SearchSuggestions({ 
  query, 
  isOpen, 
  onSelect, 
  className = '' 
}: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // Simple suggestion logic - in production, use API or search service
    const filtered = [
      ...POPULAR_SEARCHES,
      ...recentSearches,
    ].filter(search => 
      search.toLowerCase().includes(query.toLowerCase()) && 
      search.toLowerCase() !== query.toLowerCase()
    );

    setSuggestions([...new Set(filtered)].slice(0, 5));
  }, [query, recentSearches]);

  if (!isOpen) return null;

  const handleSelect = (suggestion: string) => {
    // Add to recent searches
    const updated = [suggestion, ...recentSearches.filter(s => s !== suggestion)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    
    onSelect(suggestion);
  };

  return (
    <div className={`absolute top-full left-0 right-0 mt-1 bg-background border-border rounded-lg shadow-lg z-50 ${className}`}>
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-2">
          <p className="text-xs text-muted-foreground px-3 py-1">Suggestions</p>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="p-2 border-t">
          <p className="text-xs text-muted-foreground px-3 py-1">Recent Searches</p>
          {recentSearches.map((search) => (
            <button
              key={search}
              onClick={() => handleSelect(search)}
              className="w-full text-left px-3 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm"
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{search}</span>
            </button>
          ))}
        </div>
      )}

      {/* Popular Searches */}
      {!query && (
        <div className="p-2 border-t">
          <p className="text-xs text-muted-foreground px-3 py-1">Popular Searches</p>
          {POPULAR_SEARCHES.map((search) => (
            <button
              key={search}
              onClick={() => handleSelect(search)}
              className="w-full text-left px-3 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm"
            >
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>{search}</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="p-2 border-t bg-muted">
        <div className="flex gap-2">
          <Link
            href="/collections"
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1"
          >
            View all collections
          </Link>
          <Link
            href="/new-arrivals"
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1"
          >
            New arrivals
          </Link>
        </div>
      </div>
    </div>
  );
}