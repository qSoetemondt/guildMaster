// Interface utilisateur pour les simulations d'équilibrage
import { ModalManager } from './ModalManager.js';


export class SimulationUI {
    constructor(simulationEngine) {
        this.simulationEngine = simulationEngine;
        this.isRunning = false;
        this.progressCallback = null;
        this.init();
    }

    init() {
        this.createSimulationModal();
        this.bindEvents();
    }

    // Créer la modal de simulation
    createSimulationModal() {
        const modalHTML = `
            <div id="simulation-modal" class="modal">
                <div class="modal-content simulation-modal">
                    <div class="modal-header">
                        <h2>🎯 Simulateur d'Équilibrage</h2>
                        <button class="close-btn" onclick="ModalManager.hideModal('simulation-modal')">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Configuration de la simulation -->
                        <div class="simulation-config">
                            <h3>⚙️ Configuration</h3>
                            <div class="config-grid">
                                <div class="config-item">
                                    <label for="sim-games">Nombre de parties:</label>
                                    <input type="number" id="sim-games" value="100" min="10" max="10000">
                                </div>
                                <div class="config-item">
                                    <label for="sim-rounds">Tours max par partie:</label>
                                    <input type="number" id="sim-rounds" value="50" min="10" max="200">
                                </div>
                                <div class="config-item">
                                    <label for="sim-logging">Logs détaillés:</label>
                                    <input type="checkbox" id="sim-logging">
                                </div>
                            </div>
                        </div>

                        <!-- Contrôles de simulation -->
                        <div class="simulation-controls">
                            <button id="start-simulation" class="btn btn-primary">
                                🚀 Lancer la Simulation
                            </button>
                            <button id="stop-simulation" class="btn btn-danger" disabled>
                                ⏹️ Arrêter
                            </button>
                            <button id="export-results" class="btn btn-secondary" disabled>
                                📊 Exporter les Résultats
                            </button>
                        </div>

                        <!-- Progression -->
                        <div class="simulation-progress" style="display: none;">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <div class="progress-text">0%</div>
                            <div class="progress-details">
                                <span class="games-completed">0</span> / <span class="total-games">0</span> parties
                            </div>
                        </div>

                        <!-- Résultats -->
                        <div class="simulation-results" style="display: none;">
                            <h3>📊 Résultats de la Simulation</h3>
                            
                            <!-- Statistiques principales -->
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-value" id="win-rate">-</div>
                                    <div class="stat-label">Taux de Victoire</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="avg-rank">-</div>
                                    <div class="stat-label">Rang Moyen</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="avg-gold">-</div>
                                    <div class="stat-label">Or Moyen</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="avg-duration">-</div>
                                    <div class="stat-label">Durée Moyenne</div>
                                </div>
                            </div>

                            <!-- Distribution des rangs -->
                            <div class="results-section">
                                <h4>🏆 Distribution des Rangs</h4>
                                <div class="rank-chart" id="rank-chart"></div>
                            </div>

                            <!-- Unités les plus utilisées -->
                            <div class="results-section">
                                <h4>⚔️ Unités les Plus Utilisées</h4>
                                <div class="unit-stats" id="unit-stats"></div>
                            </div>

                            <!-- Synergies les plus utilisées -->
                            <div class="results-section">
                                <h4>🔗 Synergies les Plus Utilisées</h4>
                                <div class="synergy-stats" id="synergy-stats"></div>
                            </div>

                            <!-- Bonus les plus utilisés -->
                            <div class="results-section">
                                <h4>🎁 Bonus les Plus Utilisés</h4>
                                <div class="bonus-stats" id="bonus-stats"></div>
                            </div>

                            <!-- Consommables -->
                            <div class="results-section">
                                <h4>🧪 Statistiques des Consommables</h4>
                                <div class="consumable-stats" id="consumable-stats"></div>
                            </div>

                            <!-- Unités achetées -->
                            <div class="results-section">
                                <h4>🛒 Unités Achetées</h4>
                                <div class="purchased-units-stats" id="purchased-units-stats"></div>
                            </div>

                            <!-- Recommandations d'équilibrage -->
                            <div class="results-section">
                                <h4>💡 Recommandations d'Équilibrage</h4>
                                <div class="recommendations" id="recommendations"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Ajouter la modal au DOM si elle n'existe pas
        if (!document.getElementById('simulation-modal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    // Lier les événements
    bindEvents() {
        document.getElementById('start-simulation')?.addEventListener('click', () => {
            this.startSimulation();
        });

        document.getElementById('stop-simulation')?.addEventListener('click', () => {
            this.stopSimulation();
        });

        document.getElementById('export-results')?.addEventListener('click', () => {
            this.exportResults();
        });
    }

    // Démarrer la simulation
    async startSimulation() {
        if (this.isRunning) return;

        const config = this.getSimulationConfig();
        if (!config) return;

        this.isRunning = true;
        this.updateUIState('running');
        this.showProgress();

        try {
            // Configurer le callback de progression
            this.simulationEngine.progressCallback = (current, total) => {
                this.updateProgress(current, total);
            };

            // Lancer la simulation
            const results = await this.simulationEngine.runSimulation(config);
            
            // Afficher les résultats
            this.displayResults(results);
            this.updateUIState('completed');
            
        } catch (error) {
            console.error('Erreur lors de la simulation:', error);
            this.showError('Erreur lors de la simulation: ' + error.message);
            this.updateUIState('error');
        } finally {
            this.isRunning = false;
        }
    }

    // Arrêter la simulation
    stopSimulation() {
        this.isRunning = false;
        this.simulationEngine.progressCallback = null;
        this.updateUIState('stopped');
        this.hideProgress();
    }

    // Obtenir la configuration de la simulation
    getSimulationConfig() {
        const games = parseInt(document.getElementById('sim-games').value);
        const rounds = parseInt(document.getElementById('sim-rounds').value);
        const logging = document.getElementById('sim-logging').checked;

        if (games < 10 || games > 10000) {
            this.showError('Le nombre de parties doit être entre 10 et 10000');
            return null;
        }

        if (rounds < 10 || rounds > 200) {
            this.showError('Le nombre de tours doit être entre 10 et 200');
            return null;
        }

        return {
            numberOfGames: games,
            maxRounds: rounds,
            enableLogging: logging,
            saveDetailedLogs: logging
        };
    }

    // Mettre à jour l'état de l'interface
    updateUIState(state) {
        const startBtn = document.getElementById('start-simulation');
        const stopBtn = document.getElementById('stop-simulation');
        const exportBtn = document.getElementById('export-results');

        switch (state) {
            case 'running':
                startBtn.disabled = true;
                stopBtn.disabled = false;
                exportBtn.disabled = true;
                break;
            case 'completed':
                startBtn.disabled = false;
                stopBtn.disabled = true;
                exportBtn.disabled = false;
                break;
            case 'stopped':
            case 'error':
                startBtn.disabled = false;
                stopBtn.disabled = true;
                exportBtn.disabled = false;
                break;
        }
    }

    // Afficher la progression
    showProgress() {
        const progress = document.querySelector('.simulation-progress');
        progress.style.display = 'block';
    }

    // Masquer la progression
    hideProgress() {
        const progress = document.querySelector('.simulation-progress');
        progress.style.display = 'none';
    }

    // Mettre à jour la progression
    updateProgress(current, total) {
        const percentage = Math.round((current / total) * 100);
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const gamesCompleted = document.querySelector('.games-completed');
        const totalGames = document.querySelector('.total-games');

        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressText) progressText.textContent = percentage + '%';
        if (gamesCompleted) gamesCompleted.textContent = current;
        if (totalGames) totalGames.textContent = total;
    }

    // Afficher les résultats
    displayResults(results) {
        const resultsDiv = document.querySelector('.simulation-results');
        resultsDiv.style.display = 'block';

        // Statistiques principales
        this.updateMainStats(results.globalStats);

        // Distribution des rangs
        this.updateRankChart(results.globalStats.rankDistribution);

        // Statistiques des unités
        this.updateUnitStats(results.globalStats.unitUsageStats);

        // Statistiques des synergies
        this.updateSynergyStats(results.globalStats.synergyEffectiveness);

        // Statistiques des bonus
        this.updateBonusStats(results.globalStats.bonusUsageStats);

        // Statistiques des consommables
        this.updateConsumableStats(results.globalStats.consumableUsageStats);

        // Statistiques des unités achetées
        this.updatePurchasedUnitsStats(results.globalStats.purchasedUnitsStats);

        // Recommandations
        this.updateRecommendations(results.globalStats);

        // Faire défiler vers les résultats
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    // Mettre à jour les statistiques principales
    updateMainStats(stats) {
        document.getElementById('win-rate').textContent = (stats.winRate * 100).toFixed(1) + '%';
        document.getElementById('avg-rank').textContent = stats.averageRankReached;
        document.getElementById('avg-gold').textContent = Math.round(stats.averageGoldEarned);
        document.getElementById('avg-duration').textContent = (stats.averageGameDuration / 1000).toFixed(1) + 's';
    }

    // Mettre à jour le graphique des rangs
    updateRankChart(rankDistribution) {
        const chartDiv = document.getElementById('rank-chart');
        const ranks = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];
        
        let chartHTML = '<div class="rank-bars">';
        ranks.forEach(rank => {
            const count = rankDistribution[rank] || 0;
            const percentage = this.simulationEngine.globalStats.totalGames > 0 ? 
                (count / this.simulationEngine.globalStats.totalGames * 100).toFixed(1) : 0;
            
            chartHTML += `
                <div class="rank-bar">
                    <div class="rank-label">${rank}</div>
                    <div class="rank-bar-container">
                        <div class="rank-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="rank-count">${count}</div>
                </div>
            `;
        });
        chartHTML += '</div>';
        
        chartDiv.innerHTML = chartHTML;
    }

    // Mettre à jour les statistiques des unités
    updateUnitStats(unitStats) {
        const statsDiv = document.getElementById('unit-stats');
        
        // Trier par utilisation totale
        const sortedUnits = Object.entries(unitStats)
            .sort((a, b) => b[1].totalUses - a[1].totalUses)
            .slice(0, 10); // Top 10

        let statsHTML = '<div class="unit-stats-grid">';
        sortedUnits.forEach(([unitName, stats]) => {
            const usageRate = (stats.gamesUsed / this.simulationEngine.globalStats.totalGames * 100).toFixed(1);
            statsHTML += `
                <div class="unit-stat-card">
                    <div class="unit-name">${unitName}</div>
                    <div class="unit-usage">${stats.totalUses} utilisations</div>
                    <div class="unit-rate">${usageRate}% des parties</div>
                    <div class="unit-avg">${stats.averageUsesPerGame.toFixed(1)}/partie</div>
                </div>
            `;
        });
        statsHTML += '</div>';
        
        statsDiv.innerHTML = statsHTML;
    }

    // Mettre à jour les statistiques des synergies
    updateSynergyStats(synergyStats) {
        const statsDiv = document.getElementById('synergy-stats');
        
        if (!synergyStats || Object.keys(synergyStats).length === 0) {
            statsDiv.innerHTML = '<p class="no-data">Aucune synergie utilisée</p>';
            return;
        }
        
        // Trier par niveau moyen
        const sortedSynergies = Object.entries(synergyStats)
            .sort((a, b) => b[1].averageLevel - a[1].averageLevel)
            .slice(0, 10); // Top 10

        let statsHTML = '<div class="synergy-stats-grid">';
        sortedSynergies.forEach(([synergyName, stats]) => {
            const usageRate = (stats.gamesUsed / this.simulationEngine.globalStats.totalGames * 100).toFixed(1);
            statsHTML += `
                <div class="synergy-stat-card">
                    <div class="synergy-name">${synergyName}</div>
                    <div class="synergy-level">Niveau moyen: ${stats.averageLevel.toFixed(1)}</div>
                    <div class="synergy-usage">${stats.gamesUsed} parties (${usageRate}%)</div>
                    <div class="synergy-active">Active: ${stats.gamesActive} parties (${stats.activeRate}%)</div>
                </div>
            `;
        });
        statsHTML += '</div>';
        
        statsDiv.innerHTML = statsHTML;
    }

    // Mettre à jour les statistiques des bonus
    updateBonusStats(bonusStats) {
        const statsDiv = document.getElementById('bonus-stats');
        
        if (!bonusStats || Object.keys(bonusStats).length === 0) {
            statsDiv.innerHTML = '<p class="no-data">Aucun bonus utilisé</p>';
            return;
        }
        
        // Trier par taux d'utilisation
        const sortedBonuses = Object.entries(bonusStats)
            .sort((a, b) => parseFloat(b[1].usageRate) - parseFloat(a[1].usageRate))
            .slice(0, 10); // Top 10

        let statsHTML = '<div class="bonus-stats-grid">';
        sortedBonuses.forEach(([bonusId, stats]) => {
            const bonusName = this.getBonusDisplayName(bonusId);
            statsHTML += `
                <div class="bonus-stat-card">
                    <div class="bonus-name">${bonusName}</div>
                    <div class="bonus-usage">${stats.gamesUsed} parties (${stats.usageRate}%)</div>
                </div>
            `;
        });
        statsHTML += '</div>';
        
        statsDiv.innerHTML = statsHTML;
    }

    // Mettre à jour les statistiques des unités achetées
    updatePurchasedUnitsStats(purchasedUnitsStats) {
        const statsDiv = document.getElementById('purchased-units-stats');
        
        if (!purchasedUnitsStats || !purchasedUnitsStats.purchasedUnits || Object.keys(purchasedUnitsStats.purchasedUnits).length === 0) {
            statsDiv.innerHTML = '<p class="no-data">Aucune unité achetée</p>';
            return;
        }
        
        // Trier par nombre d'achats
        const sortedUnits = Object.entries(purchasedUnitsStats.purchasedUnits)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15); // Top 15

        let statsHTML = '<div class="purchased-units-summary">';
        statsHTML += `<div class="summary-item">Total acheté: ${purchasedUnitsStats.totalPurchased}</div>`;
        statsHTML += `<div class="summary-item">Moyenne par partie: ${purchasedUnitsStats.averagePurchasedPerGame.toFixed(1)}</div>`;
        statsHTML += '</div>';
        
        statsHTML += '<div class="purchased-units-grid">';
        sortedUnits.forEach(([unitName, count]) => {
            const percentage = (count / purchasedUnitsStats.totalPurchased * 100).toFixed(1);
            statsHTML += `
                <div class="purchased-unit-card">
                    <div class="unit-name">${unitName}</div>
                    <div class="unit-count">${count} achats</div>
                    <div class="unit-percentage">${percentage}% du total</div>
                </div>
            `;
        });
        statsHTML += '</div>';
        
        statsDiv.innerHTML = statsHTML;
    }

    // Mettre à jour les statistiques des consommables
    updateConsumableStats(consumableStats) {
        const statsDiv = document.getElementById('consumable-stats');
        
        if (!consumableStats) {
            statsDiv.innerHTML = '<p class="no-data">Aucune donnée sur les consommables</p>';
            return;
        }
        
        let statsHTML = `
            <div class="consumable-overview">
                <div class="consumable-stat-card">
                    <div class="consumable-label">Total achetés</div>
                    <div class="consumable-value">${consumableStats.totalPurchased}</div>
                </div>
                <div class="consumable-stat-card">
                    <div class="consumable-label">Total utilisés</div>
                    <div class="consumable-value">${consumableStats.totalUsed}</div>
                </div>
                <div class="consumable-stat-card">
                    <div class="consumable-label">Moyenne/partie</div>
                    <div class="consumable-value">${consumableStats.averagePurchasedPerGame.toFixed(1)} achetés, ${consumableStats.averageUsedPerGame.toFixed(1)} utilisés</div>
                </div>
                <div class="consumable-stat-card">
                    <div class="consumable-label">Efficacité</div>
                    <div class="consumable-value">${consumableStats.usageEfficiency}%</div>
                </div>
            </div>
        `;
        
        // Afficher les détails des consommables achetés
        if (consumableStats.purchasedConsumables && Object.keys(consumableStats.purchasedConsumables).length > 0) {
            statsHTML += '<div class="consumable-details">';
            statsHTML += '<h4>Consommables achetés:</h4>';
            statsHTML += '<div class="consumable-types-grid">';
            
            const sortedConsumables = Object.entries(consumableStats.purchasedConsumables)
                .sort((a, b) => b[1] - a[1]);
            
            sortedConsumables.forEach(([consumableType, count]) => {
                const percentage = (count / consumableStats.totalPurchased * 100).toFixed(1);
                statsHTML += `
                    <div class="consumable-type-card">
                        <div class="consumable-type">${this.getConsumableDisplayName(consumableType)}</div>
                        <div class="consumable-count">${count} achats</div>
                        <div class="consumable-percentage">${percentage}% du total</div>
                    </div>
                `;
            });
            
            statsHTML += '</div>';
            statsHTML += '</div>';
        }
        
        statsDiv.innerHTML = statsHTML;
    }

    // Obtenir le nom d'affichage d'un bonus
    getBonusDisplayName(bonusId) {

        const bonusNames = {
            'gold_bonus': 'bonus.goldBonus',
            'corps_a_corps_bonus': 'bonus.meleeBonus',
            'distance_bonus': 'bonus.rangedBonus',
            'magique_bonus': 'bonus.magicBonus',
            'epee_aiguisee': 'bonus.sharpSword',
            'arc_renforce': 'bonus.reinforcedBow',
            'grimoire_magique': 'bonus.magicGrimoire',
            'amulette_force': 'bonus.strengthAmulet',
            'cristal_precision': 'bonus.precisionCrystal',
            'orbe_mystique': 'bonus.mysticOrb',
            'potion_force': 'bonus.strengthPotion',
            'elixir_puissance': 'bonus.powerElixir',
            'armure_legendaire': 'bonus.legendaryArmor',
            'arc_divin': 'bonus.divineBow',
            'baguette_supreme': 'bonus.supremeWand',
            'relique_ancienne': 'bonus.ancientRelic',
            'cac_cest_la_vie': 'bonus.meleeIsLife',
            'economie_dune_vie': 'bonus.economyOfLife'
        };
        const translationKey = bonusNames[bonusId];
        return bonusId;
    }

    // Obtenir le nom d'affichage d'un consommable
    getConsumableDisplayName(consumableType) {
        const consumableNames = {
            'potion_force': 'Potion de Force',
            'potion_soin': 'Potion de Soin',
            'potion_mana': 'Potion de Mana',
            'elixir_puissance': 'Élixir de Puissance',
            'elixir_vitesse': 'Élixir de Vitesse',
            'elixir_resistance': 'Élixir de Résistance',
            'bombe_degats': 'Bombe de Dégâts',
            'bombe_glace': 'Bombe de Glace',
            'bombe_feu': 'Bombe de Feu',
            'parchemin_degats': 'Parchemin de Dégâts',
            'parchemin_soin': 'Parchemin de Soin',
            'parchemin_bouclier': 'Parchemin de Bouclier'
        };
        return consumableNames[consumableType] || consumableType;
    }

    // Mettre à jour les recommandations
    updateRecommendations(globalStats) {
        const recommendationsDiv = document.getElementById('recommendations');
        const recommendations = this.simulationEngine.generateRecommendations();
        
        if (recommendations.length === 0) {
            recommendationsDiv.innerHTML = '<p class="no-recommendations">✅ Aucune recommandation d\'équilibrage nécessaire</p>';
            return;
        }

        let recHTML = '<div class="recommendations-list">';
        recommendations.forEach(rec => {
            recHTML += `
                <div class="recommendation-item">
                    <div class="rec-type ${rec.type}">${this.getTypeIcon(rec.type)}</div>
                    <div class="rec-content">
                        <div class="rec-issue">${rec.issue}</div>
                        <div class="rec-suggestion">💡 ${rec.suggestion}</div>
                    </div>
                </div>
            `;
        });
        recHTML += '</div>';
        
        recommendationsDiv.innerHTML = recHTML;
    }

    // Obtenir l'icône du type de recommandation
    getTypeIcon(type) {
        const icons = {
            difficulty: '⚖️',
            economy: '💰',
            unit: '⚔️',
            synergy: '🔗'
        };
        return icons[type] || '💡';
    }

    // Exporter les résultats
    exportResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `guildmaster_balance_${timestamp}.json`;
        this.simulationEngine.exportResults(filename);
        this.showNotification('Résultats exportés avec succès !', 'success');
    }

    // Afficher une notification
    showNotification(message, type = 'info') {
        // Utiliser le système de notification existant si disponible
        if (window.gameState && window.gameState.showNotification) {
            window.gameState.showNotification(message, type);
        } else {
            // Fallback simple
            alert(message);
        }
    }

    // Afficher une erreur
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Afficher la modal
    show() {
        ModalManager.showModal('simulation-modal');
    }

    // Masquer la modal
    hide() {
        ModalManager.hideModal('simulation-modal');
    }
} 