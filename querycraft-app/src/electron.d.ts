declare global {
    interface Window {
        electron: {
            selectFile: () => Promise<string | null>;
            detectFile: (filePath: string) => Promise<any>;
            convertFile: (inputPath: string, outputPath: string) => Promise<any>;
            loadData: (djsonPath: string) => Promise<any>;
            queryData: (sql: string, limit?: number) => Promise<any[]>;
        };
    }
}

export { };
