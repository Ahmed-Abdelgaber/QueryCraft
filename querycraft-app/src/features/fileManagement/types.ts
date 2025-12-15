// File Management Feature Types

export interface FileInfo {
    name: string;
    path: string;
}

export interface DetectedFeatures {
    format: 'csv' | 'json' | 'jsonl';
    delimiter: string;
    comment: string;
    has_header: boolean;
    field_count: number;
    columns: ColumnInfo[];
}

export interface ColumnInfo {
    index: number;
    name: string;
    type: string;
    include: boolean;
}

export interface ParsingConfig {
    format: 'csv' | 'json' | 'jsonl';
    delimiter: string;
    comment: string;
    has_header: boolean;
    field_count: number;
    columns: ColumnInfo[];
}

export interface HistoryItem {
    id: string;
    filename: string;
    path: string;
    timestamp: string;
    status: 'success' | 'failed';
    format: string;
    rowsParsed?: number;
    duration?: number;
    outputPath?: string;
    error?: string;
}
