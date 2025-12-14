/**
 * TypeScript types matching the Go CLI protocol
 */

// Detection response from Go CLI
export interface DetectResponse {
    format: 'csv' | 'json' | 'jsonl';
    encoding: string;
    delimiter?: {
        delimiter: string;
        confidence_pct: number;
    };
    comment?: string;
    has_header: boolean;
    field_count: number;
    trim_fields: boolean;
    columns: Column[];
    preview: Preview;
    confidence: number;
    issues: Issue[];
    sampled: SampledMeta;
    duration_ms: number;
}

export interface Column {
    name: string;
    type: 'INT' | 'DOUBLE' | 'TIMESTAMP' | 'BOOLEAN' | 'TEXT';
}

export interface Preview {
    rows: number;
    data: Record<string, string>[];
    invalid_rows: number;
}

export interface Issue {
    code: string;
    message: string;
}

export interface SampledMeta {
    lines: number;
    bytes: number;
    duration_ms: number;
}

// Convert result from Go CLI
export interface ConvertResult {
    djson_path: string;
    rows_written: number;
    bytes_written: number;
    duration_ms: number;
    errors?: string[];  // Collected error messages from reader
}

// NDJSON events during conversion
export type ConvertEvent =
    | { type: 'started'; input_path: string; output_path: string }
    | { type: 'progress'; rows_processed?: number; percent?: number }
    | { type: 'warning'; message: string; line?: number }
    | { type: 'result' } & ConvertResult;

// Error response from Go CLI
export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}

// Options for detect command
export interface DetectOptions {
    sampleBytes?: number;
    maxPreviewRows?: number;
}

// Options for convert command
export interface ConvertOptions {
    onProgress?: (event: ConvertEvent) => void;
    signal?: AbortSignal;
}
