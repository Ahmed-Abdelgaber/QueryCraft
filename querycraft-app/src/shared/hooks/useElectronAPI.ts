/**
 * Hook wrapper for Electron IPC API
 * Provides a clean interface to all Electron main process functions
 * Makes the app easier to test and maintains clear API boundaries
 */
export function useElectronAPI() {
    return {
        selectFile: () => window.electron.selectFile(),
        getFilePath: (file: File) => window.electron.getFilePath(file),
        detectFile: (filePath: string) => window.electron.detectFile(filePath),
        convertFile: (inputPath: string, outputPath: string) =>
            window.electron.convertFile(inputPath, outputPath),
        loadData: (djsonPath: string) => window.electron.loadData(djsonPath),
        queryData: (query: string, limit?: number) => window.electron.queryData(query, limit),
        getColumns: () => window.electron.getColumns(),
        getRowCount: () => window.electron.getRowCount(),
        getUniqueValues: (columnName: string) => window.electron.getUniqueValues(columnName),
        getFilteredRowCount: (whereClause?: string) => window.electron.getFilteredRowCount(whereClause),
    };
}
