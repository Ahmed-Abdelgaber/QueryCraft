import { Search, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import './SearchBar.css';

export interface SearchBarProps {
    onSearch: (query: string) => void;
    debounceMs?: number;
    placeholder?: string;
}

export function SearchBar({ onSearch, debounceMs = 300, placeholder = 'Search...' }: SearchBarProps) {
    const [value, setValue] = useState('');

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(value);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [value, debounceMs, onSearch]);

    const handleClear = useCallback(() => {
        setValue('');
    }, []);

    return (
        <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="search-input"
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="search-clear"
                    aria-label="Clear search"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
