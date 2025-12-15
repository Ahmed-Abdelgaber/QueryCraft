import { useState, useEffect, useRef } from 'react';
import { Filter, X } from 'lucide-react';
import './ColumnFilter.css';

export interface ColumnFilterProps {
    columnName: string;
    uniqueValues: string[];
    onFilterChange: (selectedValues: string[]) => void;
    activeFilters: string[];
}

export function ColumnFilter({ columnName, uniqueValues, onFilterChange, activeFilters }: ColumnFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set(activeFilters));
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const filteredValues = uniqueValues.filter(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleValue = (value: string) => {
        const newSelected = new Set(selectedValues);
        if (newSelected.has(value)) {
            newSelected.delete(value);
        } else {
            newSelected.add(value);
        }
        setSelectedValues(newSelected);
    };

    const selectAll = () => {
        setSelectedValues(new Set(uniqueValues));
    };

    const clearAll = () => {
        setSelectedValues(new Set());
    };

    const applyFilter = () => {
        onFilterChange(Array.from(selectedValues));
        setIsOpen(false);
    };

    const clearFilter = () => {
        setSelectedValues(new Set());
        onFilterChange([]);
        setIsOpen(false);
    };

    const hasActiveFilter = activeFilters.length > 0 && activeFilters.length < uniqueValues.length;

    return (
        <div className="column-filter" ref={dropdownRef}>
            <button
                className={`filter-trigger ${hasActiveFilter ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={`Filter ${columnName}`}
            >
                <Filter size={14} />
            </button>

            {isOpen && (
                <div className="filter-dropdown">
                    <div className="filter-dropdown-header">
                        <input
                            type="text"
                            placeholder="Search values..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-search"
                        />
                    </div>

                    <div className="filter-actions">
                        <button onClick={selectAll} className="filter-action-btn">
                            Select All
                        </button>
                        <button onClick={clearAll} className="filter-action-btn">
                            Clear All
                        </button>
                    </div>

                    <div className="filter-values">
                        {filteredValues.length === 0 ? (
                            <div className="filter-no-results">No values found</div>
                        ) : (
                            filteredValues.map((value) => (
                                <label key={value} className="filter-value-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedValues.has(value)}
                                        onChange={() => toggleValue(value)}
                                    />
                                    <span className="filter-value-label">{String(value)}</span>
                                </label>
                            ))
                        )}
                    </div>

                    <div className="filter-footer">
                        <button onClick={clearFilter} className="filter-btn filter-btn-secondary">
                            <X size={14} />
                            Clear
                        </button>
                        <button onClick={applyFilter} className="filter-btn filter-btn-primary">
                            Apply Filter
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
