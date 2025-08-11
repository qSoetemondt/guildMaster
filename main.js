const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    // Détecter si on veut lancer en mode fenêtré
    const isWindowedMode = process.argv.includes('--windowed');
    
    // Créer la fenêtre du navigateur
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/guildMaster.png'),
        title: 'Guild Master',
        show: false, // Ne pas afficher la fenêtre immédiatement
        fullscreen: !isWindowedMode, // Lancer en plein écran sauf si mode fenêtré
        autoHideMenuBar: true // Cacher la barre de menu automatiquement
    });
    mainWindow.setThumbarButtons([]);
    // Charger le fichier HTML principal
    mainWindow.loadFile('index.html');

    // Afficher la fenêtre quand elle est prête
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Gérer la fermeture de la fenêtre
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Gérer les raccourcis clavier pour le plein écran
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // Sortir du plein écran avec Échap
        if (input.key === 'Escape') {
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
            }
        }
        
        // Entrer/sortir du plein écran avec F11
        if (input.key === 'F11') {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
    });

    // Ouvrir les outils de développement en mode développement
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

// Créer le menu de l'application (optionnel)
function createMenu() {
    // Pour désactiver complètement le menu, commentez ou supprimez cette fonction
    // ou utilisez Menu.setApplicationMenu(null);
    
    // Option 1: Menu minimal (juste les raccourcis clavier)
    const template = [
        {
            label: 'Fichier',
            submenu: [
                {
                    label: 'Nouvelle Partie',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('new-game');
                    }
                },
                {
                    label: 'Sauvegarder',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('save-game');
                    }
                },
                {
                    label: 'Charger Partie',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        mainWindow.webContents.send('load-game');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quitter',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Événements de l'application
app.whenReady().then(() => {
    createWindow();
    
    // Option 1: Pas de menu du tout (recommandé pour un jeu)
    Menu.setApplicationMenu(null);
    
    // Option 2: Menu minimal (décommentez si vous voulez garder quelques raccourcis)
    // createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Gestion des événements IPC
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-app-name', () => {
    return app.getName();
});

// Gestion des sauvegardes
ipcMain.handle('save-game-data', async (event, gameData) => {
    try {
        const savePath = path.join(app.getPath('userData'), 'savegame.json');
        await fs.promises.writeFile(savePath, JSON.stringify(gameData, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-game-data', async () => {
    try {
        const savePath = path.join(app.getPath('userData'), 'savegame.json');
        const data = await fs.promises.readFile(savePath, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return { success: false, error: error.message };
    }
}); 