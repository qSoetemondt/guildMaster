// Gestionnaire de debug pour GuildMaster
import { RANKS } from './constants/index.js';

export class DebugManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.debugFunctions = new Map();
        this.initDebugFunctions();
    }

    // Initialiser toutes les fonctions de debug
    initDebugFunctions() {
        // Fonction pour ajouter de l'or facilement
        this.debugFunctions.set('addGold', (amount = 100) => {
            if (this.gameState) {
                this.gameState.addGold(amount);
                this.gameState.notificationManager.showGoldAdded(amount);
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour définir l'or directement
        this.debugFunctions.set('setGold', (amount) => {
            if (this.gameState) {
                this.gameState.gold = amount;
                this.gameState.updateUI();
                this.gameState.notificationManager.showGoldSet(amount);
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour afficher les informations de debug
        this.debugFunctions.set('debugInfo', () => {
            if (this.gameState) {
                // Fonction de debug silencieuse
                console.log('🔍 Informations de debug :');
                console.log(`- Rang actuel : ${this.gameState.rank}`);
                console.log(`- Or : ${this.gameState.gold}`);
                console.log(`- Troupes possédées : ${Object.keys(this.gameState.ownedUnits).length}`);
                console.log(`- Bonus débloqués : ${this.gameState.unlockedBonuses.length}`);
                console.log(`- Consommables : ${this.gameState.consumableManager.consumables.length}`);
                console.log(`- Combat en cours : ${this.gameState.currentCombat ? 'Oui' : 'Non'}`);
                if (this.gameState.currentCombat) {
                    console.log(`  - Boss : ${this.gameState.currentCombat.isBossFight ? this.gameState.currentCombat.bossName : 'Non'}`);
                    console.log(`  - Bonus vendu : ${this.gameState.bossManager.isBossMalusDisabled() ? 'Oui' : 'Non'}`);
                }
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour rafraîchir le magasin gratuitement
        this.debugFunctions.set('refreshShop', () => {
            if (this.gameState && this.gameState.shopManager) {
                this.gameState.shopManager.currentShopItems = null;
                this.gameState.shopManager.currentShopPurchasedBonuses = [];
                this.gameState.shopManager.currentShopPurchasedUnits = [];
                this.gameState.shopManager.currentShopPurchasedConsumables = [];
                this.gameState.shopManager.shopRefreshCount = 0;
                this.gameState.shopManager.shopRefreshCost = 10;
                this.gameState.shopManager.updatePreCombatShop(this.gameState);
                this.gameState.notificationManager.showShopRefreshed();
            } else {
                console.error('gameState ou shopManager non disponible');
            }
        });

        // Fonction pour débloquer tous les bonus
        this.debugFunctions.set('unlockAllBonuses', () => {
            if (this.gameState) {
                const bonusDescriptions = this.gameState.getBonusDescriptions();
                Object.keys(bonusDescriptions).forEach(bonusId => {
                    if (!this.gameState.unlockedBonuses.includes(bonusId)) {
                        this.gameState.unlockBonus(bonusId);
                    }
                });
                this.gameState.notificationManager.showAllBonusesUnlocked();
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour obtenir le rang actuel
        this.debugFunctions.set('getRank', () => {
            if (this.gameState) {
                console.log(`🎯 Rang actuel : ${this.gameState.rank}`);
                return this.gameState.rank;
            } else {
                console.error('gameState non disponible');
                return null;
            }
        });

        // Fonction pour lister tous les rangs
        this.debugFunctions.set('listRanks', () => {
            console.log(`📋 Tous les rangs : ${RANKS.join(', ')}`);
            return RANKS;
        });

        // Fonction pour ajouter des troupes de test
        this.debugFunctions.set('addTestTroops', (count = 5) => {
            if (this.gameState) {
                const baseUnits = this.gameState.getBaseUnits();
                for (let i = 0; i < count; i++) {
                    const randomUnit = baseUnits[Math.floor(Math.random() * baseUnits.length)];
                    this.gameState.addTroop({...randomUnit, id: `test_${i}`});
                }
                this.gameState.notificationManager.showNotification(`${count} troupes de test ajoutées`, 'info');
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour tester un combat
        this.debugFunctions.set('testCombat', () => {
            if (this.gameState) {
                this.gameState.startNewCombat();
                this.gameState.notificationManager.showNotification('Combat de test démarré', 'info');
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour gagner un rang
        this.debugFunctions.set('gainRank', () => {
            if (this.gameState) {
                this.gameState.gainRank();
                this.gameState.notificationManager.showNotification('Rang gagné !', 'success');
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour réinitialiser le jeu
        this.debugFunctions.set('resetGame', () => {
            if (this.gameState) {
                this.gameState.newGame();
                this.gameState.notificationManager.showNotification('Jeu réinitialisé', 'info');
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour afficher les statistiques
        this.debugFunctions.set('showStats', () => {
            if (this.gameState) {
                console.log('📊 Statistiques du jeu :');
                console.log(this.gameState.statisticsManager.gameStats);
            } else {
                console.error('gameState non disponible');
            }
        });

        // Fonction pour tester les animations
        this.debugFunctions.set('testAnimation', () => {
            if (this.gameState && this.gameState.animationManager) {
                this.gameState.animationManager.setAnimationSpeed(1);
                this.gameState.notificationManager.showNotification('Vitesse d\'animation réglée à 1x', 'info');
            } else {
                console.error('gameState ou animationManager non disponible');
            }
        });
    }

    // Exposer les fonctions de debug globalement
    exposeDebugFunctions() {
        this.debugFunctions.forEach((func, name) => {
            window[name] = func.bind(this);
        });

        // Exposer aussi la fonction addGold avec un nom raccourci
        window.addGold = this.debugFunctions.get('addGold').bind(this);
        
        console.log('🔧 Fonctions de debug exposées :');
        console.log('- addGold(amount) - Ajouter de l\'or');
        console.log('- setGold(amount) - Définir l\'or');
        console.log('- debugInfo() - Afficher les infos de debug');
        console.log('- refreshShop() - Rafraîchir le magasin');
        console.log('- unlockAllBonuses() - Débloquer tous les bonus');
        console.log('- getRank() - Obtenir le rang actuel');
        console.log('- listRanks() - Lister tous les rangs');
        console.log('- addTestTroops(count) - Ajouter des troupes de test');
        console.log('- testCombat() - Tester un combat');
        console.log('- gainRank() - Gagner un rang');
        console.log('- resetGame() - Réinitialiser le jeu');
        console.log('- showStats() - Afficher les statistiques');
        console.log('- testAnimation() - Tester les animations');
    }

    // Masquer les fonctions de debug
    hideDebugFunctions() {
        this.debugFunctions.forEach((func, name) => {
            if (window[name]) {
                delete window[name];
            }
        });
        console.log('🔧 Fonctions de debug masquées');
    }

    // Afficher l'aide des fonctions de debug
    showDebugHelp() {
        console.log('🔧 AIDE - Fonctions de debug disponibles :');
        console.log('==========================================');
        this.debugFunctions.forEach((func, name) => {
            let description = '';
            switch (name) {
                case 'addGold':
                    description = 'Ajouter de l\'or (défaut: 100)';
                    break;
                case 'setGold':
                    description = 'Définir l\'or directement';
                    break;
                case 'debugInfo':
                    description = 'Afficher les informations de debug';
                    break;
                case 'refreshShop':
                    description = 'Rafraîchir le magasin gratuitement';
                    break;
                case 'unlockAllBonuses':
                    description = 'Débloquer tous les bonus';
                    break;
                case 'getRank':
                    description = 'Obtenir le rang actuel';
                    break;
                case 'listRanks':
                    description = 'Lister tous les rangs';
                    break;
                case 'addTestTroops':
                    description = 'Ajouter des troupes de test (défaut: 5)';
                    break;
                case 'testCombat':
                    description = 'Tester un combat';
                    break;
                case 'gainRank':
                    description = 'Gagner un rang';
                    break;
                case 'resetGame':
                    description = 'Réinitialiser le jeu';
                    break;
                case 'showStats':
                    description = 'Afficher les statistiques';
                    break;
                case 'testAnimation':
                    description = 'Tester les animations';
                    break;
                default:
                    description = 'Fonction de debug';
            }
            console.log(`- ${name}() : ${description}`);
        });
        console.log('==========================================');
    }

    // Vérifier si le mode debug est activé
    isDebugMode() {
        return window.location.search.includes('debug=true') || 
               localStorage.getItem('debugMode') === 'true';
    }

    // Activer le mode debug
    enableDebugMode() {
        localStorage.setItem('debugMode', 'true');
        this.exposeDebugFunctions();
        console.log('🔧 Mode debug activé');
    }

    // Désactiver le mode debug
    disableDebugMode() {
        localStorage.removeItem('debugMode');
        this.hideDebugFunctions();
        console.log('🔧 Mode debug désactivé');
    }

    // Initialiser le mode debug selon les paramètres
    initDebugMode() {
        if (this.isDebugMode()) {
            this.enableDebugMode();
        }
    }
} 