const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // File operations
    selectFile: () => ipcRenderer.invoke('select-file'),
    getFilePath: (file) => ipcRenderer.invoke('get-file-path', file),

    // Detection & Conversion
    detectFile: (filePath) => ipcRenderer.invoke('detect-file', filePath),
    convertFile: (inputPath, outputPath) => ipcRenderer.invoke('convert-file', inputPath, outputPath),

    // Database operations
    loadData: (djsonPath) => ipcRenderer.invoke('load-data', djsonPath),
    queryData: (query, limit) => ipcRenderer.invoke('query-data', query, limit),
    getColumns: () => ipcRenderer.invoke('get-columns'),
    getRowCount: () => ipcRenderer.invoke('get-row-count'),
    getUniqueValues: (columnName) => ipcRenderer.invoke('get-unique-values', columnName),
    getFilteredRowCount: (whereClause) => ipcRenderer.invoke('get-filtered-row-count', whereClause),
});
