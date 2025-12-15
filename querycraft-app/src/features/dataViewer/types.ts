// Data Viewer Feature Types

export interface DataRow {
    [key: string]: any;
}

export interface ColumnDefinition {
    name: string;
    index: number;
    type: string;
}

export interface QueryParams {
    djson: string;
    file: string;
}

export interface DataViewerState {
    isLoading: boolean;
    data: DataRow[];
    columns: ColumnDefinition[];
    error: string | null;
}
