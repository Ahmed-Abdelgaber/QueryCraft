const { app, BrowserWindow } = require('electron');
const path = require('path');
const { registerIPCHandlers, cleanup } = require('./ipc-handlers.cjs');

let mainWindow = null;

/**
 * Create the main application window
 */
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

    // Open DevTools in development
    if (process.env.NODE_ENV !== 'production') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ==================== App Lifecycle ====================

app.whenReady().then(() => {
    // Register all IPC handlers
    registerIPCHandlers();

    // Create the window
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Cleanup on quit
app.on('will-quit', async (event) => {
    event.preventDefault();
    await cleanup();
    app.exit();
});
