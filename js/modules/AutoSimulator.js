// Simulateur automatique pour GuildMaster
import { RANKS } from './GameConstants.js';
import { removeUsedTroopsFromCombat, drawCombatTroops, calculateSynergies } from './UnitManager.js';

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

            // Phase 1: Achat au magasin
            this.simulateShopPhase(gameState, gameStats, strategyName);

            // Phase 2: Combat
            const combatResult = this.simulateCombatPhase(gameState, gameStats, round);
            if (!combatResult) {
                console.log(`❌ Défaite au round ${round}`);
                break;
            }

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

        console.log(`✅ Simulation terminée - Rang final: ${gameStats.finalRank}, Rounds: ${gameStats.rounds}`);
        
        return gameStats;
    }

    // Créer un gameState pour la simulation
    async createGameState() {
        // Importer dynamiquement pour éviter les dépendances circulaires
        const { GameState } = await import('./GameState.js');
        return new GameState();
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
        for (const priority of priorities) {
            const matchingItems = shopItems.filter(item => {
                if (priority.type !== item.type) return false;
                if (priority.bonusId && item.bonusId !== priority.bonusId) return false;
                if (priority.rarity && item.rarity !== priority.rarity) return false;
                return true;
            });

            for (const item of matchingItems) {
                if (this.purchaseItem(item, gameState, gameStats)) {
                    console.log(`💰 Achat: ${item.name} (${item.price} or)`);
                }
            }
        }
    }

    // Générer les items du magasin
    generateShopItems(gameState) {
        const items = [];
        
        // Générer des unités aléatoires
        const unitPool = this.getUnitPool();
        for (let i = 0; i < 3; i++) {
            const unit = unitPool[Math.floor(Math.random() * unitPool.length)];
            items.push({
                type: 'unit',
                name: unit.name,
                price: unit.price || 30,
                rarity: unit.rarity || 'common',
                damage: unit.damage,
                multiplier: unit.multiplier
            });
        }

        // Générer des bonus aléatoires
        const bonusPool = this.getBonusPool();
        for (let i = 0; i < 2; i++) {
            const bonus = bonusPool[Math.floor(Math.random() * bonusPool.length)];
            items.push({
                type: 'bonus',
                bonusId: bonus.id,
                name: bonus.name,
                price: bonus.price,
                rarity: bonus.rarity
            });
        }

        return items;
    }

    // Pool d'unités pour le magasin
    getUnitPool() {
        return [
            { name: 'Guerrier', damage: 8, multiplier: 2, price: 25, rarity: 'common' },
            { name: 'Archer', damage: 6, multiplier: 3, price: 30, rarity: 'common' },
            { name: 'Mage', damage: 10, multiplier: 1, price: 35, rarity: 'common' },
            { name: 'Paladin', damage: 12, multiplier: 2, price: 50, rarity: 'uncommon' },
            { name: 'Ranger', damage: 8, multiplier: 4, price: 55, rarity: 'uncommon' },
            { name: 'Sorcier', damage: 15, multiplier: 1, price: 60, rarity: 'uncommon' },
            { name: 'Chevalier', damage: 18, multiplier: 2, price: 80, rarity: 'rare' },
            { name: 'Assassin', damage: 12, multiplier: 5, price: 85, rarity: 'rare' },
            { name: 'Archimage', damage: 25, multiplier: 1, price: 90, rarity: 'rare' },
            { name: 'Dragon Knight', damage: 30, multiplier: 3, price: 150, rarity: 'epic' },
            { name: 'Shadow Walker', damage: 20, multiplier: 6, price: 160, rarity: 'epic' },
            { name: 'Grand Mage', damage: 40, multiplier: 2, price: 170, rarity: 'epic' },
            { name: 'Titan', damage: 50, multiplier: 4, price: 300, rarity: 'legendary' },
            { name: 'Void Walker', damage: 35, multiplier: 8, price: 320, rarity: 'legendary' },
            { name: 'Archmage Supreme', damage: 60, multiplier: 3, price: 350, rarity: 'legendary' }
        ];
    }

    // Pool de bonus pour le magasin
    getBonusPool() {
        return [
            { id: 'gold_bonus', name: 'Bonus Or', price: 30, rarity: 'common' },
            { id: 'corps_a_corps_bonus', name: 'Bonus Corps à corps', price: 30, rarity: 'common' },
            { id: 'distance_bonus', name: 'Bonus Distance', price: 30, rarity: 'common' },
            { id: 'magique_bonus', name: 'Bonus Magique', price: 30, rarity: 'common' },
            { id: 'epee_aiguisee', name: 'Épée Aiguisée', price: 25, rarity: 'common' },
            { id: 'arc_renforce', name: 'Arc Renforcé', price: 25, rarity: 'common' },
            { id: 'grimoire_magique', name: 'Grimoire Magique', price: 25, rarity: 'common' },
            { id: 'amulette_force', name: 'Amulette de Force', price: 40, rarity: 'uncommon' },
            { id: 'cristal_precision', name: 'Cristal de Précision', price: 40, rarity: 'uncommon' },
            { id: 'orbe_mystique', name: 'Orbe Mystique', price: 40, rarity: 'uncommon' },
            { id: 'potion_force', name: 'Potion de Force', price: 40, rarity: 'uncommon' },
            { id: 'elixir_puissance', name: 'Élixir de Puissance', price: 40, rarity: 'uncommon' },
            { id: 'armure_legendaire', name: 'Armure Légendaire', price: 60, rarity: 'rare' },
            { id: 'arc_divin', name: 'Arc Divin', price: 60, rarity: 'rare' },
            { id: 'baguette_supreme', name: 'Baguette Suprême', price: 60, rarity: 'rare' },
            { id: 'relique_ancienne', name: 'Relique Ancienne', price: 100, rarity: 'legendary' }
        ];
    }

    // Acheter un item
    purchaseItem(item, gameState, gameStats) {
        // Ne jamais acheter de consommables dans les simulations
        if (item.type === 'consumable') {
            return false;
        }
        
        if (gameState.gold < item.price) return false;
        
        gameState.spendGold(item.price);
        gameStats.goldSpent += item.price;
        
        switch (item.type) {
            case 'unit':
                gameState.shopManager.purchaseUnit(item.name, gameState);
                gameStats.unitsPurchased.push({
                    name: item.name,
                    price: item.price,
                    rarity: item.rarity
                });
                break;
            case 'bonus':
                gameState.unlockBonus(item.bonusId);
                gameStats.bonusesPurchased.push({
                    id: item.bonusId,
                    price: item.price,
                    rarity: item.rarity
                });
                break;
        }
        
        return true;
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
        const turnDamage = gameState.calculateTurnDamage(troops);
        
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
        const baseReward = 50;
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
        
        return this.analyzeResults(results);
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
        analysis.averageGoldSpent = results.reduce((sum, r) => sum + r.goldSpent, 0) / results.length;
        analysis.averageGoldEarned = results.reduce((sum, r) => sum + r.goldEarned, 0) / results.length;
        
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
        Object.entries(report.rankDistribution)
            .sort((a, b) => this.rankToNumber(b[0]) - this.rankToNumber(a[0]))
            .forEach(([rank, count]) => {
                console.log(`  ${rank}: ${count} parties`);
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
    }

    // Comparer plusieurs stratégies
    async compareStrategies(gamesPerStrategy = 50) {
        console.log('🔬 Comparaison des stratégies...');
        
        const strategies = Object.keys(this.strategies);
        const results = {};
        
        for (const strategy of strategies) {
            console.log(`\n📊 Test de la stratégie: ${this.strategies[strategy].name}`);
            const analysis = await this.simulateMultipleGames(gamesPerStrategy, strategy);
            results[strategy] = this.generateReport(analysis);
        }
        
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
        const combatResult = this.calculateCombatDamage(gameState, troopsCopy);
        tourInfo.damage = combatResult.damage;
        
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
        gameState.currentCombat.totalDamage += damage;
        gameState.currentCombat.round++;
        
        console.log(`💥 Dégâts infligés: ${damage}`);
        console.log(`📈 Nouvelle progression: ${gameState.currentCombat.totalDamage}/${gameState.currentCombat.targetDamage} (${((gameState.currentCombat.totalDamage / gameState.currentCombat.targetDamage) * 100).toFixed(1)}%)`);
        
        // === CORRECTION : Retirer les troupes utilisées après chaque tour ===
        if (selectedTroops.length > 0) {
            removeUsedTroopsFromCombat(selectedTroops, gameState);
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