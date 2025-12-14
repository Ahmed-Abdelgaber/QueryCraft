const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectFile: () => ipcRenderer.invoke('select-file'),
    detectFile: (filePath) => ipcRenderer.invoke('detect-file', filePath),
    convertFile: (inputPath, outputPath) => ipcRenderer.invoke('convert-file', inputPath, outputPath),
    loadData: (djsonPath) => ipcRenderer.invoke('load-data', djsonPath),
    queryData: (sql, limit) => ipcRenderer.invoke('query-data', sql, limit),
});
