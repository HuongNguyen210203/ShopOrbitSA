"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import api from "@/lib/axios";
import { Product, PagedResult } from "@/types";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<PagedResult<Product>>(
          "/api/v1/Products",
          {
            params: { search: debouncedQuery, pageSize: 5, pageIndex: 1 },
          }
        );

        let items: Product[] = [];
        if (data && Array.isArray((data as any).data)) {
          items = (data as any).data;
        } else if (data && Array.isArray(data.items)) {
          items = data.items;
        }
        setResults(items);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md hidden sm:block">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative z-50">
        <div className="relative flex items-center bg-gray-100 rounded-full border border-transparent focus-within:bg-white focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <Search size={18} className="absolute left-3 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder="Search products..."
            className="w-full bg-transparent border-none py-2 pl-10 pr-10 text-sm focus:ring-0 placeholder:text-gray-400 rounded-full"
          />

          <div className="absolute right-3 flex items-center">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-indigo-600" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setIsOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {/* DROPDOWN RESULTS */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40">
          {/* Header results */}
          {results.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
              Products
            </div>
          )}

          {/* List of products */}
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length > 0
              ? results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="relative h-10 w-10 shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={
                          product.imageUrl ||
                          "https://placehold.co/100x100.png?text=IMG"
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {product.categoryName}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-indigo-600">
                      ${product.price}
                    </div>
                  </Link>
                ))
              : !loading && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No products found for "{query}"
                  </div>
                )}
          </div>

          {/* Footer Dropdown - View All */}
          {results.length > 0 && (
            <button
              onClick={handleSubmit}
              className="w-full block bg-gray-50 p-3 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              View all results for "{query}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
