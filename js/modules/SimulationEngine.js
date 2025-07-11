// Moteur de simulation pour l'analyse d'équilibrage
import { GameState } from './GameState.js';

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
        console.log(`🚀 Démarrage de la simulation: ${this.simulationConfig.numberOfGames} parties`);
        
        const startTime = Date.now();
        this.simulationResults = [];
        
        for (let i = 0; i < this.simulationConfig.numberOfGames; i++) {
            // Mise à jour de la progression plus fréquente pour les petites simulations
            const updateInterval = this.simulationConfig.numberOfGames < 100 ? 1 : 10;
            if (i % updateInterval === 0) {
                console.log(`📊 Simulation en cours: ${i}/${this.simulationConfig.numberOfGames}`);
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
        
        console.log(`✅ Simulation terminée en ${(simulationDuration / 1000).toFixed(2)}s`);
        
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
            
            while (gameState.rank !== 'S' && roundCount < maxRounds) {
                roundCount++;
                console.log(`\n=== TOUR ${roundCount} ===`);
                
                // Phase de recrutement automatique
                console.log(`Recrutement - Or: ${gameState.gold}, Troupes: ${gameState.availableTroops.length}`);
                this.simulateRecruitmentPhase(gameState, gameLog);
                
                // Phase de combat automatique
                console.log(`Combat - Troupes disponibles: ${gameState.availableTroops.length}`);
                const combatResult = this.simulateCombatPhase(gameState, gameLog);
                
                if (!combatResult.success) {
                    console.log(`Échec du combat: ${combatResult.error}`);
                    break; // Échec de la partie
                }
                
                        // Phase de magasin automatique
        console.log(`Magasin - Or après combat: ${gameState.gold}`);
        console.log(`Magasin - Troupes actuelles: ${gameState.availableTroops.length}`);
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
                success: gameState.rank === 'S',
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
            
            console.log(`Partie ${gameIndex} terminée - Bonus débloqués:`, gameState.unlockedBonuses);
            console.log(`Partie ${gameIndex} terminée - Bonus achetés:`, gameState.gameStats.bonusesPurchased);
            
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
        
        console.log(`Troupes disponibles après recrutement: ${gameState.availableTroops.length}`);
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
        const allUnits = [
            { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, cost: 10, rarity: 'common' },
            { name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3, cost: 12, rarity: 'common' },
            { name: 'Magicien Bleu', type: ['Distance', 'Magique'], damage: 3, multiplier: 4, cost: 15, rarity: 'uncommon' },
            { name: 'Lancier', type: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, cost: 12, rarity: 'common' },
            { name: 'Paysan', type: ['Corps à corps', 'Physique'], damage: 2, multiplier: 1, cost: 5, rarity: 'common' },
            { name: 'Soigneur', type: ['Soigneur', 'Magique'], damage: 1, multiplier: 1, cost: 8, rarity: 'common' },
            { name: 'Barbare', type: ['Corps à corps', 'Physique'], damage: 7, multiplier: 1, cost: 20, rarity: 'uncommon' },
            { name: 'Sorcier', type: ['Distance', 'Magique'], damage: 5, multiplier: 3, cost: 25, rarity: 'rare' },
            { name: 'Fronde', type: ['Distance', 'Physique'], damage: 2, multiplier: 5, cost: 30, rarity: 'rare' }
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
            
            console.log(`Combat terminé: ${victory ? 'Victoire' : 'Défaite'} - ${gameState.currentCombat.totalDamage}/${gameState.currentCombat.targetDamage} dégâts`);
            
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
            console.log(`Simulation: ${selectedTroops.length} troupes copiées dans combatTroops et selectedTroops`);
        } else {
            // Marquer les troupes comme sélectionnées pour le combat (mode normal)
            selectedTroops.forEach((troop, index) => {
                gameState.selectTroopForCombat(index);
            });
        }
        
        console.log(`Sélectionné ${selectedTroops.length} troupes pour le combat:`, selectedTroops.map(t => t.name));
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
        
        console.log(`Tour ${gameState.currentCombat.round}: ${turnDamage} dégâts (${combatTroops.length} troupes)`);
        
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
        console.log(`🏪 PHASE MAGASIN - Or disponible: ${gameState.gold}`);
        
        if (gameState.gold < 10) {
            console.log('❌ Pas assez d\'or pour le magasin (< 10)');
            gameLog.push('Pas assez d\'or pour le magasin');
            return;
        }
        
        // Générer des items de magasin
        const shopItems = gameState.shopManager.generateShopItems(gameState);
        console.log(`📦 Items générés:`, shopItems);
        
        let purchasesMade = false;
        
        // Acheter des bonus utiles (limiter à 2-3 bonus par partie)
        const bonusItems = shopItems.filter(item => item.type === 'bonus');
        if (bonusItems.length > 0) {
            console.log(`🎁 Bonus disponibles (${bonusItems.length}):`, bonusItems.map(b => `${b.name} (${b.bonusId}) - ${b.price} or`));
            
            // Limiter le nombre de bonus achetés par partie
            const maxBonusesPerGame = 3;
            const currentBonusCount = gameState.gameStats.bonusesPurchased || 0;
            
            if (currentBonusCount >= maxBonusesPerGame) {
                console.log(`⚠️ Limite de bonus atteinte (${currentBonusCount}/${maxBonusesPerGame}), aucun achat de bonus`);
                return;
            }
            
            bonusItems.forEach(bonus => {
                const canAfford = gameState.gold >= bonus.price;
                const worthBuying = this.isBonusWorthBuying(bonus, gameState);
                console.log(`💰 Bonus ${bonus.name} (${bonus.bonusId}): peut acheter=${canAfford}, vaut la peine=${worthBuying}, or=${gameState.gold}`);
                
                if (canAfford && worthBuying) {
                    console.log(`🛒 ACHAT BONUS: ${bonus.name} (${bonus.bonusId}) pour ${bonus.price} or`);
                    gameState.unlockBonus(bonus.bonusId);
 gameState.shopManager.purchaseBonus(bonus.bonusId, gameState);
                    gameState.gameStats.bonusesPurchased++;
                    gameLog.push(`Achat bonus: ${bonus.name} (${bonus.bonusId}) - ${bonus.price} or`);
                    purchasesMade = true;
                    console.log(`✅ Bonus acheté avec succès: ${bonus.name} (${bonus.bonusId})`);
                } else {
                    console.log(`❌ Bonus non acheté: ${bonus.name} - peut acheter: ${canAfford}, vaut la peine: ${worthBuying}`);
                }
            });
        } else {
            console.log(`❌ Aucun bonus disponible dans le magasin`);
        }
        
        // Acheter des consommables
        const consumableItems = shopItems.filter(item => item.type === 'consumable');
        if (consumableItems.length > 0) {
            console.log(`🧪 Consommables disponibles (${consumableItems.length}):`, consumableItems.map(c => `${c.name} (${c.consumableType}) - ${c.price} or`));
            consumableItems.forEach(consumable => {
                const canAfford = gameState.gold >= consumable.price;
                const worthBuying = this.isConsumableWorthBuying(consumable, gameState);
                console.log(`🧪 Consommable ${consumable.name}: peut acheter=${canAfford}, vaut la peine=${worthBuying}`);
                
                if (canAfford && worthBuying) {
                    console.log(`🛒 ACHAT CONSOMMABLE: ${consumable.name} pour ${consumable.price} or`);
                    gameState.addConsumable(consumable.consumableType);
                    gameState.shopManager.spendGold(gameState, consumable.price);
                    gameState.gameStats.consumablesPurchased = (gameState.gameStats.consumablesPurchased || 0) + 1;
                    
                    // Suivre les consommables achetés
                    if (!gameState.purchasedConsumables[consumable.consumableType]) {
                        gameState.purchasedConsumables[consumable.consumableType] = 0;
                    }
                    gameState.purchasedConsumables[consumable.consumableType]++;
                    
                    gameLog.push(`Achat consommable: ${consumable.name} (${consumable.price} or)`);
                    purchasesMade = true;
                    console.log(`✅ Consommable acheté avec succès: ${consumable.name}`);
                } else {
                    console.log(`❌ Consommable non acheté: ${consumable.name} - peut acheter: ${canAfford}, vaut la peine: ${worthBuying}`);
                }
            });
        } else {
            console.log(`❌ Aucun consommable disponible dans le magasin`);
        }
        
        // Acheter des unités si nécessaire
        const unitItems = shopItems.filter(item => item.type === 'unit');
        if (unitItems.length > 0) {
            console.log(`⚔️ Unités disponibles (${unitItems.length}):`, unitItems.map(u => `${u.name} (${u.price} or)`));
            unitItems.forEach(unit => {
                const canAfford = gameState.gold >= unit.price;
                const hasSpace = gameState.availableTroops.length < 15;
                const worthBuying = this.isUnitWorthBuying(unit, gameState);
                console.log(`⚔️ Unité ${unit.name}: peut acheter=${canAfford}, a de la place=${hasSpace}, vaut la peine=${worthBuying}`);
                
                if (canAfford && hasSpace && worthBuying) {
                    console.log(`🛒 ACHAT UNITÉ: ${unit.name} pour ${unit.price} or`);
                    gameState.addTroop(unit);
                    gameState.shopManager.spendGold(gameState, unit.price);
                    gameState.gameStats.unitsPurchased++;
                    
                    // Suivre les unités achetées
                    if (!gameState.purchasedUnits[unit.name]) {
                        gameState.purchasedUnits[unit.name] = 0;
                    }
                    gameState.purchasedUnits[unit.name]++;
                    
                    gameLog.push(`Achat unité: ${unit.name} (${unit.price} or)`);
                    purchasesMade = true;
                    console.log(`✅ Unité achetée avec succès: ${unit.name}`);
                } else {
                    console.log(`❌ Unité non achetée: ${unit.name} - peut acheter: ${canAfford}, a de la place: ${hasSpace}, vaut la peine: ${worthBuying}`);
                }
            });
        } else {
            console.log(`❌ Aucune unité disponible dans le magasin`);
        }
        
        if (!purchasesMade) {
            gameLog.push('Aucun achat effectué au magasin');
        }
        
        console.log(`Magasin: ${gameState.gold} or restant, ${gameState.availableTroops.length} troupes`);
        console.log(`Magasin: ${gameState.gameStats.unitsPurchased} unités achetées, ${gameState.gameStats.bonusesPurchased} bonus achetés, ${gameState.gameStats.consumablesPurchased} consommables achetés`);
    }

    // Évaluer si un bonus vaut la peine d'être acheté
    isBonusWorthBuying(bonus, gameState) {
        const currentTroops = gameState.availableTroops;
        
        // En mode simulation, être très permissif pour les achats
        if (gameState.simulationMode) {
            console.log(`🔍 Évaluation bonus en mode simulation: ${bonus.name} (${bonus.bonusId}) - Prix: ${bonus.price}, Or: ${gameState.gold}`);
            
            // Toujours acheter des bonus pas chers au début
            if (currentTroops.length < 3) {
                const shouldBuy = bonus.price <= 30; // Plus restrictif
                console.log(`   Début de partie (${currentTroops.length} troupes): achat=${shouldBuy} (prix max: 30)`);
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
            
            console.log(`   Probabilité: ${(finalChance * 100).toFixed(1)}% (base: ${(baseChance * 100).toFixed(1)}% + or: ${(goldFactor * 100).toFixed(1)}% + début: ${(earlyGameFactor * 100).toFixed(1)}% + synergie: ${(synergyFactor * 100).toFixed(1)}%), random: ${(randomValue * 100).toFixed(1)}%, achat: ${shouldBuy}`);
            
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
        
        console.log(`Évaluation bonus ${bonus.name} (${bonus.bonusId}): impact=${impact}, prix=${bonus.price}, achat=${shouldBuy}`);
        
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
            console.log(`🔍 Évaluation consommable: ${consumable.name} (${consumable.consumableType}) - Prix: ${consumable.price}`);
            
            // Probabilité de base plus élevée pour les consommables
            let baseChance = 0.35; // 35% de chance de base (augmenté)
            
            // Facteurs d'augmentation
            const goldFactor = gameState.gold > consumable.price * 3 ? 0.25 : 0; // +25% si assez d'or
            const earlyGameFactor = gameState.availableTroops.length < 5 ? 0.2 : 0; // +20% en début de partie
            
            const finalChance = Math.min(0.8, baseChance + goldFactor + earlyGameFactor); // Max 80%
            const randomValue = Math.random();
            const shouldBuy = randomValue < finalChance;
            
            console.log(`   Probabilité: ${(finalChance * 100).toFixed(1)}% (base: ${(baseChance * 100).toFixed(1)}% + or: ${(goldFactor * 100).toFixed(1)}% + début: ${(earlyGameFactor * 100).toFixed(1)}%), random: ${(randomValue * 100).toFixed(1)}%, achat: ${shouldBuy}`);
            
            return shouldBuy;
        }
        
        return false; // En mode normal, pas d'achat automatique
    }

    // Évaluer si une unité vaut la peine d'être achetée
    isUnitWorthBuying(unit, gameState) {
        if (gameState.simulationMode) {
            console.log(`🔍 Évaluation unité: ${unit.name} - Prix: ${unit.price}, Or: ${gameState.gold}`);
            
            // Probabilité de base pour les unités
            let baseChance = 0.4; // 40% de chance de base
            
            // Facteurs d'augmentation
            const goldFactor = gameState.gold > unit.price * 2 ? 0.2 : 0; // +20% si assez d'or
            const earlyGameFactor = gameState.availableTroops.length < 5 ? 0.3 : 0; // +30% en début de partie
            const powerFactor = (unit.damage * unit.multiplier) > 15 ? 0.15 : 0; // +15% si unité puissante
            
            const finalChance = Math.min(0.9, baseChance + goldFactor + earlyGameFactor + powerFactor); // Max 90%
            const randomValue = Math.random();
            const shouldBuy = randomValue < finalChance;
            
            console.log(`   Probabilité: ${(finalChance * 100).toFixed(1)}% (base: ${(baseChance * 100).toFixed(1)}% + or: ${(goldFactor * 100).toFixed(1)}% + début: ${(earlyGameFactor * 100).toFixed(1)}% + puissance: ${(powerFactor * 100).toFixed(1)}%), random: ${(randomValue * 100).toFixed(1)}%, achat: ${shouldBuy}`);
            
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
                
                console.log(`🧪 Utilisation consommable: ${consumable.name} (${consumable.type}) - Progression: ${(progress * 100).toFixed(1)}%`);
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
        
        console.log('📊 Analyse des résultats terminée');
    }

    // Calculer la moyenne d'un champ
    calculateAverage(results, field) {
        const values = results.map(r => r[field]).filter(v => typeof v === 'number');
        return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    }

    // Calculer le rang moyen
    calculateAverageRank(results) {
        const rankValues = {
            'F-': 1, 'F': 2, 'F+': 3, 'E-': 4, 'E': 5, 'E+': 6,
            'D-': 7, 'D': 8, 'D+': 9, 'C-': 10, 'C': 11, 'C+': 12,
            'B-': 13, 'B': 14, 'B+': 15, 'A-': 16, 'A': 17, 'A+': 18, 'S': 19
        };
        
        const averageValue = this.calculateAverage(results.map(r => rankValues[r.finalRank] || 1), '');
        const ranks = Object.keys(rankValues);
        return ranks[Math.floor(averageValue) - 1] || 'F-';
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
        
        console.log('📊 RÉSUMÉ DE LA SIMULATION');
        console.log('========================');
        console.log(`Parties simulées: ${stats.totalGames}`);
        console.log(`Taux de victoire: ${(stats.winRate * 100).toFixed(1)}%`);
        console.log(`Rang moyen atteint: ${stats.averageRankReached}`);
        console.log(`Or moyen gagné: ${stats.averageGoldEarned.toFixed(0)}`);
        console.log(`Combats gagnés en moyenne: ${stats.averageCombatWon.toFixed(1)}`);
        console.log(`Combats perdus en moyenne: ${stats.averageCombatLost.toFixed(1)}`);
        console.log(`Durée moyenne d'une partie: ${(stats.averageGameDuration / 1000).toFixed(1)}s`);
        console.log(`Efficacité économique: ${(stats.goldEconomy.goldEfficiency * 100).toFixed(1)}%`);
        
        console.log('\n🏆 DISTRIBUTION DES RANGS');
        Object.entries(stats.rankDistribution)
            .sort((a, b) => b[1] - a[1])
            .forEach(([rank, count]) => {
                const percentage = (count / stats.totalGames * 100).toFixed(1);
                console.log(`${rank}: ${count} parties (${percentage}%)`);
            });
        
        console.log('\n⚔️ UNITÉS LES PLUS UTILISÉES');
        Object.entries(stats.unitUsageStats)
            .sort((a, b) => b[1].totalUses - a[1].totalUses)
            .slice(0, 5)
            .forEach(([unit, stat]) => {
                console.log(`${unit}: ${stat.totalUses} utilisations (${stat.averageUsesPerGame.toFixed(1)}/partie)`);
            });
        
        console.log('\n🔗 SYNERGIES LES PLUS UTILISÉES');
        Object.entries(stats.synergyEffectiveness)
            .sort((a, b) => b[1].averageLevel - a[1].averageLevel)
            .slice(0, 5)
            .forEach(([synergy, stat]) => {
                console.log(`${synergy}: Niveau ${stat.averageLevel.toFixed(1)} (${stat.gamesUsed} parties, ${stat.activeRate}% active)`);
            });
        
        console.log('\n🎁 BONUS LES PLUS UTILISÉS');
        Object.entries(stats.bonusUsageStats)
            .sort((a, b) => parseFloat(b[1].usageRate) - parseFloat(a[1].usageRate))
            .slice(0, 5)
            .forEach(([bonus, stat]) => {
                console.log(`${bonus}: ${stat.usageRate}% des parties (${stat.gamesUsed} parties)`);
            });
    }
} 