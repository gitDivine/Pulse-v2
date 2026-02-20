"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";

interface Address {
  id: string;
  raw_address: string;
  landmark: string | null;
  city: string;
  state: string;
  lga: string | null;
  confidence_score: number;
  delivery_count: number;
}

interface AddressAutocompleteProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  /** Called when user selects a verified address from the dropdown */
  onSelect?: (address: Address) => void;
  /** Pre-filter by state for more relevant results */
  filterState?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  filterState,
  required,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, limit: "6" });
        if (filterState) params.set("state", filterState);
        const res = await fetch(`/api/addresses?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.addresses || []);
        }
      } catch {
        // Silently fail — user can still type manually
      } finally {
        setLoading(false);
      }
    },
    [filterState]
  );

  // Debounced search
  useEffect(() => {
    if (selectedId) return; // Don't search after selecting
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    return () => clearTimeout(debounceRef.current);
  }, [value, fetchSuggestions, selectedId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(address: Address) {
    onChange(address.raw_address);
    setSelectedId(address.id);
    setOpen(false);
    onSelect?.(address);
  }

  function handleInputChange(val: string) {
    setSelectedId(null); // Reset selection when user types
    onChange(val);
    setOpen(true);
  }

  const showDropdown = open && suggestions.length > 0 && !selectedId;

  return (
    <div ref={wrapperRef} className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          required={required}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/5 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-lg overflow-hidden">
            <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[10px] uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                Verified Addresses
              </p>
            </div>
            {suggestions.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => handleSelect(addr)}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-colors"
              >
                <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {addr.raw_address}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {addr.city}, {addr.state}
                    </span>
                    {addr.landmark && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        · {addr.landmark}
                      </span>
                    )}
                  </div>
                  {addr.delivery_count > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className={`h-3 w-3 ${
                        addr.confidence_score >= 0.7 ? "text-green-500" : "text-gray-400"
                      }`} />
                      <span className={`text-[10px] font-medium ${
                        addr.confidence_score >= 0.7
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}>
                        {addr.delivery_count} successful deliver{addr.delivery_count !== 1 ? "ies" : "y"}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
