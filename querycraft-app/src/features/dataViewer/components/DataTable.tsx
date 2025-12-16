import { useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { ColumnFilter } from './ColumnFilter';
import './DataTable.css';

export interface DataTableProps {
    data: any[];
    totalRows: number;
    pageIndex: number;
    pageSize: number;
    sorting: SortingState;
    columnFilters: Record<string, string[]>;
    uniqueValues: Record<string, string[]>;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
    onSortingChange: (sorting: SortingState) => void;
    onFilterChange: (columnName: string, values: string[]) => void;
}

export function DataTable({
    data,
    totalRows,
    pageIndex,
    pageSize,
    sorting,
    columnFilters,
    uniqueValues,
    onPaginationChange,
    onSortingChange,
    onFilterChange
}: DataTableProps) {
    // Dynamically generate columns from data
    const columns = useMemo<ColumnDef<any>[]>(() => {
        if (data.length === 0) return [];

        const firstRow = data[0];
        return Object.keys(firstRow).map((key) => ({
            accessorKey: key,
            header: key,
            cell: (info) => String(info.getValue() ?? ''),
            enableSorting: true,
        }));
    }, [data]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        manualSorting: true, // Server-side sorting
        pageCount: Math.ceil(totalRows / pageSize),
        state: {
            pagination: {
                pageIndex,
                pageSize,
            },
            sorting,
        },
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newState = updater({ pageIndex, pageSize });
                onPaginationChange(newState.pageIndex, newState.pageSize);
            }
        },
        onSortingChange: (updater) => {
            if (typeof updater === 'function') {
                const newState = updater(sorting);
                onSortingChange(newState);
            } else {
                onSortingChange(updater);
            }
        },
    });

    const totalPages = table.getPageCount();

    return (
        <div className="data-table-container">
            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const columnName = String(header.column.columnDef.header);
                                    return (
                                        <th
                                            key={header.id}
                                            onClick={header.column.getToggleSortingHandler()}
                                            className={header.column.getCanSort() ? 'sortable' : ''}
                                        >
                                            <div className="th-content">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {header.column.getCanSort() && (
                                                    <span className="sort-indicator">
                                                        {{
                                                            asc: ' ↑',
                                                            desc: ' ↓',
                                                        }[header.column.getIsSorted() as string] ?? ' ⇅'}
                                                    </span>
                                                )}
                                                {uniqueValues[columnName] && (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <ColumnFilter
                                                            columnName={columnName}
                                                            uniqueValues={uniqueValues[columnName]}
                                                            activeFilters={columnFilters[columnName] || []}
                                                            onFilterChange={(values) => onFilterChange(columnName, values)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => {
                                    const cellValue = cell.getValue() as string;
                                    return (
                                        <td key={cell.id} title={cellValue}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-controls">
                <div className="pagination-info">
                    <span>
                        Showing {pageIndex * pageSize + 1} to{' '}
                        {Math.min((pageIndex + 1) * pageSize, totalRows)} of {totalRows} rows
                    </span>
                </div>

                <div className="pagination-buttons">
                    <button
                        className="pagination-btn"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        ⟨⟨
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        ⟨
                    </button>

                    <span className="page-indicator">
                        Page {pageIndex + 1} of {totalPages}
                    </span>

                    <button
                        className="pagination-btn"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        ⟩
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => table.setPageIndex(totalPages - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        ⟩⟩
                    </button>
                </div>

                <div className="page-size-selector">
                    <label htmlFor="page-size">Rows per page:</label>
                    <select
                        id="page-size"
                        value={pageSize}
                        onChange={(e) => {
                            onPaginationChange(0, Number(e.target.value));
                        }}
                    >
                        {[10, 25, 50, 100, 250, 500].map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
