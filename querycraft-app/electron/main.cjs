const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const duckdb = require('duckdb');

// Use the querycraft-bridge we already built!
const { GoBridge } = require('../../querycraft-bridge/dist/index');

let mainWindow = null;
let db = null;
const bridge = new GoBridge();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
        },
    });

    // Load from Vite dev server (auto-detect port)
    const port = process.env.VITE_PORT || 5173;
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers - Using querycraft-bridge!

// Select file
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

// Detect file - Using bridge!
ipcMain.handle('detect-file', async (_, filePath) => {
    return await bridge.detect(filePath);
});

// Convert file - Using bridge!
ipcMain.handle('convert-file', async (_, inputPath, outputPath) => {
    return await bridge.convert(inputPath, outputPath);
});

// IPC: Load data into DuckDB
ipcMain.handle('load-data', async (_, djsonPath) => {
    return new Promise((resolve, reject) => {
        db = new duckdb.Database(':memory:');
        db.all(`CREATE TABLE data AS SELECT * FROM read_json_auto('${djsonPath}')`, (err) => {
            if (err) return reject(err);
            db.all('DESCRIBE data', (err, cols) => {
                err ? reject(err) : resolve({ columns: cols });
            });
        });
    });
});

// IPC: Query data
ipcMain.handle('query-data', async (_, sql, limit = 100) => {
    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error('No database loaded'));
        const query = sql.includes('LIMIT') ? sql : `${sql} LIMIT ${limit}`;
        db.all(query, (err, rows) => {
            err ? reject(err) : resolve(rows);
        });
    });
});
