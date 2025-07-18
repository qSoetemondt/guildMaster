// Moteur de simulation pour l'analyse d'équilibrage
import { GameState } from './GameState.js';
import { RANKS } from './constants/index.js';

export class SimulationEngine {
    constructor() {
        this.simulationResults = [];
        this.currentSimulation = null;
        this.simulationConfig = {
            numberOfGames: 1000,
            maxRounds: 50,
            enableLogging: false,
            saveDetailedLogs: false
        };
        
        // Statistiques globales
        this.globalStats = {
            totalGames: 0,
            averageRankReached: 0,
            averageGoldEarned: 0,
            averageCombatWon: 0,
            averageCombatLost: 0,
            winRate: 0,
            averageGameDuration: 0,
            rankDistribution: {},
            unitUsageStats: {},
            synergyEffectiveness: {},
            bonusUsageStats: {},
            bossWinRates: {},
            goldEconomy: {
                averageGoldPerGame: 0,
                averageGoldSpent: 0,
                averageGoldEarned: 0,
                goldEfficiency: 0
            }
        };
    }

    // Configuration de la simulation
    configureSimulation(config) {
        this.simulationConfig = { ...this.simulationConfig, ...config };
    }

    // Lancer une simulation complète
    async runSimulation(config = {}) {
        this.configureSimulation(config);
        
        const startTime = Date.now();
        this.simulationResults = [];
        
        for (let i = 0; i < this.simulationConfig.numberOfGames; i++) {
            // Mise à jour de la progression plus fréquente pour les petites simulations
            const updateInterval = this.simulationConfig.numberOfGames < 100 ? 1 : 10;
            if (i % updateInterval === 0) {
                // Appeler le callback de progression si disponible
                if (this.progressCallback) {
                    this.progressCallback(i, this.simulationConfig.numberOfGames);
                }
            }
            
            const gameResult = await this.simulateSingleGame(i);
            this.simulationResults.push(gameResult);
            
            // Pause pour éviter de bloquer le navigateur
            if (i % 50 === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        const endTime = Date.now();
        const simulationDuration = endTime - startTime;
        
        // Analyser les résultats
        this.analyzeResults();
        
        return {
            results: this.simulationResults,
            globalStats: this.globalStats,
            duration: simulationDuration
        };
    }

    // Simuler une partie complète
    async simulateSingleGame(gameIndex) {
        const gameState = new GameState();
        const gameLog = [];
        const startTime = Date.now();
        
        // Configuration pour la simulation
        gameState.simulationMode = true;
        gameState.enableAnimations = false;
        gameState.selectedTroops = []; // Initialiser selectedTroops
        gameState.combatTroops = []; // Initialiser combatTroops
        
        // Initialiser les statistiques de jeu
        gameState.gameStats = {
            combatsWon: 0,
            combatsLost: 0,
            goldSpent: 0,
            goldEarned: 0,
            unitsPurchased: 0,
            bonusesPurchased: 0,
            consumablesPurchased: 0,
            consumablesUsed: 0,
            unitsUsed: {},
            maxDamageInTurn: 0,
            totalDamageDealt: 0
        };
        
        // Initialiser le suivi des achats détaillés
        gameState.purchasedUnits = {};
        gameState.purchasedConsumables = {};
        
        // Désactiver les notifications pendant la simulation
        const originalShowNotification = gameState.showNotification;
        gameState.showNotification = () => {}; // Fonction vide pour désactiver les notifications
        
        try {
            let roundCount = 0;
            const maxRounds = this.simulationConfig.maxRounds;
            
            while (gameState.rank !== RANKS[RANKS.length - 1] && roundCount < maxRounds) {
                roundCount++;
                
                // Phase de recrutement automatique
                this.simulateRecruitmentPhase(gameState, gameLog);
                
                // Phase de combat automatique
                const combatResult = this.simulateCombatPhase(gameState, gameLog);
                
                if (!combatResult.success) {
                    break; // Échec de la partie
                }
                
                // Phase de magasin automatique
                this.simulateShopPhase(gameState, gameLog);
                
                // Vérification de sécurité pour éviter les boucles infinies
                if (roundCount > maxRounds) {
                    console.warn(`Simulation ${gameIndex} arrêtée après ${maxRounds} tours`);
                    break;
                }
            }
            
            const endTime = Date.now();
            const gameDuration = endTime - startTime;
            
            const result = {
                gameIndex,
                success: gameState.rank === RANKS[RANKS.length - 1],
                finalRank: gameState.rank,
                finalRankProgress: gameState.rankProgress,
                gold: gameState.gold,
                combatsPlayed: gameState.combatHistory.length,
                combatsWon: gameState.gameStats.combatsWon,
                combatsLost: gameState.gameStats.combatsLost,
                goldSpent: gameState.gameStats.goldSpent,
                goldEarned: gameState.gameStats.goldEarned,
                unitsPurchased: gameState.gameStats.unitsPurchased,
                bonusesPurchased: gameState.gameStats.bonusesPurchased,
                consumablesPurchased: gameState.gameStats.consumablesPurchased,
                consumablesUsed: gameState.gameStats.consumablesUsed,
                unitsUsed: { ...gameState.gameStats.unitsUsed },
                maxDamageInTurn: gameState.gameStats.maxDamageInTurn,
                totalDamageDealt: gameState.gameStats.totalDamageDealt,
                gameDuration,
                finalTroops: [...gameState.availableTroops],
                finalSynergies: { ...gameState.synergyLevels },
                finalBonuses: [...gameState.unlockedBonuses],
                bossFights: gameState.combatHistory.filter(combat => combat.isBossFight),
                log: this.simulationConfig.saveDetailedLogs ? gameLog : [],
                purchasedUnits: { ...gameState.purchasedUnits },
                purchasedConsumables: { ...gameState.purchasedConsumables }
            };
            

            
            return result;
            
        } catch (error) {
            console.error(`Erreur dans la simulation ${gameIndex}:`, error);
            return {
                gameIndex,
                success: false,
                error: error.message,
                finalRank: gameState.rank || 'F-',
                combatsPlayed: gameState.combatHistory ? gameState.combatHistory.length : 0,
                roundCount: roundCount || 0
            };
        } finally {
            // Restaurer les notifications après la simulation
            if (originalShowNotification) {
                gameState.showNotification = originalShowNotification;
            }
        }
    }

    // Simuler la phase de recrutement
    simulateRecruitmentPhase(gameState, gameLog) {
        // Stratégie de recrutement basée sur les synergies actuelles
        const currentTroops = gameState.availableTroops;
        const synergies = gameState.calculateSynergies(currentTroops);
        
        // Analyser les besoins de l'équipe
        const needs = this.analyzeTeamNeeds(currentTroops, synergies);
        
        // Recruter des unités selon les besoins
        for (let i = 0; i < 3; i++) {
            const unit = this.selectOptimalUnit(needs, gameState.gold);
            if (unit && gameState.gold >= this.getUnitCost(unit)) {
                gameState.addTroop(unit);
                gameState.shopManager.spendGold(gameState, this.getUnitCost(unit));
                gameState.gameStats.unitsPurchased++;
                gameLog.push(`Recrutement: ${unit.name} (${unit.damage}dmg x${unit.multiplier})`);
            }
        }
        
        // S'assurer qu'il y a au moins quelques troupes de base si aucune n'a été recrutée
        if (gameState.availableTroops.length === 0) {
            const baseUnits = [
                { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, icon: '⚔️', rarity: 'common' },
                { name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3, icon: '🏹', rarity: 'common' },
                { name: 'Paysan', type: ['Corps à corps', 'Physique'], damage: 2, multiplier: 1, icon: '👨‍🌾', rarity: 'common' }
            ];
            
            const randomUnit = baseUnits[Math.floor(Math.random() * baseUnits.length)];
            gameState.addTroop(randomUnit);
            gameLog.push(`Recrutement de base: ${randomUnit.name}`);
        }
        

    }

    // Analyser les besoins de l'équipe
    analyzeTeamNeeds(troops, synergies) {
        const needs = {
            melee: 0,
            ranged: 0,
            magical: 0,
            physical: 0,
            healer: 0,
            highDamage: 0,
            highMultiplier: 0
        };
        
        // Compter les types actuels
        troops.forEach(troop => {
            // Vérification de sécurité
            if (!troop || !troop.type || typeof troop.damage === 'undefined' || typeof troop.multiplier === 'undefined') {
                console.error('Troop invalide dans analyzeTeamNeeds:', troop);
                return;
            }
            
            if (troop.type.includes('Corps à corps')) needs.melee++;
            if (troop.type.includes('Distance')) needs.ranged++;
            if (troop.type.includes('Magique')) needs.magical++;
            if (troop.type.includes('Physique')) needs.physical++;
            if (troop.type.includes('Soigneur')) needs.healer++;
            if (troop.damage >= 5) needs.highDamage++;
            if (troop.multiplier >= 3) needs.highMultiplier++;
        });
        
        // Déterminer les priorités
        const priorities = [];
        
        if (needs.melee < 2) priorities.push('melee');
        if (needs.ranged < 2) priorities.push('ranged');
        if (needs.magical < 1) priorities.push('magical');
        if (needs.highDamage < 2) priorities.push('highDamage');
        if (needs.highMultiplier < 2) priorities.push('highMultiplier');
        
        return { needs, priorities };
    }

    // Sélectionner l'unité optimale selon les besoins
    selectOptimalUnit(needs, availableGold) {
        // Utiliser les vraies unités du jeu
        const allUnits = [
            { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, cost: 10, rarity: 'common' },
            { name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3, cost: 12, rarity: 'common' },
            { name: 'Magicien Bleu', type: ['Distance', 'Magique'], damage: 3, multiplier: 4, cost: 15, rarity: 'uncommon' },
            { name: 'Lancier', type: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, cost: 12, rarity: 'common' },
            { name: 'Paysan', type: ['Corps à corps', 'Physique'], damage: 2, multiplier: 1, cost: 5, rarity: 'common' },
            { name: 'Soigneur', type: ['Soigneur', 'Magique'], damage: 1, multiplier: 1, cost: 8, rarity: 'common' },
            { name: 'Magicien Rouge', type: ['Distance', 'Magique'], damage: 6, multiplier: 2, cost: 20, rarity: 'uncommon' },
            { name: 'Barbare', type: ['Corps à corps', 'Physique'], damage: 7, multiplier: 1, cost: 20, rarity: 'uncommon' },
            { name: 'Viking', type: ['Corps à corps', 'Physique'], damage: 6, multiplier: 2, cost: 18, rarity: 'uncommon' },
            { name: 'Paladin', type: ['Corps à corps', 'Physique'], damage: 8, multiplier: 2, cost: 25, rarity: 'rare' },
            { name: 'Assassin', type: ['Corps à corps', 'Physique'], damage: 3, multiplier: 6, cost: 30, rarity: 'rare' },
            { name: 'Mage', type: ['Distance', 'Magique'], damage: 5, multiplier: 4, cost: 35, rarity: 'rare' },
            { name: 'Frondeur', type: ['Distance', 'Physique'], damage: 2, multiplier: 5, cost: 30, rarity: 'rare' },
            { name: 'Chevalier', type: ['Corps à corps', 'Physique'], damage: 9, multiplier: 1, cost: 40, rarity: 'epic' },
            { name: 'Arbalétrier', type: ['Distance', 'Physique'], damage: 8, multiplier: 2, cost: 45, rarity: 'epic' },
            { name: 'Sorcier', type: ['Distance', 'Magique'], damage: 4, multiplier: 5, cost: 50, rarity: 'epic' },
            { name: 'Berserker', type: ['Corps à corps', 'Physique'], damage: 10, multiplier: 1, cost: 55, rarity: 'epic' },
            { name: 'Archer d\'Élite', type: ['Distance', 'Physique'], damage: 6, multiplier: 4, cost: 80, rarity: 'legendary' },
            { name: 'Mage Suprême', type: ['Distance', 'Magique', 'Corps à corps'], damage: 7, multiplier: 5, cost: 90, rarity: 'legendary' },
            { name: 'Champion', type: ['Corps à corps', 'Physique', 'Magique'], damage: 12, multiplier: 2, cost: 100, rarity: 'legendary' }
        ];
        
        // Filtrer par coût
        const affordableUnits = allUnits.filter(unit => unit.cost <= availableGold);
        if (affordableUnits.length === 0) return null;
        
        // Calculer le score de chaque unité
        const scoredUnits = affordableUnits.map(unit => {
            let score = 0;
            
            // Score basé sur les besoins
            if (needs.priorities.includes('melee') && unit.type.includes('Corps à corps')) score += 10;
            if (needs.priorities.includes('ranged') && unit.type.includes('Distance')) score += 10;
            if (needs.priorities.includes('magical') && unit.type.includes('Magique')) score += 8;
            if (needs.priorities.includes('highDamage') && unit.damage >= 5) score += 6;
            if (needs.priorities.includes('highMultiplier') && unit.multiplier >= 3) score += 6;
            
            // Score basé sur la puissance
            score += unit.damage * unit.multiplier * 0.5;
            
            // Bonus pour les unités rares
            if (unit.rarity === 'rare') score += 5;
            if (unit.rarity === 'uncommon') score += 2;
            
            return { ...unit, score };
        });
        
        // Retourner l'unité avec le meilleur score
        scoredUnits.sort((a, b) => b.score - a.score);
        return scoredUnits[0];
    }

    // Obtenir le coût d'une unité
    getUnitCost(unit) {
        const baseCosts = {
            'Épéiste': 10,
            'Archer': 12,
            'Magicien Bleu': 15,
            'Lancier': 12,
            'Paysan': 5,
            'Soigneur': 8,
            'Barbare': 20,
            'Sorcier': 25,
            'Fronde': 30
        };
        return baseCosts[unit.name] || 10;
    }

    // Simuler la phase de combat
    simulateCombatPhase(gameState, gameLog) {
        try {
            // Vérifier qu'il y a des troupes disponibles
            if (gameState.availableTroops.length === 0) {
                gameLog.push('Aucune troupe disponible pour le combat');
                return { success: false, error: 'Aucune troupe disponible' };
            }
            
            // Sélectionner automatiquement les meilleures troupes
            this.selectOptimalCombatTroops(gameState);
            
            // Vérifier que des troupes ont été sélectionnées
            if (!gameState.selectedTroops || gameState.selectedTroops.length === 0) {
                gameLog.push('Aucune troupe sélectionnée pour le combat');
                return { success: false, error: 'Aucune troupe sélectionnée' };
            }
            
            // Lancer le combat
            gameState.startNewCombat();
            
            // Simuler les tours de combat
            while (gameState.currentCombat.isActive && gameState.currentCombat.round < gameState.currentCombat.maxRounds) {
                const turnResult = this.simulateCombatTurn(gameState);
                
                if (turnResult.victory || turnResult.defeat) {
                    break;
                }
            }
            
            // Terminer le combat
            const victory = gameState.currentCombat.totalDamage >= gameState.currentCombat.targetDamage;
            gameState.endCombat(victory);
            
            gameLog.push(`Combat ${gameState.combatHistory.length}: ${victory ? 'Victoire' : 'Défaite'} - Dégâts: ${gameState.currentCombat.totalDamage}/${gameState.currentCombat.targetDamage}`);
            

            
            return { success: true, victory };
            
        } catch (error) {
            gameLog.push(`Erreur combat: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // Sélectionner les meilleures troupes pour le combat
    selectOptimalCombatTroops(gameState) {
        const availableTroops = [...gameState.availableTroops];
        
        if (availableTroops.length === 0) {
            console.warn('Aucune troupe disponible pour le combat');
            return;
        }
        
        // Calculer le score de chaque troupe
        const scoredTroops = availableTroops.map(troop => {
            // Vérification de sécurité
            if (!troop || typeof troop.damage === 'undefined' || typeof troop.multiplier === 'undefined') {
                console.error('Troop invalide dans selectOptimalCombatTroops:', troop);
                return { ...troop, score: 0 };
            }
            
            let score = troop.damage * troop.multiplier;
            
            // Bonus pour les synergies
            const synergies = gameState.calculateSynergies([troop]);
            Object.values(synergies).forEach(synergy => {
                if (synergy.active) score += synergy.bonus * 0.5;
            });
            
            return { ...troop, score };
        });
        
        // Sélectionner les meilleures troupes (max 5)
        scoredTroops.sort((a, b) => b.score - a.score);
        const selectedTroops = scoredTroops.slice(0, Math.min(5, availableTroops.length));
        
        // Ajouter les troupes sélectionnées au combat
        gameState.selectedTroops = selectedTroops;
        
        // En mode simulation, on simule directement la sélection
        if (gameState.simulationMode) {
            // Copier les troupes sélectionnées dans combatTroops
            gameState.combatTroops = [...selectedTroops];
            // Définir selectedTroops pour les synergies
            gameState.selectedTroops = [...selectedTroops];
            } else {
            // Marquer les troupes comme sélectionnées pour le combat (mode normal)
            selectedTroops.forEach((troop, index) => {
                gameState.selectTroopForCombat(index);
            });
        }
    }

    // Simuler un tour de combat
    simulateCombatTurn(gameState) {
        // Utiliser les troupes sélectionnées pour le combat
        const combatTroops = gameState.combatTroops || gameState.selectedTroops;
        
        if (!combatTroops || combatTroops.length === 0) {
            console.warn('Aucune troupe disponible pour le tour de combat');
            return { defeat: true };
        }
        
        // Utiliser des consommables si disponibles et utiles
        this.useConsumablesIfNeeded(gameState);
        
        // Calculer les dégâts du tour
        const turnDamage = gameState.calculateTurnDamage(combatTroops);
        gameState.currentCombat.totalDamage += turnDamage;
        gameState.currentCombat.round++;
        
        // Enregistrer l'utilisation des unités
        combatTroops.forEach(troop => {
            if (!gameState.gameStats.unitsUsed[troop.name]) {
                gameState.gameStats.unitsUsed[troop.name] = 0;
            }
            gameState.gameStats.unitsUsed[troop.name]++;
        });
        

        
        // Vérifier la victoire
        if (gameState.currentCombat.totalDamage >= gameState.currentCombat.targetDamage) {
            return { victory: true };
        }
        
        // Retirer aléatoirement des troupes (simulation de la perte d'unités)
        if (combatTroops.length > 1) {
            const troopsToRemove = Math.floor(Math.random() * Math.min(2, combatTroops.length));
            for (let i = 0; i < troopsToRemove; i++) {
                const randomIndex = Math.floor(Math.random() * combatTroops.length);
                combatTroops.splice(randomIndex, 1);
            }
        }
        
        return { continue: true };
    }

    // Simuler la phase de magasin
    simulateShopPhase(gameState, gameLog) {
        if (gameState.gold < 10) {
            gameLog.push('Pas assez d\'or pour le magasin');
            return;
        }
        
        // Générer des items de magasin (utilise la même logique que le shop normal)
        const shopItems = gameState.shopManager.generateShopItems(gameState);
        
        let purchasesMade = false;
        
        // Acheter des bonus utiles (limiter à 2-3 bonus par partie)
        const bonusItems = shopItems.filter(item => item.type === 'bonus');
        if (bonusItems.length > 0) {
            // Limiter le nombre de bonus achetés par partie
            const maxBonusesPerGame = 3;
            const currentBonusCount = gameState.gameStats.bonusesPurchased || 0;
            
            if (currentBonusCount >= maxBonusesPerGame) {
                return;
            }
            
            bonusItems.forEach(bonus => {
                // Vérifier la disponibilité comme dans le shop normal
                const availability = gameState.shopManager.checkItemAvailability(bonus, gameState);
                const worthBuying = this.isBonusWorthBuying(bonus, gameState);
                
                if (availability.isAvailable && worthBuying) {
                    if (gameState.unlockBonus(bonus.bonusId)) {
                        gameState.gameStats.bonusesPurchased++;
                        gameLog.push(`Achat bonus: ${bonus.name} (${bonus.bonusId}) - ${bonus.price} or`);
                        purchasesMade = true;
                    }
                }
            });
        }
        
        // Acheter des consommables
        const consumableItems = shopItems.filter(item => item.type === 'consumable');
        if (consumableItems.length > 0) {
            consumableItems.forEach(consumable => {
                // Vérifier la disponibilité comme dans le shop normal
                const availability = gameState.shopManager.checkItemAvailability(consumable, gameState);
                const worthBuying = this.isConsumableWorthBuying(consumable, gameState);
                
                if (availability.isAvailable && worthBuying) {
                    if (gameState.addConsumable(consumable.consumableType)) {
                        gameState.gameStats.consumablesPurchased = (gameState.gameStats.consumablesPurchased || 0) + 1;
                        
                        // Suivre les consommables achetés
                        if (!gameState.purchasedConsumables[consumable.consumableType]) {
                            gameState.purchasedConsumables[consumable.consumableType] = 0;
                        }
                        gameState.purchasedConsumables[consumable.consumableType]++;
                        
                        gameLog.push(`Achat consommable: ${consumable.name} (${consumable.price} or)`);
                        purchasesMade = true;
                    }
                }
            });
        }
        
        // Acheter des unités si nécessaire
        const unitItems = shopItems.filter(item => item.type === 'unit');
        if (unitItems.length > 0) {
            unitItems.forEach(unit => {
                // Vérifier la disponibilité comme dans le shop normal
                const availability = gameState.shopManager.checkItemAvailability(unit, gameState);
                const worthBuying = this.isUnitWorthBuying(unit, gameState);
                
                if (availability.isAvailable && worthBuying) {
                    if (gameState.addTroop(unit)) {
                        gameState.gameStats.unitsPurchased++;
                        
                        // Suivre les unités achetées
                        if (!gameState.purchasedUnits[unit.name]) {
                            gameState.purchasedUnits[unit.name] = 0;
                        }
                        gameState.purchasedUnits[unit.name]++;
                        
                        gameLog.push(`Achat unité: ${unit.name} (${unit.price} or)`);
                        purchasesMade = true;
                    }
                }
            });
        }
        
        if (!purchasesMade) {
            gameLog.push('Aucun achat effectué au magasin');
        }
    }

    // Évaluer si un bonus vaut la peine d'être acheté
    isBonusWorthBuying(bonus, gameState) {
        const currentTroops = gameState.availableTroops;
        
        // En mode simulation, être très permissif pour les achats
        if (gameState.simulationMode) {
            // Toujours acheter des bonus pas chers au début
            if (currentTroops.length < 3) {
                const shouldBuy = bonus.price <= 30; // Plus restrictif
                return shouldBuy;
            }
            
            // Acheter des bonus avec une probabilité équilibrée
            let baseChance = 0.3; // 30% de chance de base
            
            // Facteurs qui influencent l'achat
            const goldFactor = gameState.gold > bonus.price * 3 ? 0.2 : 0; // +20% si beaucoup d'or
            const earlyGameFactor = currentTroops.length < 5 ? 0.15 : 0; // +15% en début de partie
            const synergyFactor = this.hasSynergyWithBonus(bonus, currentTroops) ? 0.25 : 0; // +25% si synergie
            
            const finalChance = Math.min(0.8, baseChance + goldFactor + earlyGameFactor + synergyFactor); // Max 80%
            const randomValue = Math.random();
            const shouldBuy = randomValue < finalChance;
            
            return shouldBuy;
        }
        
        // Logique normale pour le jeu
        if (currentTroops.length < 3) {
            return bonus.price <= 30;
        }
        
        // Analyser l'impact du bonus sur l'équipe actuelle
        let impact = 0;
        
        // Utiliser les vrais IDs de bonus du jeu
        switch (bonus.bonusId) {
            case 'gold_bonus':
                impact = 25; // +25 or par combat
                break;
            case 'corps_a_corps_bonus':
                impact = currentTroops.filter(t => t.type.includes('Corps à corps')).length * 10;
                break;
            case 'distance_bonus':
                impact = currentTroops.filter(t => t.type.includes('Distance')).length * 10;
                break;
            case 'magique_bonus':
                impact = currentTroops.filter(t => t.type.includes('Magique')).length * 10;
                break;
            case 'epee_aiguisee':
                impact = currentTroops.filter(t => t.type.includes('Corps à corps')).length * 2;
                break;
            case 'arc_renforce':
                impact = currentTroops.filter(t => t.type.includes('Distance')).length * 2;
                break;
            case 'grimoire_magique':
                impact = currentTroops.filter(t => t.type.includes('Magique')).length * 2;
                break;
            case 'amulette_force':
                impact = currentTroops.filter(t => t.type.includes('Corps à corps')).length * 3;
                break;
            case 'cristal_precision':
                impact = currentTroops.filter(t => t.type.includes('Distance')).length * 3;
                break;
            case 'orbe_mystique':
                impact = currentTroops.filter(t => t.type.includes('Magique')).length * 3;
                break;
            case 'potion_force':
                impact = currentTroops.length * 3;
                break;
            case 'elixir_puissance':
                impact = currentTroops.length * 2;
                break;
            case 'armure_legendaire':
                impact = currentTroops.filter(t => t.type.includes('Corps à corps')).length * 7;
                break;
            case 'arc_divin':
                impact = currentTroops.filter(t => t.type.includes('Distance')).length * 7;
                break;
            case 'baguette_supreme':
                impact = currentTroops.filter(t => t.type.includes('Magique')).length * 7;
                break;
            case 'relique_ancienne':
                impact = currentTroops.length * 13;
                break;
            default:
                impact = bonus.price * 0.3;
                break;
        }
        
        const shouldBuy = impact > bonus.price * 0.3 || 
                         (gameState.gold > bonus.price * 2 && Math.random() < 0.4);
        

        
        return shouldBuy;
    }

    // Vérifier si un bonus a une synergie avec les troupes actuelles
    hasSynergyWithBonus(bonus, troops) {
        if (!troops || troops.length === 0) return false;
        
        // Analyser les types de troupes présentes
        const troopTypes = {
            melee: troops.filter(t => t.type.includes('Corps à corps')).length,
            ranged: troops.filter(t => t.type.includes('Distance')).length,
            magical: troops.filter(t => t.type.includes('Magique')).length,
            physical: troops.filter(t => t.type.includes('Physique')).length
        };
        
        // Vérifier les synergies selon le type de bonus
        switch (bonus.bonusId) {
            case 'corps_a_corps_bonus':
            case 'epee_aiguisee':
            case 'amulette_force':
            case 'armure_legendaire':
                return troopTypes.melee >= 2; // Au moins 2 troupes de corps à corps
                
            case 'distance_bonus':
            case 'arc_renforce':
            case 'cristal_precision':
            case 'arc_divin':
                return troopTypes.ranged >= 2; // Au moins 2 troupes à distance
                
            case 'magique_bonus':
            case 'grimoire_magique':
            case 'orbe_mystique':
            case 'baguette_supreme':
                return troopTypes.magical >= 1; // Au moins 1 troupe magique
                
            case 'gold_bonus':
                return true; // Toujours utile
                
            case 'potion_force':
            case 'elixir_puissance':
            case 'relique_ancienne':
                return troops.length >= 3; // Utile si assez de troupes
                
            default:
                return false; // Bonus inconnu, pas de synergie
        }
    }

    // Évaluer si un consommable vaut la peine d'être acheté
    isConsumableWorthBuying(consumable, gameState) {
        if (gameState.simulationMode) {
            // Probabilité de base plus élevée pour les consommables
            let baseChance = 0.35; // 35% de chance de base (augmenté)
            
            // Facteurs d'augmentation
            const goldFactor = gameState.gold > consumable.price * 3 ? 0.25 : 0; // +25% si assez d'or
            const earlyGameFactor = gameState.availableTroops.length < 5 ? 0.2 : 0; // +20% en début de partie
            
            const finalChance = Math.min(0.8, baseChance + goldFactor + earlyGameFactor); // Max 80%
            const randomValue = Math.random();
            const shouldBuy = randomValue < finalChance;
            
            return shouldBuy;
        }
        
        return false; // En mode normal, pas d'achat automatique
    }

    // Évaluer si une unité vaut la peine d'être achetée
    isUnitWorthBuying(unit, gameState) {
        if (gameState.simulationMode) {
            // Probabilité de base pour les unités
            let baseChance = 0.4; // 40% de chance de base
            
            // Facteurs d'augmentation
            const goldFactor = gameState.gold > unit.price * 2 ? 0.2 : 0; // +20% si assez d'or
            const earlyGameFactor = gameState.availableTroops.length < 5 ? 0.3 : 0; // +30% en début de partie
            const powerFactor = (unit.damage * unit.multiplier) > 15 ? 0.15 : 0; // +15% si unité puissante
            
            const finalChance = Math.min(0.9, baseChance + goldFactor + earlyGameFactor + powerFactor); // Max 90%
            const randomValue = Math.random();
            const shouldBuy = randomValue < finalChance;
            
            return shouldBuy;
        }
        
        return false; // En mode normal, pas d'achat automatique
    }

    // Utiliser des consommables si nécessaire pendant le combat
    useConsumablesIfNeeded(gameState) {
        if (!gameState.consumables || gameState.consumables.length === 0) {
            return;
        }
        
        // Évaluer si l'utilisation d'un consommable est nécessaire
        const currentDamage = gameState.currentCombat.totalDamage;
        const targetDamage = gameState.currentCombat.targetDamage;
        const progress = currentDamage / targetDamage;
        
        // Utiliser un consommable avec une probabilité plus élevée
        let useChance = 0.4; // 40% de chance de base
        
        // Augmenter la chance si en difficulté
        if (progress < 0.3) useChance = 0.7; // 70% si moins de 30% de progression
        else if (progress < 0.5) useChance = 0.5; // 50% si moins de 50% de progression
        
        // Augmenter la chance si on a beaucoup de consommables
        if (gameState.consumables.length > 2) useChance += 0.2; // +20% si plus de 2 consommables
        
        const shouldUse = Math.random() < useChance;
        
        if (shouldUse) {
            const availableConsumables = gameState.consumables.filter(c => c.uses > 0);
            
            if (availableConsumables.length > 0) {
                // Choisir un consommable au hasard
                const consumable = availableConsumables[Math.floor(Math.random() * availableConsumables.length)];
                

                gameState.useConsumable(consumable.id);
                gameState.gameStats.consumablesUsed = (gameState.gameStats.consumablesUsed || 0) + 1;
            }
        }
    }

    // Analyser les résultats de la simulation
    analyzeResults() {
        const results = this.simulationResults;
        if (results.length === 0) return;
        
        // Statistiques de base
        this.globalStats.totalGames = results.length;
        this.globalStats.averageRankReached = this.calculateAverageRank(results);
        this.globalStats.averageGoldEarned = this.calculateAverage(results, 'goldEarned');
        this.globalStats.averageCombatWon = this.calculateAverage(results, 'combatsWon');
        this.globalStats.averageCombatLost = this.calculateAverage(results, 'combatsLost');
        this.globalStats.winRate = results.filter(r => r.success).length / results.length;
        this.globalStats.averageGameDuration = this.calculateAverage(results, 'gameDuration');
        
        // Distribution des rangs
        this.globalStats.rankDistribution = this.calculateRankDistribution(results);
        
        // Statistiques d'utilisation des unités
        this.globalStats.unitUsageStats = this.calculateUnitUsageStats(results);
        
        // Efficacité des synergies
        this.globalStats.synergyEffectiveness = this.calculateSynergyEffectiveness(results);
        
        // Statistiques des bonus
        this.globalStats.bonusUsageStats = this.calculateBonusUsageStats(results);
        
        // Statistiques des consommables
        this.globalStats.consumableUsageStats = this.calculateConsumableUsageStats(results);
        
        // Statistiques des unités achetées
        this.globalStats.purchasedUnitsStats = this.calculatePurchasedUnitsStats(results);
        
        // Taux de victoire contre les boss
        this.globalStats.bossWinRates = this.calculateBossWinRates(results);
        
        // Économie d'or
        this.globalStats.goldEconomy = this.calculateGoldEconomy(results);
        

    }

    // Calculer la moyenne d'un champ
    calculateAverage(results, field) {
        const values = results.map(r => r[field]).filter(v => typeof v === 'number');
        return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    }

    // Calculer le rang moyen
    calculateAverageRank(results) {
        const rankValues = {};
        RANKS.forEach((rank, index) => {
            rankValues[rank] = index + 1;
        });
        
        const averageValue = this.calculateAverage(results.map(r => rankValues[r.finalRank] || 1), '');
        return RANKS[Math.floor(averageValue) - 1] || RANKS[0];
    }

    // Calculer la distribution des rangs
    calculateRankDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            distribution[result.finalRank] = (distribution[result.finalRank] || 0) + 1;
        });
        return distribution;
    }

    // Calculer les statistiques d'utilisation des unités
    calculateUnitUsageStats(results) {
        const stats = {};
        const allUnits = new Set();
        
        // Collecter toutes les unités utilisées
        results.forEach(result => {
            Object.keys(result.unitsUsed || {}).forEach(unitName => {
                allUnits.add(unitName);
            });
        });
        
        // Initialiser les statistiques pour toutes les unités
        allUnits.forEach(unitName => {
            stats[unitName] = { 
                totalUses: 0, 
                gamesUsed: 0, 
                averageUsesPerGame: 0,
                usageRate: 0,
                totalGames: results.length
            };
        });
        
        // Calculer les statistiques
        results.forEach(result => {
            Object.entries(result.unitsUsed || {}).forEach(([unitName, count]) => {
                stats[unitName].totalUses += count;
                stats[unitName].gamesUsed++;
            });
        });
        
        // Calculer les moyennes et taux d'utilisation
        Object.values(stats).forEach(stat => {
            stat.averageUsesPerGame = stat.gamesUsed > 0 ? stat.totalUses / stat.gamesUsed : 0;
            stat.usageRate = (stat.gamesUsed / stat.totalGames * 100).toFixed(1);
        });
        
        return stats;
    }

    // Calculer les statistiques d'utilisation des consommables
    calculateConsumableUsageStats(results) {
        const stats = {
            totalPurchased: 0,
            totalUsed: 0,
            averagePurchasedPerGame: 0,
            averageUsedPerGame: 0,
            usageEfficiency: 0,
            consumableTypes: {},
            purchasedConsumables: {} // Détail des consommables achetés
        };
        
        results.forEach(result => {
            const purchased = result.consumablesPurchased || 0;
            const used = result.consumablesUsed || 0;
            
            stats.totalPurchased += purchased;
            stats.totalUsed += used;
            
            // Collecter les détails des consommables achetés (si disponibles)
            if (result.purchasedConsumables) {
                Object.entries(result.purchasedConsumables).forEach(([consumableType, count]) => {
                    if (!stats.purchasedConsumables[consumableType]) {
                        stats.purchasedConsumables[consumableType] = 0;
                    }
                    stats.purchasedConsumables[consumableType] += count;
                });
            }
        });
        
        const totalGames = results.length;
        stats.averagePurchasedPerGame = totalGames > 0 ? stats.totalPurchased / totalGames : 0;
        stats.averageUsedPerGame = totalGames > 0 ? stats.totalUsed / totalGames : 0;
        stats.usageEfficiency = stats.totalPurchased > 0 ? (stats.totalUsed / stats.totalPurchased * 100).toFixed(1) : 0;
        
        return stats;
    }

    // Calculer les statistiques des unités achetées
    calculatePurchasedUnitsStats(results) {
        const stats = {
            totalPurchased: 0,
            averagePurchasedPerGame: 0,
            purchasedUnits: {} // Détail des unités achetées
        };
        
        results.forEach(result => {
            const purchased = result.unitsPurchased || 0;
            stats.totalPurchased += purchased;
            
            // Collecter les détails des unités achetées (si disponibles)
            if (result.purchasedUnits) {
                Object.entries(result.purchasedUnits).forEach(([unitName, count]) => {
                    if (!stats.purchasedUnits[unitName]) {
                        stats.purchasedUnits[unitName] = 0;
                    }
                    stats.purchasedUnits[unitName] += count;
                });
            }
        });
        
        const totalGames = results.length;
        stats.averagePurchasedPerGame = totalGames > 0 ? stats.totalPurchased / totalGames : 0;
        
        return stats;
    }

    // Calculer l'efficacité des synergies
    calculateSynergyEffectiveness(results) {
        const effectiveness = {};
        
        results.forEach(result => {
            Object.entries(result.finalSynergies || {}).forEach(([synergyName, level]) => {
                if (!effectiveness[synergyName]) {
                    effectiveness[synergyName] = { totalLevel: 0, gamesUsed: 0, gamesActive: 0, averageLevel: 0, activeRate: 0 };
                }
                effectiveness[synergyName].totalLevel += level;
                effectiveness[synergyName].gamesUsed++;
                
                // Compter seulement si la synergie est active (niveau > 1)
                if (level > 1) {
                    effectiveness[synergyName].gamesActive++;
                }
            });
        });
        
        // Calculer les moyennes et taux d'activation
        Object.values(effectiveness).forEach(stat => {
            stat.averageLevel = stat.totalLevel / stat.gamesUsed;
            stat.activeRate = (stat.gamesActive / stat.gamesUsed * 100).toFixed(1);
        });
        
        return effectiveness;
    }

    // Calculer les statistiques d'utilisation des bonus
    calculateBonusUsageStats(results) {
        const stats = {};
        
        results.forEach(result => {
            result.finalBonuses?.forEach(bonusId => {
                if (!stats[bonusId]) {
                    stats[bonusId] = { gamesUsed: 0, usageRate: 0 };
                }
                stats[bonusId].gamesUsed++;
            });
        });
        
        // Calculer les taux d'utilisation
        const totalGames = results.length;
        Object.values(stats).forEach(stat => {
            stat.usageRate = (stat.gamesUsed / totalGames * 100).toFixed(1);
        });
        
        return stats;
    }

    // Calculer les taux de victoire contre les boss
    calculateBossWinRates(results) {
        const bossStats = {};
        
        results.forEach(result => {
            result.bossFights?.forEach(fight => {
                if (!bossStats[fight.bossName]) {
                    bossStats[fight.bossName] = { wins: 0, total: 0, winRate: 0 };
                }
                bossStats[fight.bossName].total++;
                if (fight.victory) bossStats[fight.bossName].wins++;
            });
        });
        
        // Calculer les taux de victoire
        Object.values(bossStats).forEach(stat => {
            stat.winRate = stat.total > 0 ? stat.wins / stat.total : 0;
        });
        
        return bossStats;
    }

    // Calculer l'économie d'or
    calculateGoldEconomy(results) {
        const economy = {
            averageGoldPerGame: this.calculateAverage(results, 'gold'),
            averageGoldSpent: this.calculateAverage(results, 'goldSpent'),
            averageGoldEarned: this.calculateAverage(results, 'goldEarned'),
            goldEfficiency: 0
        };
        
        economy.goldEfficiency = economy.averageGoldEarned > 0 ? 
            economy.averageGoldEarned / (economy.averageGoldSpent + 100) : 0;
        
        return economy;
    }

    // Générer un rapport d'équilibrage
    generateBalanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            simulationConfig: this.simulationConfig,
            globalStats: this.globalStats,
            recommendations: this.generateRecommendations(),
            unitAnalysis: this.analyzeUnitBalance(),
            synergyAnalysis: this.analyzeSynergyBalance(),
            economyAnalysis: this.analyzeEconomyBalance()
        };
        
        return report;
    }

    // Générer des recommandations d'équilibrage
    generateRecommendations() {
        const recommendations = [];
        
        // Analyser le taux de victoire global
        if (this.globalStats.winRate < 0.4) {
            recommendations.push({
                type: 'difficulty',
                issue: 'Taux de victoire trop faible',
                suggestion: 'Réduire les dégâts requis ou augmenter la puissance des unités'
            });
        } else if (this.globalStats.winRate > 0.8) {
            recommendations.push({
                type: 'difficulty',
                issue: 'Taux de victoire trop élevé',
                suggestion: 'Augmenter les dégâts requis ou réduire la puissance des unités'
            });
        }
        
        // Analyser l'économie
        if (this.globalStats.goldEconomy.goldEfficiency < 0.5) {
            recommendations.push({
                type: 'economy',
                issue: 'Efficacité économique faible',
                suggestion: 'Augmenter les récompenses ou réduire les coûts'
            });
        }
        
        // Analyser les unités sous-utilisées
        Object.entries(this.globalStats.unitUsageStats).forEach(([unitName, stats]) => {
            if (stats.gamesUsed / this.globalStats.totalGames < 0.1) {
                recommendations.push({
                    type: 'unit',
                    issue: `Unité ${unitName} sous-utilisée`,
                    suggestion: 'Réduire le coût ou augmenter la puissance'
                });
            }
        });
        
        return recommendations;
    }

    // Analyser l'équilibrage des unités
    analyzeUnitBalance() {
        const analysis = {};
        
        Object.entries(this.globalStats.unitUsageStats).forEach(([unitName, stats]) => {
            analysis[unitName] = {
                usageRate: stats.gamesUsed / this.globalStats.totalGames,
                averageUses: stats.averageUsesPerGame,
                effectiveness: stats.averageUsesPerGame * 10, // Score d'efficacité
                balance: stats.averageUsesPerGame > 2 ? 'overpowered' : 
                        stats.averageUsesPerGame < 0.5 ? 'underpowered' : 'balanced'
            };
        });
        
        return analysis;
    }

    // Analyser l'équilibrage des synergies
    analyzeSynergyBalance() {
        const analysis = {};
        
        Object.entries(this.globalStats.synergyEffectiveness).forEach(([synergyName, stats]) => {
            analysis[synergyName] = {
                averageLevel: stats.averageLevel,
                usageRate: stats.gamesUsed / this.globalStats.totalGames,
                effectiveness: stats.averageLevel * stats.gamesUsed / this.globalStats.totalGames,
                balance: stats.averageLevel > 2 ? 'overpowered' : 
                        stats.averageLevel < 0.5 ? 'underpowered' : 'balanced'
            };
        });
        
        return analysis;
    }

    // Analyser l'équilibrage économique
    analyzeEconomyBalance() {
        const economy = this.globalStats.goldEconomy;
        
        return {
            goldEfficiency: economy.goldEfficiency,
            averageGoldPerGame: economy.averageGoldPerGame,
            spendingRatio: economy.averageGoldSpent / (economy.averageGoldEarned + 100),
            balance: economy.goldEfficiency > 1 ? 'generous' : 
                    economy.goldEfficiency < 0.3 ? 'restrictive' : 'balanced',
            recommendations: economy.goldEfficiency < 0.5 ? 
                'Augmenter les récompenses ou réduire les coûts' : 
                economy.goldEfficiency > 1.5 ? 
                'Réduire les récompenses ou augmenter les coûts' : 
                'Économie équilibrée'
        };
    }

    // Exporter les résultats en JSON
    exportResults(filename = 'simulation_results.json') {
        const data = {
            timestamp: new Date().toISOString(),
            config: this.simulationConfig,
            results: this.simulationResults,
            globalStats: this.globalStats,
            balanceReport: this.generateBalanceReport()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Afficher un résumé des résultats
    displaySummary() {
        const stats = this.globalStats;
        
        console.log('\n📊 RÉSULTATS DE LA SIMULATION');
        console.log('===============================');
        console.log(`🎮 Parties simulées: ${stats.totalGames}`);
        console.log(`🏆 Taux de victoire: ${(stats.winRate * 100).toFixed(2)}%`);
        console.log(`📈 Rang moyen: ${stats.averageRankReached}`);
        console.log(`💰 Or gagné moyen: ${Math.floor(stats.averageGoldEarned)}`);
        console.log(`⚔️ Combats gagnés moyens: ${Math.floor(stats.averageCombatWon)}`);
        console.log(`💀 Combats perdus moyens: ${Math.floor(stats.averageCombatLost)}`);
        console.log(`⏱️ Durée moyenne: ${(stats.averageGameDuration / 1000).toFixed(2)}s`);
        
        // Afficher tous les rangs atteints
        console.log('\n📊 DISTRIBUTION DES RANGS:');
        const allRanks = RANKS;
        allRanks.forEach(rank => {
            const count = stats.rankDistribution[rank] || 0;
            if (count > 0) {
                const percentage = ((count / stats.totalGames) * 100).toFixed(1);
                const bar = '█'.repeat(Math.floor(count / stats.totalGames * 20));
                console.log(`  ${rank}: ${count} parties (${percentage}%) ${bar}`);
            }
        });
        
        console.log('\n===============================');
    }
} 