import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { SortingState } from '@tanstack/react-table';
import { Button } from '../shared/components/Button';
import { useDataLoader, DataTable } from '../features/dataViewer';
import { useElectronAPI } from '../shared/hooks/useElectronAPI';
// import { SearchBar } from '../features/dataViewer'; // Temporarily disabled
import './ExplorerPage.css';

export default function ExplorerPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isLoading, data, totalRows, setTotalRows, error, loadData, fetchPage } = useDataLoader();
    const electron = useElectronAPI();

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(100);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
    const [uniqueValues, setUniqueValues] = useState<Record<string, string[]>>({});
    // const [searchQuery, setSearchQuery] = useState(''); // Temporarily disabled

    const djsonPath = searchParams.get('djson');
    const fileName = searchParams.get('file');

    useEffect(() => {
        if (!djsonPath) {
            return;
        }
        loadData(djsonPath).catch(() => {
            // Error handled in hook
        });
    }, [djsonPath]);

    // Load unique values for each column after data is loaded
    useEffect(() => {
        if (data.length > 0) {
            const columns = Object.keys(data[0]);
            Promise.all(
                columns.map(async (column) => {
                    try {
                        const values = await electron.getUniqueValues(column);
                        return { column, values };
                    } catch (err) {
                        console.error(`Failed to get unique values for ${column}:`, err);
                        return { column, values: [] };
                    }
                })
            ).then((results) => {
                const uniqueValuesMap: Record<string, string[]> = {};
                results.forEach(({ column, values }) => {
                    uniqueValuesMap[column] = values;
                });
                setUniqueValues(uniqueValuesMap);
            });
        }
    }, [data]);

    const handlePaginationChange = async (newPageIndex: number, newPageSize: number) => {
        setPageIndex(newPageIndex);
        setPageSize(newPageSize);

        try {
            const sortBy = sorting.length > 0
                ? { column: sorting[0].id, direction: sorting[0].desc ? 'desc' as const : 'asc' as const }
                : undefined;
            await fetchPage(newPageIndex, newPageSize, sortBy, columnFilters);
        } catch (err) {
            console.error('Failed to fetch page:', err);
        }
    };

    const handleSortingChange = async (newSorting: SortingState) => {
        setSorting(newSorting);
        setPageIndex(0); // Reset to first page when sorting changes

        try {
            const sortBy = newSorting.length > 0
                ? { column: newSorting[0].id, direction: newSorting[0].desc ? 'desc' as const : 'asc' as const }
                : undefined;
            await fetchPage(0, pageSize, sortBy, columnFilters);
        } catch (err) {
            console.error('Failed to apply sorting:', err);
        }
    };

    const handleFilterChange = async (columnName: string, selectedValues: string[]) => {
        console.log('🔧 Filter change:', columnName, selectedValues);
        const newFilters = { ...columnFilters };

        if (selectedValues.length === 0 || selectedValues.length === uniqueValues[columnName]?.length) {
            // Remove filter if nothing or everything is selected
            delete newFilters[columnName];
            console.log('  → Removing filter for', columnName);
        } else {
            newFilters[columnName] = selectedValues;
            console.log('  → Setting filter for', columnName, ':', selectedValues);
        }

        setColumnFilters(newFilters);
        setPageIndex(0); // Reset to first page when filtering

        try {
            // Build WHERE clause for filtered count
            let whereClause = '';
            if (Object.keys(newFilters).length > 0) {
                const filterClauses = Object.entries(newFilters)
                    .filter(([_, values]) => values.length > 0)
                    .map(([column, values]) => {
                        const escapedValues = values.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
                        return `"${column}" IN (${escapedValues})`;
                    });
                whereClause = filterClauses.join(' AND ');
            }

            // Update totalRows with filtered count
            const filteredCount = await electron.getFilteredRowCount(whereClause || undefined);
            setTotalRows(filteredCount);
            console.log('  → Updated totalRows to:', filteredCount);

            const sortBy = sorting.length > 0
                ? { column: sorting[0].id, direction: sorting[0].desc ? 'desc' as const : 'asc' as const }
                : undefined;
            await fetchPage(0, pageSize, sortBy, newFilters);
        } catch (err) {
            console.error('Failed to apply filter:', err);
        }
    };

    // Temporarily disabled - needs empty results handling
    // const handleSearch = useCallback(async (query: string) => {
    //     setSearchQuery(query);
    //     setPageIndex(0);
    //     try {
    //         const sortBy = sorting.length > 0
    //             ? { column: sorting[0].id, direction: sorting[0].desc ? 'desc' as const : 'asc' as const }
    //             : undefined;
    //         await fetchPage(0, pageSize, sortBy, query);
    //     } catch (err) {
    //         console.error('Failed to search:', err);
    //     }
    // }, [sorting, pageSize, fetchPage]);

    if (!djsonPath && !isLoading) {
        return (
            <div className="data-explorer">
                <div className="explorer-container">
                    <div className="explorer-error">
                        <h2>No Data File Specified</h2>
                        <p>Please select a file from the home page</p>
                        <Button variant="primary" onClick={() => navigate('/')}>
                            Return to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="data-explorer">
            {/* Header */}
            <div className="explorer-header">
                <div className="explorer-header-content">
                    <div className="explorer-header-left">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                            <ArrowLeft size={20} />
                            Back to Home
                        </Button>
                        <div className="explorer-header-info">
                            <h1>{fileName || 'Data Explorer'}</h1>
                            {!isLoading && !error && data.length > 0 && (
                                <p className="explorer-meta">
                                    {totalRows.toLocaleString()} total rows • {Object.keys(data[0]).length} columns
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Temporarily disabled - SearchBar */}
                    {/* {!isLoading && !error && data.length > 0 && (
                        <div className="explorer-header-right">
                            <SearchBar 
                                onSearch={handleSearch}
                                placeholder="Search across all columns..."
                            />
                        </div>
                    )} */}
                </div>
            </div>

            {/* Content */}
            <div className="explorer-container">
                {isLoading && (
                    <div className="explorer-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading data...</p>
                    </div>
                )}

                {error && (
                    <div className="explorer-error">
                        <h2>Error Loading Data</h2>
                        <p>{error}</p>
                        <Button variant="primary" onClick={() => navigate('/')}>
                            Return to Home
                        </Button>
                    </div>
                )}

                {!isLoading && !error && data.length > 0 && (
                    <div className="explorer-content">
                        <DataTable
                            data={data}
                            totalRows={totalRows}
                            pageIndex={pageIndex}
                            pageSize={pageSize}
                            sorting={sorting}
                            columnFilters={columnFilters}
                            uniqueValues={uniqueValues}
                            onPaginationChange={handlePaginationChange}
                            onSortingChange={handleSortingChange}
                            onFilterChange={handleFilterChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}


