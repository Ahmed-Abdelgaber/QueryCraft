import { useState } from 'react';
import { useElectronAPI } from '../../../shared/hooks/useElectronAPI';
import type { DataRow, ColumnDefinition } from '../types';

export function useDataLoader() {
    const electron = useElectronAPI();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DataRow[]>([]);
    const [columns, setColumns] = useState<ColumnDefinition[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [djsonPath, setDjsonPath] = useState<string | null>(null);

    const loadData = async (path: string) => {
        try {
            setIsLoading(true);
            setError(null);
            setDjsonPath(path);
            console.log('📊 Loading data from:', path);

            await electron.loadData(path);

            // Get total row count (convert from BigInt if needed)
            const count = await electron.getRowCount();
            setTotalRows(Number(count));

            // Load first page of data
            const rows = await electron.queryData('SELECT * FROM data', 100);
            setData(rows);

            if (rows.length > 0) {
                const cols = Object.keys(rows[0]).map((name, idx) => ({
                    name,
                    index: idx,
                    type: typeof rows[0][name]
                }));
                setColumns(cols);
            }

            console.log('✅ Data loaded successfully:', {
                columns: Object.keys(rows[0] || {}).length,
                rows: rows.length,
                totalRows: count
            });
        } catch (err) {
            console.error('❌ Failed to load data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPage = async (
        pageIndex: number,
        pageSize: number,
        sortBy?: { column: string; direction: 'asc' | 'desc' },
        columnFilters?: Record<string, string[]>
    ) => {
        if (!djsonPath) {
            throw new Error('No data loaded');
        }

        try {
            const offset = pageIndex * pageSize;
            let query = `SELECT * FROM data`;

            // Add WHERE for column filters
            if (columnFilters && Object.keys(columnFilters).length > 0) {
                const filterClauses = Object.entries(columnFilters)
                    .filter(([_, values]) => values.length > 0)
                    .map(([column, values]) => {
                        const escapedValues = values.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
                        return `"${column}" IN (${escapedValues})`;
                    });

                if (filterClauses.length > 0) {
                    query += ` WHERE ${filterClauses.join(' AND ')}`;
                }
            }

            // Add ORDER BY if sorting is active
            if (sortBy) {
                query += ` ORDER BY "${sortBy.column}" ${sortBy.direction.toUpperCase()}`;
            }

            query += ` LIMIT ${pageSize} OFFSET ${offset}`;

            console.log('📊 Executing query:', query);
            console.log('  Filters:', columnFilters);
            console.log('  Sort:', sortBy);

            const rows = await electron.queryData(query, pageSize);
            setData(rows);
        } catch (err) {
            console.error('❌ Failed to fetch page:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch page');
            throw err;
        }
    };

    return {
        isLoading,
        data,
        columns,
        totalRows,
        setTotalRows,
        error,
        loadData,
        fetchPage
    };
}
