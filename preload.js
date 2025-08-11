const { contextBridge, ipcRenderer } = require('electron');

// Exposer les APIs Electron de manière sécurisée
contextBridge.exposeInMainWorld('electronAPI', {
    // Informations sur l'application
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppName: () => ipcRenderer.invoke('get-app-name'),
    
    // Gestion des sauvegardes
    saveGameData: (gameData) => ipcRenderer.invoke('save-game-data', gameData),
    loadGameData: () => ipcRenderer.invoke('load-game-data'),
    
    // Événements du menu
    onNewGame: (callback) => ipcRenderer.on('new-game', callback),
    onSaveGame: (callback) => ipcRenderer.on('save-game', callback),
    onLoadGame: (callback) => ipcRenderer.on('load-game', callback),
    
    // Nettoyage des listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}); 