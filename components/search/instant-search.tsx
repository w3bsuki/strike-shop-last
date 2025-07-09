'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { SearchSuggestions } from './search-suggestions';
import { shopifyService } from '@/lib/shopify';
import type { IntegratedProduct } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface InstantSearchProps {
  className?: string;
  placeholder?: string;
  variant?: 'default' | 'minimal';
}

export function InstantSearch({ 
  className = '', 
  placeholder = 'Search products...',
  variant = 'default'
}: InstantSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [instantResults, setInstantResults] = useState<IntegratedProduct[]>([]);
  
  const debouncedQuery = useDebounce(query, 200); // Faster for instant search

  // Instant search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setInstantResults([]);
      return;
    }

    const searchInstant = async () => {
      setIsSearching(true);
      try {
        const results = await shopifyService.searchProducts(debouncedQuery);
        setInstantResults(results.slice(0, 5)); // Show first 5 results
      } catch (error) {
        console.error('Instant search error:', error);
        setInstantResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchInstant();
  }, [debouncedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleClear = () => {
    setQuery('');
    setInstantResults([]);
    inputRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showResults = isOpen && (instantResults.length > 0 || !query);

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`pl-10 pr-10 min-h-[48px] ${
              variant === 'minimal' ? 'border-0 bg-muted' : ''
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </form>

      {/* Instant Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border-border rounded-lg shadow-lg z-50 max-h-[500px] overflow-auto">
          {/* Instant Product Results */}
          {instantResults.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-3 py-1">Products</p>
              {instantResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="flex items-center gap-3 p-2 hover:bg-muted rounded"
                >
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={product.content.images[0]?.url || '/placeholder.svg'}
                      alt={product.content.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.content.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.pricing.displaySalePrice || product.pricing.displayPrice}
                    </p>
                  </div>
                </Link>
              ))}
              
              {/* View All Results */}
              <button
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full text-center text-sm text-info hover:text-info-foreground py-2 border-t mt-2"
              >
                View all results →
              </button>
            </div>
          )}

          {/* Suggestions when no query */}
          {!query && (
            <SearchSuggestions
              query={query}
              isOpen={true}
              onSelect={(suggestion) => {
                setQuery(suggestion);
                router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                setIsOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}