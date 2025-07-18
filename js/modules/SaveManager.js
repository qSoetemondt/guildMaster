// Gestionnaire de sauvegarde et chargement pour GuildMaster
import { NotificationManager } from './NotificationManager.js';
import { RANKS } from './constants/index.js';

export class SaveManager {
    constructor() {
        this.saveKey = 'guildMasterSave';
        this.notificationManager = new NotificationManager();
    }

    // Sauvegarder l'état du jeu
    async save(gameState) {
        const saveData = {
            rank: gameState.rank,
            rankProgress: gameState.rankProgress,
            rankTarget: gameState.rankTarget,
            gold: gameState.gold,
            guildName: gameState.guildName,
            availableTroops: gameState.availableTroops,
            selectedTroops: gameState.selectedTroops,
            combatTroops: gameState.combatTroops,
            usedTroopsThisCombat: gameState.usedTroopsThisCombat,
            combatHistory: gameState.combatHistory,
            isFirstTime: gameState.isFirstTime,
            unlockedBonuses: gameState.unlockedBonuses,
            dynamicBonusStates: gameState.dynamicBonusStates || {},
            currentCombat: gameState.currentCombat,
            currentShopItems: gameState.shopManager.currentShopItems,
            currentShopPurchasedUnits: gameState.shopManager.currentShopPurchasedUnits,
            currentShopPurchasedConsumables: gameState.shopManager.currentShopPurchasedConsumables,
            currentShopPurchasedBonuses: gameState.shopManager.currentShopPurchasedBonuses,
            shopRefreshCount: gameState.shopManager.shopRefreshCount,
            shopRefreshCost: gameState.shopManager.shopRefreshCost,
            bossState: gameState.bossManager.saveState(),
            gameStats: gameState.statisticsManager.getStatsForSave(),
            consumables: gameState.consumableManager.consumables,
    
            synergyLevels: gameState.synergyLevels,
            ownedUnits: gameState.getOwnedUnits() // Sauvegarder les unités possédées
        };
        
        // Utiliser Electron API si disponible, sinon localStorage
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.saveGameData(saveData);
                if (result.success) {
                    gameState.notificationManager.showGameSaved();
                } else {
                    console.error('Erreur de sauvegarde Electron:', result.error);
                    // Fallback vers localStorage
                    localStorage.setItem(this.saveKey, JSON.stringify(saveData));
                    gameState.notificationManager.showGameSaved();
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde Electron:', error);
                // Fallback vers localStorage
                localStorage.setItem(this.saveKey, JSON.stringify(saveData));
                gameState.notificationManager.showGameSaved();
            }
        } else {
            // Fallback pour le navigateur
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            gameState.notificationManager.showGameSaved();
        }
    }

    // Charger l'état du jeu
    async load(gameState) {
        let saveData = null;
        
        // Utiliser Electron API si disponible, sinon localStorage
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.loadGameData();
                if (result.success) {
                    saveData = JSON.stringify(result.data);
                } else {
                    console.error('Erreur de chargement Electron:', result.error);
                    // Fallback vers localStorage
                    saveData = localStorage.getItem(this.saveKey);
                }
            } catch (error) {
                console.error('Erreur lors du chargement Electron:', error);
                // Fallback vers localStorage
                saveData = localStorage.getItem(this.saveKey);
            }
        } else {
            // Fallback pour le navigateur
            saveData = localStorage.getItem(this.saveKey);
        }
        
        if (saveData) {
            const data = JSON.parse(saveData);
            
            // Extraire gameStats pour éviter le conflit avec le getter
            const { gameStats, ...otherData } = data;
            
            // Assigner toutes les autres propriétés
            Object.assign(gameState, otherData);
            
            // Charger les statistiques depuis la sauvegarde
            if (gameStats) {
                gameState.statisticsManager.loadStatsFromSave(gameStats);
            } else {
                gameState.statisticsManager.resetStats();
            }
            
            // Initialiser les bonus si pas présents
            if (!gameState.unlockedBonuses) {
                gameState.unlockedBonuses = [];
            }
            
            // Restaurer les états des bonus dynamiques
            if (data.dynamicBonusStates) {
                gameState.dynamicBonusStates = data.dynamicBonusStates;
            } else {
                gameState.dynamicBonusStates = {};
            }
            
            // Initialiser le combat si pas présent
            if (!gameState.currentCombat) {
                gameState.currentCombat = {
                    targetDamage: 0,
                    totalDamage: 0,
                    round: 0,
                    maxRounds: 5,
                    isActive: false,
                    isBossFight: false,
                    bossName: '',
                    bossMechanic: ''
                };
            }
            
            // Restaurer le magasin et ses états
            if (data.currentShopItems) {
                gameState.shopManager.currentShopItems = data.currentShopItems;
            } else {
                gameState.shopManager.currentShopItems = null;
            }
            
            // Restaurer les éléments achetés dans la session de magasin
            if (data.currentShopPurchasedUnits) {
                gameState.shopManager.currentShopPurchasedUnits = data.currentShopPurchasedUnits;
            } else {
                gameState.shopManager.currentShopPurchasedUnits = [];
            }
            
            if (data.currentShopPurchasedConsumables) {
                gameState.shopManager.currentShopPurchasedConsumables = data.currentShopPurchasedConsumables;
            } else {
                gameState.shopManager.currentShopPurchasedConsumables = [];
            }
            
            if (data.currentShopPurchasedBonuses) {
                gameState.shopManager.currentShopPurchasedBonuses = data.currentShopPurchasedBonuses;
            } else {
                gameState.shopManager.currentShopPurchasedBonuses = [];
            }
            
            // Restaurer les variables de rafraîchissement du magasin
            if (typeof data.shopRefreshCount !== 'undefined') {
                gameState.shopManager.shopRefreshCount = data.shopRefreshCount;
            } else {
                gameState.shopManager.shopRefreshCount = 0;
            }
            
            if (typeof data.shopRefreshCost !== 'undefined') {
                gameState.shopManager.shopRefreshCost = data.shopRefreshCost;
            } else {
                gameState.shopManager.shopRefreshCost = 10;
            }
            
            // Restaurer l'état du boss
            if (data.bossState) {
                gameState.bossManager.loadState(data.bossState);
            }
            
            // Charger les consommables
            if (data.consumables) {
                gameState.consumableManager.consumables = data.consumables;
            } else {
                // Initialiser les consommables si pas présents
                gameState.consumableManager.consumables = [];
            }
            
            // Initialiser les unités de base transformées si pas présentes
            
            
            // Initialiser les niveaux de synergies si pas présents
            if (!gameState.synergyLevels) {
                gameState.synergyLevels = {
                    'Formation Corps à Corps': 1,
                    'Formation Distance': 1,
                    'Formation Magique': 1,
                    'Horde Corps à Corps': 1,
                    'Volée de Flèches': 1,
                    'Tempête Magique': 1,
                    'Tactique Mixte': 1,
                    'Force Physique': 1
                };
            }
            
            // Charger les unités possédées
            if (data.ownedUnits) {
                gameState.loadOwnedUnits(data.ownedUnits);
            }
            
            // Nettoyer les bonus invalides au chargement
            gameState.cleanInvalidBonuses();
            
            gameState.updateUI();
            gameState.updateConsumablesDisplay();
            
            // Ne pas régénérer les troupes de combat si elles existent déjà
            // Les troupes de combat sont déjà restaurées via Object.assign(gameState, data)
            
            // Mettre à jour l'affichage des troupes
            gameState.updateTroopsUI();
            
            // Restaurer l'affichage du magasin si on n'est pas en combat
            if (!gameState.currentCombat.isActive) {
                gameState.shopManager.updatePreCombatShop(gameState);
            }
            
            // Mettre à jour l'interface une dernière fois pour s'assurer que tout est cohérent
            gameState.updateUI();
            
            return true;
        }
        return false;
    }

    // Créer une nouvelle partie
    newGame(gameState) {
        gameState.rank = RANKS[0];
        gameState.rankProgress = 0;
        gameState.rankTarget = 100;
        gameState.gold = 100;
        gameState.guildName = 'Guilde d\'Aventuriers';
        gameState.availableTroops = [];
        gameState.selectedTroops = [];
        gameState.combatTroops = [];
        gameState.usedTroopsThisCombat = [];
        gameState.combatHistory = [];
        gameState.isFirstTime = true;
        gameState.unlockedBonuses = [];
        gameState.consumableManager.consumables = [];
        gameState.transformedBaseUnits = {}; // Initialiser les unités transformées

        gameState.synergyLevels = {
            'Formation Corps à Corps': 1,
            'Formation Distance': 1,
            'Formation Magique': 1,
            'Horde Corps à Corps': 1,
            'Volée de Flèches': 1,
            'Tempête Magique': 1,
            'Tactique Mixte': 1,
            'Force Physique': 1
        };
        
        // Réinitialiser les variables de rafraîchissement du magasin
        gameState.shopManager.shopRefreshCount = 0;
        gameState.shopManager.shopRefreshCost = 10;
        // Initialiser les listes d'achats de la session de magasin
        gameState.currentShopPurchasedUnits = [];
        gameState.currentShopPurchasedConsumables = [];
        
        // Réinitialiser les statistiques
        gameState.statisticsManager.resetStats();
        
        // Réinitialiser le combat
        gameState.currentCombat = {
            targetDamage: 0,
            totalDamage: 0,
            round: 0,
            maxRounds: 5,
            isActive: false,
            isBossFight: false,
            bossName: '',
            bossMechanic: ''
        };
        
        gameState.updateUI();
        gameState.updateConsumablesDisplay();
        
        // Tirer les premières troupes pour le combat
        gameState.drawCombatTroops();
    }

    // Vérifier si une sauvegarde existe
    async hasSave() {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.loadGameData();
                return result.success;
            } catch (error) {
                console.error('Erreur lors de la vérification de sauvegarde Electron:', error);
                return localStorage.getItem(this.saveKey) !== null;
            }
        } else {
            return localStorage.getItem(this.saveKey) !== null;
        }
    }

    // Supprimer la sauvegarde
    deleteSave() {
        localStorage.removeItem(this.saveKey);
    }
} 