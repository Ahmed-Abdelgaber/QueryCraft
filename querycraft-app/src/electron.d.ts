import type { DetectResponse } from '../../querycraft-bridge/src/types';

declare global {
    interface Window {
        electron: {
            selectFile: () => Promise<string | null>;
            getFilePath: (file: File) => Promise<string | null>;
            detectFile: (filePath: string) => Promise<DetectResponse>;
            convertFile: (inputPath: string, outputPath: string) => Promise<{
                djson_path: string;
                rows_converted: number;
            }>;
            loadData: (djsonPath: string) => Promise<void>;
            queryData: (query: string, limit?: number) => Promise<any[]>;
            getColumns: () => Promise<string[]>;
            getRowCount: () => Promise<number>;
            getUniqueValues: (columnName: string) => Promise<any[]>;
            getFilteredRowCount: (whereClause?: string) => Promise<number>;
        };
    }
}

export { };
