// Simulateur automatique pour GuildMaster
import { RANKS } from './constants/combat/GameConstants.js';
import { removeUsedTroopsFromCombat, drawCombatTroops, calculateSynergies } from './UnitManager.js';
import { BASE_UNITS } from './constants/units/UnitConstants.js';
import { BONUS_DESCRIPTIONS } from './constants/shop/BonusConstants.js';

export class AutoSimulator {
    constructor() {
        this.strategies = {
            balanced: {
                name: 'Équilibré',
                description: 'Stratégie équilibrée entre unités et bonus'
            },
            aggressive: {
                name: 'Agressif',
                description: 'Achat prioritaire d\'unités puissantes'
            },
            defensive: {
                name: 'Défensif',
                description: 'Focus sur les bonus d\'équipement'
            },
            economic: {
                name: 'Économique',
                description: 'Optimisation de l\'économie'
            }
        };
    }

    // Simuler une partie complète
    async simulateGame(strategyName = 'balanced') {
        console.log(`🎮 Début de simulation avec la stratégie: ${strategyName}`);
        
        // Créer un nouveau gameState pour la simulation
        const gameState = await this.createGameState();
        const gameStats = {
            goldSpent: 0,
            goldEarned: 0,
            totalDamage: 0,
            unitsPurchased: [],
            bonusesPurchased: [],
            synergiesUsed: [],
            finalRank: 'F-',
            rounds: 0,
            victory: false,
            duration: 0,
            roundDetails: [] // Nouveau : détails de chaque round
        };

        const startTime = Date.now();
        let round = 0;
        const maxRounds = 50; // Limite pour éviter les boucles infinies

        while (round < maxRounds && gameState.rank !== 'S') {
            round++;
            console.log(`📊 Round ${round} - Rang: ${gameState.rank} - Or: ${gameState.gold}`);

            // Phase 1: Combat (pour gagner de l'or)
            const combatResult = this.simulateCombatPhase(gameState, gameStats, round);
            if (!combatResult) {
                console.log(`❌ Défaite au round ${round}`);
                break;
            }

            // Phase 2: Achat au magasin (avec l'or gagné)
            this.simulateShopPhase(gameState, gameStats, strategyName);

            // Vérifier si on a atteint le rang S
            if (gameState.rank === 'S') {
                console.log(`🏆 Victoire! Rang S atteint au round ${round}`);
                gameStats.victory = true;
                break;
            }
        }

        gameStats.finalRank = gameState.rank;
        gameStats.rounds = round;
        gameStats.duration = Date.now() - startTime;
        gameStats.goldEarned = gameState.gameStats.goldEarned;

        // Calculer les dégâts totaux à partir des détails des rounds
        gameStats.totalDamage = gameStats.roundDetails.reduce((sum, round) => sum + round.damage, 0);

        console.log(`✅ Simulation terminée - Rang final: ${gameStats.finalRank}, Rounds: ${gameStats.rounds}, Dégâts totaux: ${gameStats.totalDamage}, Or gagné: ${gameStats.goldEarned}, Or dépensé: ${gameStats.goldSpent}`);
        
        // Vérification de cohérence
        if (gameStats.goldSpent > gameStats.goldEarned) {
            console.warn(`⚠️ ATTENTION: Or dépensé (${gameStats.goldSpent}) > Or gagné (${gameStats.goldEarned})`);
        }
        
        return gameStats;
    }

    // Créer un gameState pour la simulation
    async createGameState() {
        // Importer dynamiquement pour éviter les dépendances circulaires
        const { GameState } = await import('./GameState.js');
        const gameState = new GameState();
        
        // S'assurer que le ShopManager est correctement initialisé pour les simulations
        if (gameState.shopManager) {
            gameState.shopManager.currentShopPurchasedBonuses = [];
            gameState.shopManager.currentShopPurchasedUnits = [];
            gameState.shopManager.currentShopPurchasedConsumables = [];
        }
        
        return gameState;
    }

    // Simuler la phase d'achat
    simulateShopPhase(gameState, gameStats, strategyName) {
        console.log(`🛒 Phase d'achat - Or disponible: ${gameState.gold}`);
        
        // Générer les items du magasin
        const shopItems = this.generateShopItems(gameState);
        
        // Appliquer la stratégie d'achat
        switch (strategyName) {
            case 'aggressive':
                this.aggressiveStrategy(shopItems, gameState, gameStats);
                break;
            case 'defensive':
                this.defensiveStrategy(shopItems, gameState, gameStats);
                break;
            case 'economic':
                this.economicStrategy(shopItems, gameState, gameStats);
                break;
            default:
                this.balancedStrategy(shopItems, gameState, gameStats);
        }
    }

    // Stratégie équilibrée
    balancedStrategy(shopItems, gameState, gameStats) {
        // Priorité: unités rares > bonus d'équipement > unités communes
        const priorities = [
          { type: "unit", rarity: "legendary" },
          { type: "bonus", rarity: "legendary" },
          { type: "unit", rarity: "epic" },
          { type: "bonus", rarity: "epic" },
          { type: "unit", rarity: "rare" },
          { type: "bonus", rarity: "rare" },
          { type: "unit", rarity: "uncommon" },
          { type: "bonus", rarity: "uncommon" },
          { type: "unit", rarity: "common" },
          { type: "bonus", rarity: "common" },
        ];

        this.buyByPriority(shopItems, priorities, gameState, gameStats);
    }

    // Stratégie agressive
    aggressiveStrategy(shopItems, gameState, gameStats) {
        // Priorité: unités > bonus
        const priorities = [
            { type: 'unit', rarity: 'legendary' },
            { type: 'unit', rarity: 'epic' },
            { type: 'unit', rarity: 'rare' },
            { type: 'unit', rarity: 'uncommon' },
            { type: 'unit', rarity: 'common' },
            { type: 'bonus', rarity: 'legendary' },
            { type: 'bonus', rarity: 'epic' },
            { type: 'bonus', rarity: 'rare' },
            { type: 'bonus', rarity: 'uncommon' },
            { type: 'bonus', rarity: 'common' }
        ];

        this.buyByPriority(shopItems, priorities, gameState, gameStats);
    }

    // Stratégie défensive
    defensiveStrategy(shopItems, gameState, gameStats) {
        // Priorité: bonus > unités
        const priorities = [
            { type: 'bonus', rarity: 'legendary' },
            { type: 'bonus', rarity: 'epic' },
            { type: 'bonus', rarity: 'rare' },
            { type: 'bonus', rarity: 'uncommon' },
            { type: 'bonus', rarity: 'common' },
            { type: 'unit', rarity: 'legendary' },
            { type: 'unit', rarity: 'epic' },
            { type: 'unit', rarity: 'rare' },
            { type: 'unit', rarity: 'uncommon' },
            { type: 'unit', rarity: 'common' }
        ];

        this.buyByPriority(shopItems, priorities, gameState, gameStats);
    }

    // Stratégie économique
    economicStrategy(shopItems, gameState, gameStats) {
        // Priorité: bonus d'or > unités > autres bonus
        const priorities = [
            { type: 'bonus', bonusId: 'gold_bonus' },
            { type: 'unit', rarity: 'legendary' },
            { type: 'unit', rarity: 'epic' },
            { type: 'bonus', rarity: 'legendary' },
            { type: 'unit', rarity: 'rare' },
            { type: 'bonus', rarity: 'epic' },
            { type: 'bonus', rarity: 'rare' },
            { type: 'unit', rarity: 'uncommon' },
            { type: 'bonus', rarity: 'uncommon' },
            { type: 'unit', rarity: 'common' },
            { type: 'bonus', rarity: 'common' }
        ];

        this.buyByPriority(shopItems, priorities, gameState, gameStats);
    }

    // Acheter selon les priorités
    buyByPriority(shopItems, priorities, gameState, gameStats) {
        let purchasesThisRound = 0;
        const maxPurchasesPerRound = 2; // Réduire la limite d'achats par round
        
        console.log(`🛒 Or disponible au début: ${gameState.gold}`);
        
        for (const priority of priorities) {
            const matchingItems = shopItems.filter(item => {
                if (priority.type !== item.type) return false;
                if (priority.bonusId && item.bonusId !== priority.bonusId) return false;
                if (priority.rarity && item.rarity !== priority.rarity) return false;
                return true;
            });

            for (const item of matchingItems) {
                // Arrêter si on a atteint la limite d'achats
                if (purchasesThisRound >= maxPurchasesPerRound) {
                    console.log(`🛑 Limite d'achats atteinte (${maxPurchasesPerRound})`);
                    return;
                }
                
                // Vérifier l'or disponible avant chaque achat
                if (gameState.gold < item.price) {
                    console.log(`💰 Pas assez d'or pour ${item.name} (${item.price} or requis, ${gameState.gold} disponible)`);
                    continue;
                }
                
                // Vérification supplémentaire: ne pas dépenser plus que ce qu'on a gagné
                const totalGoldEarned = gameState.gameStats.goldEarned || 0;
                const totalGoldSpent = gameStats.goldSpent || 0;
                const remainingEarnedGold = totalGoldEarned - totalGoldSpent;
                
                if (item.price > remainingEarnedGold) {
                    console.log(`💰 Pas assez d'or gagné pour ${item.name} (${item.price} or requis, ${remainingEarnedGold} or gagné disponible)`);
                    continue;
                }
                
                if (this.purchaseItem(item, gameState, gameStats)) {
                    purchasesThisRound++;
                    console.log(`💰 Achat: ${item.name} (${item.price} or) - Achat ${purchasesThisRound}/${maxPurchasesPerRound} - Or restant: ${gameState.gold}`);
                }
            }
        }
        
        console.log(`🛒 Or restant à la fin: ${gameState.gold}`);
    }

    // Générer les items du magasin
    generateShopItems(gameState) {
        // Utiliser la même logique que le shop normal
        return gameState.shopManager.generateShopItems(gameState);
        }

    // Obtenir le prix d'une unité (utilise la même logique que le shop normal)
    getUnitPrice(unit) {
        // Copier la logique de calculateUnitPrice du ShopManager
        let basePrice = 25; // Prix de base
        
        // Ajuster le prix selon la rareté
        switch (unit.rarity) {
            case 'common': basePrice = 25; break;
            case 'uncommon': basePrice = 30; break;
            case 'rare': basePrice = 50; break;
            case 'epic': basePrice = 60; break;
            case 'legendary': basePrice = 100; break;
        }
        
        // Ajuster selon les stats (dégâts + multiplicateur)
        const statBonus = Math.floor((unit.damage + unit.multiplier) / 2);
        basePrice += statBonus;
        
        // Prix augmentés de 75% pour équilibrer l'économie
        return Math.ceil(basePrice * 1.75);
    }

    // Obtenir le coût d'une unité (alias pour compatibilité)
    getUnitCost(unit) {
        return this.getUnitPrice(unit);
    }

    // Acheter un item (utilise la même logique que le shop normal)
    purchaseItem(item, gameState, gameStats) {
        // Vérifications manuelles pour les simulations
        const canAfford = gameState.gold >= item.price;
        
        // Vérifier si l'item a déjà été acheté dans cette session de shop
        const isBonusAlreadyPurchased = item.type === 'bonus' && 
            gameState.shopManager.currentShopPurchasedBonuses.includes(item.bonusId);
        const isUnitAlreadyPurchased = item.type === 'unit' && 
            gameState.shopManager.currentShopPurchasedUnits.includes(item.name);
        
        if (!canAfford || isBonusAlreadyPurchased || isUnitAlreadyPurchased) {
            return false;
        }
        
        // Ne jamais acheter de consommables dans les simulations
        if (item.type === 'consumable') {
            return false;
        }
        
        // Utiliser la même logique d'achat que le shop normal
        switch (item.type) {
            case 'unit':
                if (gameState.shopManager.purchaseUnit(item.name, gameState)) {
                    // Mettre à jour les statistiques d'or dépensé
                    gameStats.goldSpent += item.price;
                gameStats.unitsPurchased.push({
                    name: item.name,
                    price: item.price,
                    rarity: item.rarity
                });
                    return true;
                }
                break;
            case 'bonus':
                if (gameState.unlockBonus(item.bonusId)) {
                    // Mettre à jour les statistiques d'or dépensé
                    gameStats.goldSpent += item.price;
                gameStats.bonusesPurchased.push({
                    id: item.bonusId,
                    price: item.price,
                    rarity: item.rarity
                });
                    return true;
                }
                break;
        }
        
        return false;
    }

    // Simuler la phase de combat
    simulateCombatPhase(gameState, gameStats, round) {
        console.log(`⚔️ Phase de combat - Rang: ${gameState.rank}`);
        
        // Démarrer un nouveau combat
        gameState.startNewCombat();
        
        // Sélectionner les meilleures troupes
        const selectedTroops = this.selectBestTroops(gameState);
        
        // Simuler le combat
        const combatResult = this.simulateCombat(gameState, gameStats, round);
        
        // Mettre à jour les statistiques
        this.updateGameStats(gameState, gameStats);
        
        return combatResult;
    }

    // Sélectionner les meilleures troupes
    selectBestTroops(gameState) {
        const availableTroops = gameState.combatTroops;
        const selectedTroops = [];
        
        console.log(`📋 Troupes disponibles: ${availableTroops.length}`);
        availableTroops.forEach((troop, index) => {
            console.log(`  ${index + 1}. ${troop.name} - 💥${troop.damage} ×⚡${troop.multiplier} = ${troop.damage * troop.multiplier} puissance`);
        });
        
        // Trier par puissance (dégâts × multiplicateur)
        const sortedTroops = availableTroops.sort((a, b) => 
            (b.damage * b.multiplier) - (a.damage * a.multiplier)
        );
        
        console.log(`\n🏆 Troupes triées par puissance:`);
        sortedTroops.forEach((troop, index) => {
            console.log(`  ${index + 1}. ${troop.name} - 💥${troop.damage} ×⚡${troop.multiplier} = ${troop.damage * troop.multiplier} puissance`);
        });
        
        // Sélectionner jusqu'à 5 troupes (pour avoir plus de synergies)
        const maxTroops = Math.min(5, sortedTroops.length);
        for (let i = 0; i < maxTroops; i++) {
            selectedTroops.push(sortedTroops[i]);
        }
        
        // Mettre à jour les troupes sélectionnées dans le gameState
        gameState.selectedTroops = selectedTroops;
        
        console.log(`\n⚔️ TROUPES SÉLECTIONNÉES (${selectedTroops.length}/5):`);
        selectedTroops.forEach((troop, index) => {
            console.log(`  ${index + 1}. ${troop.name} - 💥${troop.damage} ×⚡${troop.multiplier} = ${troop.damage * troop.multiplier} puissance`);
        });
        
        // Calculer la puissance totale
        const totalPower = selectedTroops.reduce((sum, troop) => sum + (troop.damage * troop.multiplier), 0);
        console.log(`💪 Puissance totale de l'équipe: ${totalPower}`);
        
        return selectedTroops;
    }

    // Calculer les dégâts de combat (utilise la fonction du jeu de base)
    calculateCombatDamage(gameState, troops) {
        console.log(`⚔️ Calcul des dégâts pour ${troops.length} troupes`);
        
        // Afficher les troupes utilisées
        console.log(`🎯 Troupes utilisées dans ce tour:`);
        troops.forEach((troop, index) => {
            console.log(`  ${index + 1}. ${troop.name} - 💥${troop.damage} ×⚡${troop.multiplier} = ${troop.damage * troop.multiplier} puissance`);
        });
        
        // Calculer les synergies actives
        const synergies = gameState.calculateSynergies(troops);
        if (synergies && synergies.length > 0) {
            console.log(`🔗 Synergies actives:`);
            synergies.forEach(synergy => {
                console.log(`  • ${synergy.name}: ${synergy.description}`);
            });
        } else {
            console.log(`❌ Aucune synergie active`);
        }
        
        // Calculer les bonus d'équipement
        const equipmentBonuses = gameState.calculateEquipmentBonuses();
        if (equipmentBonuses && equipmentBonuses.length > 0) {
            console.log(`🎁 Bonus d'équipement actifs:`);
            equipmentBonuses.forEach(bonus => {
                let bonusText = `${bonus.name}: `;
                if (bonus.damage) bonusText += `+${bonus.damage} dégâts `;
                if (bonus.multiplier) bonusText += `+${bonus.multiplier} multiplicateur `;
                if (bonus.target !== 'all') bonusText += `(${bonus.target})`;
                console.log(`  • ${bonusText}`);
            });
        } else {
            console.log(`❌ Aucun bonus d'équipement actif`);
        }
        
        // Utiliser la fonction du jeu de base
        const turnDamage = gameState.combatManager.calculateTurnDamage(troops);
        
        console.log(`💥 DÉGÂTS FINAUX: ${turnDamage}`);
        
        // Retourner les dégâts ET les synergies/bonus pour le HTML
        return {
            damage: turnDamage,
            synergies: synergies || [],
            bonuses: equipmentBonuses || []
        };
    }

    // Calculer la récompense de victoire
    calculateVictoryReward(gameState) {
        const baseReward = 59; // Augmenté de 18% (50 * 1.18 = 59)
        const wealthBonus = gameState.calculateWealthBonus();
        const equipmentGoldBonus = gameState.calculateEquipmentGoldBonus();
        
        return baseReward + wealthBonus + equipmentGoldBonus;
    }

    // Mettre à jour les statistiques de jeu
    updateGameStats(gameState, gameStats) {
        // Enregistrer les synergies utilisées
        const synergies = gameState.calculateSynergies();
        if (synergies && Array.isArray(synergies)) {
            synergies.forEach(synergy => {
                if (!gameStats.synergiesUsed.includes(synergy.name)) {
                    gameStats.synergiesUsed.push(synergy.name);
                    console.log(`🔗 Synergie détectée: ${synergy.name} - ${synergy.description}`);
                }
            });
        }
        
        // Enregistrer les synergies des troupes sélectionnées
        if (gameState.selectedTroops && gameState.selectedTroops.length > 0) {
            const troopSynergies = gameState.calculateSynergies(gameState.selectedTroops);
            if (troopSynergies && Array.isArray(troopSynergies)) {
                troopSynergies.forEach(synergy => {
                    if (!gameStats.synergiesUsed.includes(synergy.name)) {
                        gameStats.synergiesUsed.push(synergy.name);
                        console.log(`🔗 Synergie des troupes sélectionnées: ${synergy.name} - ${synergy.description}`);
                    }
                });
            }
        }
        
        // Enregistrer les synergies des troupes de combat
        if (gameState.combatTroops && gameState.combatTroops.length > 0) {
            const combatSynergies = gameState.calculateSynergies(gameState.combatTroops);
            if (combatSynergies && Array.isArray(combatSynergies)) {
                combatSynergies.forEach(synergy => {
                    if (!gameStats.synergiesUsed.includes(synergy.name)) {
                        gameStats.synergiesUsed.push(synergy.name);
                        console.log(`🔗 Synergie des troupes de combat: ${synergy.name} - ${synergy.description}`);
                    }
                });
            }
        }
        
        console.log(`📊 Synergies totales: ${gameStats.synergiesUsed.join(', ')}`);
    }

    // Simuler plusieurs parties
    async simulateMultipleGames(count = 100, strategyName = 'balanced') {
        console.log(`🎯 Début de simulation de ${count} parties avec la stratégie: ${strategyName}`);
        
        const results = [];
        const startTime = Date.now();
        
        for (let i = 0; i < count; i++) {
            if (i % 10 === 0) {
                console.log(`📊 Progression: ${i}/${count} parties simulées`);
            }
            
            const result = await this.simulateGame(strategyName);
            results.push(result);
        }
        
        const totalTime = Date.now() - startTime;
        console.log(`✅ Simulation terminée en ${(totalTime / 1000).toFixed(2)}s`);
        
        // Sauvegarder les résultats pour l'export
        this.lastResults = results;
        const analysis = this.analyzeResults(results);
        this.lastAnalysis = analysis;
        
        return analysis;
    }

    // Analyser les résultats
    analyzeResults(results) {
        const analysis = {
            totalGames: results.length,
            wins: results.filter(r => r.victory).length,
            losses: results.filter(r => !r.victory).length,
            winRate: 0,
            averageRank: 'F-',
            averageGoldSpent: 0,
            averageGoldEarned: 0,
            averageRounds: 0,
            rankDistribution: {},
            mostUsedUnits: {},
            mostUsedBonuses: {},
            mostUsedSynergies: {},
            averageGameDuration: 0,
            roundDetails: [] // Ajouter les détails des rounds
        };
        
        // Calculer les statistiques
        analysis.winRate = (analysis.wins / analysis.totalGames) * 100;
        
        // Rangs moyens
        const rankValues = results.map(r => this.rankToNumber(r.finalRank));
        const averageRankValue = rankValues.reduce((a, b) => a + b, 0) / rankValues.length;
        analysis.averageRank = this.numberToRank(averageRankValue);
        
        // Or dépensé et gagné moyens
        analysis.averageGoldSpent = results.reduce((sum, r) => sum + (r.goldSpent || 0), 0) / results.length;
        analysis.averageGoldEarned = results.reduce((sum, r) => sum + (r.goldEarned || 0), 0) / results.length;
        
        // Rounds moyens
        analysis.averageRounds = results.reduce((sum, r) => sum + r.rounds, 0) / results.length;
        
        // Distribution des rangs
        results.forEach(r => {
            analysis.rankDistribution[r.finalRank] = (analysis.rankDistribution[r.finalRank] || 0) + 1;
        });
        
        // Unités les plus utilisées
        results.forEach(r => {
            if (r.unitsPurchased && Array.isArray(r.unitsPurchased)) {
                r.unitsPurchased.forEach(unit => {
                    if (unit && unit.name) {
                        analysis.mostUsedUnits[unit.name] = (analysis.mostUsedUnits[unit.name] || 0) + 1;
                    }
                });
            }
        });
        
        // Bonus les plus utilisés
        results.forEach(r => {
            if (r.bonusesPurchased && Array.isArray(r.bonusesPurchased)) {
                r.bonusesPurchased.forEach(bonus => {
                    if (bonus && bonus.id) {
                        analysis.mostUsedBonuses[bonus.id] = (analysis.mostUsedBonuses[bonus.id] || 0) + 1;
                    }
                });
            }
        });
        
        // Synergies les plus utilisées
        results.forEach(r => {
            if (r.synergiesUsed && Array.isArray(r.synergiesUsed)) {
                r.synergiesUsed.forEach(synergy => {
                    if (synergy) {
                        analysis.mostUsedSynergies[synergy] = (analysis.mostUsedSynergies[synergy] || 0) + 1;
                    }
                });
            }
        });
        
        // Durée moyenne
        analysis.averageGameDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
        
        // Collecter les détails des rounds (prendre le premier résultat comme exemple)
        if (results.length > 0 && results[0].roundDetails) {
            analysis.roundDetails = results[0].roundDetails;
        }
        
        return analysis;
    }

    // Convertir un rang en nombre pour les calculs
    rankToNumber(rank) {
        return RANKS.indexOf(rank);
    }

    // Convertir un nombre en rang
    numberToRank(number) {
        const index = Math.floor(number);
        return RANKS[Math.max(0, Math.min(index, RANKS.length - 1))];
    }

    // Générer un rapport complet
    generateReport(analysis) {
        const report = {
            summary: {
                totalGames: analysis.totalGames,
                winRate: `${analysis.winRate.toFixed(2)}%`,
                averageRank: analysis.averageRank,
                averageGoldSpent: Math.floor(analysis.averageGoldSpent),
                averageGoldEarned: Math.floor(analysis.averageGoldEarned),
                averageRounds: Math.floor(analysis.averageRounds),
                averageDuration: `${(analysis.averageGameDuration / 1000).toFixed(2)}s`
            },
            rankDistribution: analysis.rankDistribution,
            topUnits: this.getTopItems(analysis.mostUsedUnits, 10),
            topBonuses: this.getTopItems(analysis.mostUsedBonuses, 10),
            topSynergies: this.getTopItems(analysis.mostUsedSynergies, 10)
        };
        
        return report;
    }

    // Obtenir les items les plus populaires
    getTopItems(items, count) {
        return Object.entries(items)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, count);
    }

    // Afficher le rapport dans la console
    displayReport(report) {
        console.log('\n📊 RAPPORT DE SIMULATION');
        console.log('========================');
        console.log(`🎮 Parties simulées: ${report.summary.totalGames}`);
        console.log(`🏆 Taux de victoire: ${report.summary.winRate}`);
        console.log(`📈 Rang moyen: ${report.summary.averageRank}`);
        console.log(`💰 Or dépensé moyen: ${report.summary.averageGoldSpent}`);
        console.log(`💎 Or gagné moyen: ${report.summary.averageGoldEarned}`);
        console.log(`🔄 Rounds moyens: ${report.summary.averageRounds}`);
        console.log(`⏱️ Durée moyenne: ${report.summary.averageDuration}`);
        
        console.log('\n📊 DISTRIBUTION DES RANGS:');
        // Afficher tous les rangs possibles, même ceux avec 0 parties
        const allRanks = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];
        allRanks.forEach(rank => {
            const count = report.rankDistribution[rank] || 0;
            const percentage = ((count / report.summary.totalGames) * 100).toFixed(1);
            const bar = '█'.repeat(Math.floor(count / report.summary.totalGames * 20));
            console.log(`  ${rank}: ${count} parties (${percentage}%) ${bar}`);
            });
        
        console.log('\n⚔️ UNITÉS LES PLUS UTILISÉES:');
        report.topUnits.forEach((unit, index) => {
            console.log(`  ${index + 1}. ${unit.name}: ${unit.count} fois`);
        });
        
        console.log('\n🎁 BONUS LES PLUS UTILISÉS:');
        report.topBonuses.forEach((bonus, index) => {
            console.log(`  ${index + 1}. ${bonus.name}: ${bonus.count} fois`);
        });
        
        console.log('\n🔗 SYNERGIES LES PLUS UTILISÉES:');
        report.topSynergies.forEach((synergy, index) => {
            console.log(`  ${index + 1}. ${synergy.name}: ${synergy.count} fois`);
        });
        
        // Afficher les détails de chaque round si disponibles
        if (report.roundDetails && report.roundDetails.length > 0) {
            console.log('\n📋 DÉTAILS PAR ROUND:');
            report.roundDetails.forEach((roundDetail, index) => {
                console.log(`\n🔄 Round ${roundDetail.round} - Tour ${roundDetail.tour}:`);
                console.log(`  💥 Dégâts infligés: ${roundDetail.damage}`);
                
                console.log(`  ⚔️ Unités utilisées:`);
                roundDetail.units.forEach((unit, unitIndex) => {
                    console.log(`    ${unitIndex + 1}. ${unit.name} - 💥${unit.damage} ×⚡${unit.multiplier} (${Array.isArray(unit.type) ? unit.type.join(', ') : unit.type})`);
                });
                
                if (roundDetail.synergies.length > 0) {
                    console.log(`  🔗 Synergies actives:`);
                    roundDetail.synergies.forEach((synergy, synergyIndex) => {
                        console.log(`    ${synergyIndex + 1}. ${synergy.name}: ${synergy.description}`);
                    });
                } else {
                    console.log(`  ❌ Aucune synergie active`);
                }
                
                if (roundDetail.bonuses.length > 0) {
                    console.log(`  🎁 Bonus d'équipement actifs:`);
                    roundDetail.bonuses.forEach((bonus, bonusIndex) => {
                        let bonusText = `${bonus.name}: `;
                        if (bonus.damage) bonusText += `+${bonus.damage} dégâts `;
                        if (bonus.multiplier) bonusText += `+${bonus.multiplier} multiplicateur `;
                        if (bonus.target !== 'all') bonusText += `(${bonus.target})`;
                        console.log(`    ${bonusIndex + 1}. ${bonusText}`);
                    });
                } else {
                    console.log(`  ❌ Aucun bonus d'équipement actif`);
                }
            });
        }
        
        console.log('\n========================');
        
        // Ajouter un bouton d'export des résultats
        console.log('\n💾 Pour exporter les résultats, utilisez:');
        console.log('simulator.exportResults()');
    }

    // Exporter les résultats en JSON
    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            simulationResults: this.lastResults || [],
            globalStats: this.lastAnalysis || {},
            exportInfo: {
                totalGames: this.lastResults ? this.lastResults.length : 0,
                isComparison: this.lastAnalysis && this.lastAnalysis.comparison,
                strategies: this.lastAnalysis && this.lastAnalysis.strategies ? Object.keys(this.lastAnalysis.strategies) : []
            }
        };
        
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        
        // Nom de fichier plus descriptif
        let filename = 'simulation_results';
        if (this.lastAnalysis && this.lastAnalysis.comparison) {
            filename = 'comparison_results';
        }
        filename += `_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        
        link.download = filename;
        link.click();
        
        console.log(`📁 Résultats exportés en JSON: ${filename}`);
        console.log(`📊 ${results.exportInfo.totalGames} parties exportées`);
        if (results.exportInfo.isComparison) {
            console.log(`🔬 Comparaison de ${results.exportInfo.strategies.length} stratégies`);
        }
        
        return results;
    }

    // Générer un rapport détaillé pour analyse
    generateDetailedReport() {
        if (!this.lastResults || this.lastResults.length === 0) {
            console.log('❌ Aucun résultat de simulation disponible');
            return null;
        }

        // Vérifier si c'est une comparaison
        if (this.lastAnalysis && this.lastAnalysis.comparison) {
            return this.generateComparisonReport();
        }

        const report = {
            summary: {
                totalGames: this.lastResults.length,
                averageGoldSpent: this.lastAnalysis.averageGoldSpent,
                averageGoldEarned: this.lastAnalysis.averageGoldEarned,
                averageRounds: this.lastAnalysis.averageRounds,
                winRate: this.lastAnalysis.winRate,
                averageRank: this.lastAnalysis.averageRank
            },
            economyAnalysis: {
                goldEfficiency: this.lastAnalysis.averageGoldEarned / this.lastAnalysis.averageGoldSpent,
                averageGoldPerRound: this.lastAnalysis.averageGoldEarned / this.lastAnalysis.averageRounds,
                spendingPattern: this.analyzeSpendingPattern()
            },
            performanceAnalysis: {
                rankDistribution: this.lastAnalysis.rankDistribution,
                topUnits: this.lastAnalysis.topUnits,
                topBonuses: this.lastAnalysis.topBonuses,
                topSynergies: this.lastAnalysis.topSynergies
            },
            recommendations: this.generateRecommendations()
        };

        console.log('\n📊 RAPPORT DÉTAILLÉ POUR ANALYSE');
        console.log('==================================');
        console.log(JSON.stringify(report, null, 2));
        
        return report;
    }

    // Générer un rapport de comparaison
    generateComparisonReport() {
        const report = {
            summary: {
                totalGames: this.lastResults.length,
                isComparison: true,
                strategies: Object.keys(this.lastAnalysis.strategies)
            },
            strategyAnalysis: {},
            overallAnalysis: {
                bestStrategy: null,
                worstStrategy: null,
                averageWinRate: 0,
                averageGoldEfficiency: 0
            },
            recommendations: this.generateComparisonRecommendations()
        };

        // Analyser chaque stratégie
        Object.entries(this.lastAnalysis.strategies).forEach(([strategyKey, strategyData]) => {
            const strategyResults = this.lastResults.filter(result => result.strategy === strategyKey);
            
            report.strategyAnalysis[strategyKey] = {
                name: this.strategies[strategyKey].name,
                totalGames: strategyResults.length,
                winRate: parseFloat(strategyData.summary.winRate),
                averageRank: strategyData.summary.averageRank,
                averageGoldSpent: strategyData.summary.averageGoldSpent,
                averageGoldEarned: strategyData.summary.averageGoldEarned,
                averageRounds: strategyData.summary.averageRounds,
                goldEfficiency: strategyData.summary.averageGoldEarned / strategyData.summary.averageGoldSpent,
                rankDistribution: strategyData.rankDistribution
            };
        });

        // Trouver la meilleure et la pire stratégie
        const strategies = Object.entries(report.strategyAnalysis);
        const bestStrategy = strategies.reduce((best, current) => 
            current[1].winRate > best[1].winRate ? current : best
        );
        const worstStrategy = strategies.reduce((worst, current) => 
            current[1].winRate < worst[1].winRate ? current : worst
        );

        report.overallAnalysis.bestStrategy = bestStrategy[0];
        report.overallAnalysis.worstStrategy = worstStrategy[0];
        report.overallAnalysis.averageWinRate = strategies.reduce((sum, [, data]) => sum + data.winRate, 0) / strategies.length;
        report.overallAnalysis.averageGoldEfficiency = strategies.reduce((sum, [, data]) => sum + data.goldEfficiency, 0) / strategies.length;

        console.log('\n🔬 RAPPORT DE COMPARAISON DÉTAILLÉ');
        console.log('==================================');
        console.log(JSON.stringify(report, null, 2));
        
        return report;
    }

    // Générer des recommandations pour les comparaisons
    generateComparisonRecommendations() {
        const recommendations = [];
        
        if (!this.lastAnalysis || !this.lastAnalysis.comparison) return recommendations;

        const strategies = Object.entries(this.lastAnalysis.strategies);
        const bestStrategy = strategies.reduce((best, current) => 
            parseFloat(current[1].summary.winRate) > parseFloat(best[1].summary.winRate) ? current : best
        );
        const worstStrategy = strategies.reduce((worst, current) => 
            parseFloat(current[1].summary.winRate) < parseFloat(worst[1].summary.winRate) ? current : worst
        );

        recommendations.push({
            type: 'performance',
            issue: 'Meilleure stratégie identifiée',
            description: `${this.strategies[bestStrategy[0]].name} avec ${bestStrategy[1].summary.winRate}% de victoires`,
            suggestion: 'Utiliser cette stratégie comme référence pour l\'équilibrage'
        });

        recommendations.push({
            type: 'improvement',
            issue: 'Stratégie à améliorer',
            description: `${this.strategies[worstStrategy[0]].name} avec ${worstStrategy[1].summary.winRate}% de victoires`,
            suggestion: 'Analyser pourquoi cette stratégie performe moins bien'
        });

        // Analyser l'écart de performance
        const winRateGap = parseFloat(bestStrategy[1].summary.winRate) - parseFloat(worstStrategy[1].summary.winRate);
        if (winRateGap > 20) {
            recommendations.push({
                type: 'balance',
                issue: 'Écart de performance important',
                description: `${winRateGap.toFixed(1)}% d\'écart entre la meilleure et la pire stratégie`,
                suggestion: 'Réduire l\'écart pour un meilleur équilibrage'
            });
        }

        return recommendations;
    }

    // Analyser les patterns de dépenses
    analyzeSpendingPattern() {
        if (!this.lastResults) return {};
        
        const patterns = {
            averageSpendingPerRound: 0,
            spendingByRound: {},
            mostExpensiveRounds: [],
            roundsWithNoSpending: 0
        };

        this.lastResults.forEach(result => {
            if (result.rounds > 0) {
                patterns.averageSpendingPerRound += result.goldSpent / result.rounds;
            }
        });

        patterns.averageSpendingPerRound /= this.lastResults.length;
        return patterns;
    }

    // Générer des recommandations basées sur les résultats
    generateRecommendations() {
        const recommendations = [];
        
        if (!this.lastAnalysis) return recommendations;

        // Analyser l'efficacité économique
        const goldEfficiency = this.lastAnalysis.averageGoldEarned / this.lastAnalysis.averageGoldSpent;
        if (goldEfficiency < 1) {
            recommendations.push({
                type: 'economy',
                issue: 'Efficacité économique faible',
                description: `Or dépensé (${this.lastAnalysis.averageGoldSpent}) > Or gagné (${this.lastAnalysis.averageGoldEarned})`,
                suggestion: 'Réduire les achats ou améliorer les stratégies de combat'
            });
        }

        // Analyser le taux de victoire
        if (this.lastAnalysis.winRate < 50) {
            recommendations.push({
                type: 'performance',
                issue: 'Taux de victoire faible',
                description: `Seulement ${this.lastAnalysis.winRate.toFixed(1)}% de victoires`,
                suggestion: 'Améliorer les stratégies d\'achat ou équilibrer les unités'
            });
        }

        // Analyser les rangs moyens
        const rankValue = this.rankToNumber(this.lastAnalysis.averageRank);
        if (rankValue < 5) { // Moins que E
            recommendations.push({
                type: 'progression',
                issue: 'Progression lente',
                description: `Rang moyen: ${this.lastAnalysis.averageRank}`,
                suggestion: 'Optimiser les achats pour améliorer la puissance de combat'
            });
        }

        return recommendations;
    }

    // Comparer plusieurs stratégies
    async compareStrategies(gamesPerStrategy = 50) {
        console.log('🔬 Comparaison des stratégies...');
        
        const strategies = Object.keys(this.strategies);
        const results = {};
        const allSimulationResults = []; // Stocker tous les résultats individuels
        
        for (const strategy of strategies) {
            console.log(`\n📊 Test de la stratégie: ${this.strategies[strategy].name}`);
            const analysis = await this.simulateMultipleGames(gamesPerStrategy, strategy);
            results[strategy] = this.generateReport(analysis);
            
            // Ajouter tous les résultats de cette stratégie
            if (this.lastResults) {
                this.lastResults.forEach(result => {
                    allSimulationResults.push({
                        ...result,
                        strategy: strategy,
                        strategyName: this.strategies[strategy].name
                    });
                });
            }
        }
        
        // Sauvegarder tous les résultats pour l'export
        this.lastResults = allSimulationResults;
        this.lastAnalysis = {
            totalGames: allSimulationResults.length,
            strategies: results,
            comparison: true
        };
        
        this.displayStrategyComparison(results);
        return results;
    }

    // Afficher la comparaison des stratégies
    displayStrategyComparison(results) {
        console.log('\n🏆 COMPARAISON DES STRATÉGIES');
        console.log('=============================');
        
        Object.entries(results).forEach(([strategy, report]) => {
            console.log(`\n📊 ${this.strategies[strategy].name}:`);
            console.log(`  Taux de victoire: ${report.summary.winRate}`);
            console.log(`  Rang moyen: ${report.summary.averageRank}`);
            console.log(`  Or dépensé moyen: ${report.summary.averageGoldSpent}`);
            console.log(`  Rounds moyens: ${report.summary.averageRounds}`);
            
            // Afficher la distribution des rangs pour cette stratégie
            console.log(`  📊 Distribution des rangs:`);
            const allRanks = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];
            allRanks.forEach(rank => {
                const count = report.rankDistribution[rank] || 0;
                if (count > 0) {
                    const percentage = ((count / report.summary.totalGames) * 100).toFixed(1);
                    const bar = '█'.repeat(Math.floor(count / report.summary.totalGames * 15));
                    console.log(`    ${rank}: ${count} parties (${percentage}%) ${bar}`);
                }
            });
        });
        
        console.log('\n=============================');
    }

    // Simuler un combat
    simulateCombat(gameState, gameStats, round) {
        // S'assurer qu'on a les bonnes troupes sélectionnées
        const selectedTroops = this.selectBestTroops(gameState);
        
        if (selectedTroops.length === 0) {
            console.log('❌ Aucune troupe sélectionnée pour le combat');
            return false;
        }
        
        // Debug: vérifier les troupes sélectionnées
        console.log(`🔍 DEBUG - Troupes sélectionnées: ${selectedTroops.length}`);
        selectedTroops.forEach((troop, index) => {
            console.log(`  ${index + 1}. ${troop.name} - 💥${troop.damage} ×⚡${troop.multiplier} = ${troop.damage * troop.multiplier} puissance`);
        });

        console.log(`\n🔄 TOUR ${gameState.currentCombat.round + 1}/${gameState.currentCombat.maxRounds}`);
        console.log(`🎯 Objectif: ${gameState.currentCombat.targetDamage} dégâts`);
        console.log(`📊 Progression: ${gameState.currentCombat.totalDamage}/${gameState.currentCombat.targetDamage} (${((gameState.currentCombat.totalDamage / gameState.currentCombat.targetDamage) * 100).toFixed(1)}%)`);

        // Collecter les informations du tour (format identique à la console)
        const tourInfo = {
            round: round,
            tour: gameState.currentCombat.round + 1,
            damage: 0,
            units: [],
            synergies: [],
            bonuses: []
        };

        // Créer une copie des troupes avant de les utiliser
        const troopsCopy = selectedTroops.map(troop => ({...troop}));
        
        // Calculer les dégâts et collecter les infos comme dans la console
        const roundDamage = gameState.combatManager.calculateTurnDamage(troopsCopy);
        tourInfo.damage = roundDamage;
        // Pour la cohérence, on peut aussi récupérer synergies/bonus si besoin :
        const combatResult = this.calculateCombatDamage(gameState, troopsCopy);
        
        // Collecter les unités avec leur puissance (comme dans la console)
        // Utiliser les mêmes troupes que celles utilisées dans calculateCombatDamage
        tourInfo.units = troopsCopy.map((troop, index) => ({
            name: troop.name,
            damage: troop.damage,
            multiplier: troop.multiplier,
            power: troop.damage * troop.multiplier,
            type: troop.type
        }));
        
        // Debug: vérifier que les troupes correspondent à celles de la console
        console.log(`🔍 DEBUG - Troupes collectées pour HTML: ${tourInfo.units.length}`);
        tourInfo.units.forEach((unit, index) => {
            console.log(`  ${index + 1}. ${unit.name} - 💥${unit.damage} ×⚡${unit.multiplier} = ${unit.power} puissance`);
        });
        
        // Collecter les synergies (exactement comme dans la console)
        tourInfo.synergies = combatResult.synergies.map(synergy => ({
            name: synergy.name,
            description: synergy.description
        }));
        
        // Collecter les bonus d'équipement (exactement comme dans la console)
        tourInfo.bonuses = combatResult.bonuses.map(bonus => ({
            name: bonus.name,
            damage: bonus.damage,
            multiplier: bonus.multiplier,
            target: bonus.target
        }));
        
        // Appliquer les dégâts au combat
        gameState.currentCombat.totalDamage += combatResult.damage;
        gameState.currentCombat.round++;
        
        console.log(`💥 Dégâts infligés: ${combatResult.damage}`);
        console.log(`📈 Nouvelle progression: ${gameState.currentCombat.totalDamage}/${gameState.currentCombat.targetDamage} (${((gameState.currentCombat.totalDamage / gameState.currentCombat.targetDamage) * 100).toFixed(1)}%)`);
        
        // === CORRECTION : Retirer les troupes utilisées après chaque tour ===
        if (selectedTroops.length > 0) {
            // Retirer les troupes utilisées du combat
            selectedTroops.forEach(troop => {
                const index = gameState.combatTroops.findIndex(t => t.name === troop.name);
                if (index !== -1) {
                    gameState.combatTroops.splice(index, 1);
                }
            });
            // Re-sélectionner les meilleures troupes pour le prochain tour
            this.selectBestTroops(gameState);
        }
        // ================================================================
        
        // Vérifier la victoire
        if (gameState.currentCombat.totalDamage >= gameState.currentCombat.targetDamage) {
            console.log('🎉 VICTOIRE!');
            
            // Calculer et ajouter les récompenses
            const reward = this.calculateVictoryReward(gameState);
            gameState.addGold(reward);
            gameState.gameStats.goldEarned += reward;
            
            console.log(`💰 Récompense: +${reward} or`);
            
            // Terminer le combat
            gameState.endCombat(true);
            
            // Ajouter les détails du tour à la liste
            gameStats.roundDetails.push(tourInfo);
            
            return true;
        }
        
        // Vérifier la défaite (trop de rounds)
        if (gameState.currentCombat.round >= gameState.currentCombat.maxRounds) {
            console.log('❌ DÉFAITE - Trop de rounds');
            gameState.endCombat(false);
            
            // Ajouter les détails du tour à la liste
            gameStats.roundDetails.push(tourInfo);
            
            return false;
        }
        
        // Ajouter les détails du tour à la liste
        gameStats.roundDetails.push(tourInfo);
        
        // Continuer le combat
        return this.simulateCombat(gameState, gameStats, round);
    }
} 