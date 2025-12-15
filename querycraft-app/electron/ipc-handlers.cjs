const { ipcMain, dialog } = require('electron');
const { GoBridge, DuckDBManager, getTempDjsonPath } = require('../../querycraft-bridge/dist/index');

// Initialize bridge and database manager
const bridge = new GoBridge();
const dbManager = new DuckDBManager();

/**
 * Register all IPC handlers for QueryCraft
 * This module handles all communication between renderer and main process
 */
function registerIPCHandlers() {
    // ==================== File Selection ====================

    /**
     * Open file dialog and return selected file path
     */
    // File selection dialog
    ipcMain.handle('select-file', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Log Files', extensions: ['log', 'csv', 'json', 'jsonl', 'txt'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        return result.canceled ? null : result.filePaths[0];
    });

    // ==================== File Detection ====================

    /**
     * Detect file format and structure using Go bridge
     */
    ipcMain.handle('detect-file', async (_, filePath) => {
        try {
            return await bridge.detect(filePath);
        } catch (error) {
            throw new Error(`Detection failed: ${error.message}`);
        }
    });

    // ==================== File Conversion ====================

    /**
     * Convert file to DJSON format using Go bridge
     */
    ipcMain.handle('convert-file', async (_, inputPath, outputPath) => {
        try {
            // Use provided output path or generate temp path
            const finalOutputPath = outputPath || getTempDjsonPath(inputPath);

            return await bridge.convert(inputPath, finalOutputPath, {
                onProgress: (event) => {
                    // Could emit progress events to renderer if needed
                    console.log('Conversion progress:', event);
                }
            });
        } catch (error) {
            throw new Error(`Conversion failed: ${error.message}`);
        }
    });

    // ==================== Database Operations ====================

    /**
     * Load DJSON file into DuckDB
     */
    ipcMain.handle('load-data', async (_, djsonPath) => {
        try {
            return await dbManager.loadData(djsonPath);
        } catch (error) {
            throw new Error(`Failed to load data: ${error.message}`);
        }
    });

    /**
     * Execute SQL query against loaded data
     */
    ipcMain.handle('query-data', async (_, sql, limit = 100) => {
        try {
            return await dbManager.query(sql, limit);
        } catch (error) {
            throw new Error(`Query failed: ${error.message}`);
        }
    });

    /**
     * Get column information from loaded table
     */
    ipcMain.handle('get-columns', async () => {
        try {
            return await dbManager.getColumns();
        } catch (error) {
            throw new Error(`Failed to get columns: ${error.message}`);
        }
    });

    /**
     * Get total row count from loaded table
     */
    ipcMain.handle('get-row-count', async () => {
        try {
            return await dbManager.getRowCount();
        } catch (error) {
            throw new Error(`Failed to get row count: ${error.message}`);
        }
    });

    /**
     * Get unique values for a specific column
     */
    ipcMain.handle('get-unique-values', async (_, columnName) => {
        try {
            return await dbManager.getUniqueValues(columnName);
        } catch (error) {
            throw new Error(`Failed to get unique values: ${error.message}`);
        }
    });

    /**
     * Get filtered row count with WHERE clause
     */
    ipcMain.handle('get-filtered-row-count', async (_, whereClause) => {
        try {
            return await dbManager.getFilteredRowCount(whereClause);
        } catch (error) {
            throw new Error(`Failed to get filtered row count: ${error.message}`);
        }
    });
}

/**
 * Cleanup resources on app quit
 */
async function cleanup() {
    try {
        await dbManager.close();
        console.log('Database closed successfully');
    } catch (error) {
        console.error('Error closing database:', error);
    }
}

module.exports = {
    registerIPCHandlers,
    cleanup
};
