// Système de sauvegarde et chargement
class SaveSystem {
    constructor() {
        this.saveKey = 'guildMasterSave';
        this.settingsKey = 'guildMasterSettings';
        this.backupKey = 'guildMasterBackup';
    }

    // Sauvegarder la partie
    saveGame(gameState) {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                data: {
                    rank: gameState.rank,
                    rankProgress: gameState.rankProgress,
                    rankTarget: gameState.rankTarget,
                    gold: gameState.gold,
                    availableTroops: gameState.availableTroops,
                    selectedTroops: gameState.selectedTroops,
                    combatHistory: gameState.combatHistory,
                    isFirstTime: gameState.isFirstTime
                }
            };

            // Sauvegarde principale
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            
            // Sauvegarde de sauvegarde (backup)
            localStorage.setItem(this.backupKey, JSON.stringify(saveData));
            
            console.log('Partie sauvegardée avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }

    // Charger la partie
    loadGame(gameState) {
        try {
            // Essayer d'abord la sauvegarde principale
            let saveData = localStorage.getItem(this.saveKey);
            
            if (!saveData) {
                // Si pas de sauvegarde principale, essayer le backup
                saveData = localStorage.getItem(this.backupKey);
                if (saveData) {
                    console.log('Utilisation de la sauvegarde de secours');
                }
            }
            
            if (!saveData) {
                console.log('Aucune sauvegarde trouvée');
                return false;
            }

            const parsedData = JSON.parse(saveData);
            
            // Vérifier la version de la sauvegarde
            if (parsedData.version !== '1.0.0') {
                console.warn('Version de sauvegarde différente, migration possible nécessaire');
            }

            // Appliquer les données au gameState
            const gameData = parsedData.data;
            Object.assign(gameState, gameData);
            
            console.log('Partie chargée avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            
            // Essayer de charger le backup en cas d'erreur
            try {
                const backupData = localStorage.getItem(this.backupKey);
                if (backupData) {
                    const parsedBackup = JSON.parse(backupData);
                    Object.assign(gameState, parsedBackup.data);
                    console.log('Partie chargée depuis le backup');
                    return true;
                }
            } catch (backupError) {
                console.error('Erreur lors du chargement du backup:', backupError);
            }
            
            return false;
        }
    }

    // Vérifier si une sauvegarde existe
    hasSave() {
        return !!(localStorage.getItem(this.saveKey) || localStorage.getItem(this.backupKey));
    }

    // Obtenir les informations de la sauvegarde
    getSaveInfo() {
        try {
            const saveData = localStorage.getItem(this.saveKey) || localStorage.getItem(this.backupKey);
            if (!saveData) return null;

            const parsedData = JSON.parse(saveData);
            const gameData = parsedData.data;
            
            return {
                rank: gameData.rank,
                gold: gameData.gold,
                troopsCount: gameData.availableTroops.length,
                timestamp: parsedData.timestamp,
                date: new Date(parsedData.timestamp).toLocaleString('fr-FR')
            };
        } catch (error) {
            console.error('Erreur lors de la lecture des infos de sauvegarde:', error);
            return null;
        }
    }

    // Supprimer la sauvegarde
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            localStorage.removeItem(this.backupKey);
            console.log('Sauvegarde supprimée');
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            return false;
        }
    }

    // Exporter la sauvegarde
    exportSave() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) {
                throw new Error('Aucune sauvegarde à exporter');
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(saveData);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `guildMaster_save_${Date.now()}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            console.log('Sauvegarde exportée');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            return false;
        }
    }

    // Importer une sauvegarde
    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    
                    // Valider la structure de la sauvegarde
                    if (!saveData.data || !saveData.version) {
                        throw new Error('Format de sauvegarde invalide');
                    }
                    
                    // Sauvegarder la sauvegarde importée
                    localStorage.setItem(this.saveKey, JSON.stringify(saveData));
                    localStorage.setItem(this.backupKey, JSON.stringify(saveData));
                    
                    console.log('Sauvegarde importée avec succès');
                    resolve(true);
                } catch (error) {
                    console.error('Erreur lors de l\'import:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erreur de lecture du fichier'));
            };
            
            reader.readAsText(file);
        });
    }

    // Sauvegarder les paramètres
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify({
                version: '1.0.0',
                timestamp: Date.now(),
                settings: settings
            }));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            return false;
        }
    }

    // Charger les paramètres
    loadSettings() {
        try {
            const settingsData = localStorage.getItem(this.settingsKey);
            if (!settingsData) return {};

            const parsedData = JSON.parse(settingsData);
            return parsedData.settings || {};
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            return {};
        }
    }

    // Nettoyer les anciennes sauvegardes
    cleanupOldSaves() {
        try {
            const keys = Object.keys(localStorage);
            const oldKeys = keys.filter(key => 
                key.startsWith('guildMaster') && 
                key !== this.saveKey && 
                key !== this.backupKey && 
                key !== this.settingsKey
            );
            
            oldKeys.forEach(key => localStorage.removeItem(key));
            console.log(`${oldKeys.length} anciennes sauvegardes nettoyées`);
        } catch (error) {
            console.error('Erreur lors du nettoyage:', error);
        }
    }

    // Obtenir les statistiques de sauvegarde
    getSaveStats() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) return null;

            const parsedData = JSON.parse(saveData);
            const gameData = parsedData.data;
            
            return {
                totalTroops: gameData.availableTroops.length + gameData.selectedTroops.length,
                totalCombats: gameData.combatHistory.length,
                playTime: Date.now() - parsedData.timestamp,
                rankProgress: `${gameData.rankProgress}/${gameData.rankTarget}`
            };
        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
            return null;
        }
    }
}

// Instance globale du système de sauvegarde
const saveSystem = new SaveSystem();

// Fonctions utilitaires pour la sauvegarde automatique
function autoSave() {
    if (gameState) {
        saveSystem.saveGame(gameState);
    }
}

// Sauvegarde automatique toutes les 30 secondes
setInterval(autoSave, 30000);

// Sauvegarde automatique avant de quitter la page
window.addEventListener('beforeunload', () => {
    autoSave();
});

// Fonction pour afficher les informations de sauvegarde
function showSaveInfo() {
    const saveInfo = saveSystem.getSaveInfo();
    if (saveInfo) {
        const message = `
            Rang: ${saveInfo.rank}
            Or: ${saveInfo.gold}💰
            Troupes: ${saveInfo.troopsCount}
            Dernière sauvegarde: ${saveInfo.date}
        `;
        // gameState.showNotification(message, 'info');
    } else {
        gameState.showNotification('Aucune sauvegarde trouvée', 'error');
    }
}

// Fonction pour créer un bouton d'export
function createExportButton() {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn secondary';
    exportBtn.textContent = 'Exporter Sauvegarde';
    exportBtn.addEventListener('click', () => {
        if (saveSystem.exportSave()) {
            // gameState.showNotification('Sauvegarde exportée !', 'success');
        } else {
            gameState.showNotification('Erreur lors de l\'export', 'error');
        }
    });
    return exportBtn;
}

// Fonction pour créer un bouton d'import
function createImportButton() {
    const importBtn = document.createElement('button');
    importBtn.className = 'btn secondary';
    importBtn.textContent = 'Importer Sauvegarde';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            saveSystem.importSave(file)
                .then(() => {
                    // gameState.showNotification('Sauvegarde importée ! Rechargez la page.', 'success');
                })
                .catch((error) => {
                    gameState.showNotification('Erreur lors de l\'import: ' + error.message, 'error');
                });
        }
    });
    
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    document.body.appendChild(fileInput);
    return importBtn;
} 