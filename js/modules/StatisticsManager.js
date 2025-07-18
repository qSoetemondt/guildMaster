import { ModalManager } from './ModalManager.js';

export class StatisticsManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Initialiser les statistiques de partie
        this.gameStats = {
            combatsPlayed: 0,
            combatsWon: 0,
            combatsLost: 0,
            goldSpent: 0,
            goldEarned: 0,
            unitsPurchased: 0,
            bonusesPurchased: 0,
            unitsUsed: {}, // {unitName: count}
            maxDamageInTurn: 0,
            bestTurnDamage: 0,
            bestTurnRound: 0,
            totalDamageDealt: 0,
            highestRank: 'F-',
            startTime: Date.now()
        };
    }

    // Mettre à jour les statistiques de combat
    updateCombatStatistics(troopsUsed, turnDamage) {
        // Ajouter les dégâts totaux
        this.gameStats.totalDamageDealt += turnDamage;
        
        // Compter les unités utilisées
        troopsUsed.forEach(troop => {
            this.gameStats.unitsUsed[troop.name] = (this.gameStats.unitsUsed[troop.name] || 0) + 1;
        });
        
        // Mettre à jour le meilleur tour
        if (turnDamage > this.gameStats.bestTurnDamage) {
            this.gameStats.bestTurnDamage = turnDamage;
            this.gameStats.bestTurnRound = this.gameState.currentCombat.round;
        }
    }

    // Mettre à jour les statistiques de fin de combat
    updateEndCombatStatistics(victory) {
        this.gameStats.combatsPlayed++;
        
        if (victory) {
            this.gameStats.combatsWon++;
        } else {
            this.gameStats.combatsLost++;
        }
        
        // Mettre à jour le rang le plus élevé atteint
        const highestRankIndex = this.gameState.RANKS.indexOf(this.gameStats.highestRank);
        const currentRankIndex = this.gameState.RANKS.indexOf(this.gameState.rank);
        
        if (currentRankIndex > highestRankIndex) {
            this.gameStats.highestRank = this.gameState.rank;
        }
    }

    // Ajouter de l'or gagné
    addGoldEarned(amount) {
        this.gameStats.goldEarned += amount;
    }

    // Ajouter de l'or dépensé
    addGoldSpent(amount) {
        this.gameStats.goldSpent += amount;
    }

    // Incrémenter le compteur d'unités achetées
    incrementUnitsPurchased() {
        this.gameStats.unitsPurchased++;
    }

    // Incrémenter le compteur de bonus achetés
    incrementBonusesPurchased() {
        this.gameStats.bonusesPurchased++;
    }

    // Afficher le récapitulatif de partie
    showGameSummary() {
        const gameTime = Math.floor((Date.now() - this.gameStats.startTime) / 1000 / 60); // en minutes
        
        // Trouver l'unité la plus utilisée
        let mostUsedUnit = 'Aucune';
        let mostUsedCount = 0;
        Object.entries(this.gameStats.unitsUsed).forEach(([unitName, count]) => {
            if (count > mostUsedCount) {
                mostUsedUnit = unitName;
                mostUsedCount = count;
            }
        });

        // Créer le contenu de la modal
        const modalContent = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>📊 Récapitulatif de Partie</h3>
                    <button class="close-btn">×</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="summary-section">
                            <h4>⚔️ Combats</h4>
                            <p><strong>Combats joués:</strong> ${this.gameStats.combatsPlayed}</p>
                            <p><strong>Victoires:</strong> ${this.gameStats.combatsWon}</p>
                            <p><strong>Défaites:</strong> ${this.gameStats.combatsLost}</p>
                            <p><strong>Taux de victoire:</strong> ${this.gameStats.combatsPlayed > 0 ? Math.round((this.gameStats.combatsWon / this.gameStats.combatsPlayed) * 100) : 0}%</p>
                        </div>
                        <div class="summary-section">
                            <h4>💰 Économie</h4>
                            <p><strong>Or gagné:</strong> ${this.gameStats.goldEarned}💰</p>
                            <p><strong>Or dépensé:</strong> ${this.gameStats.goldSpent}💰</p>
                            <p><strong>Solde actuel:</strong> ${this.gameState.gold}💰</p>
                            <p><strong>Unités achetées:</strong> ${this.gameStats.unitsPurchased}</p>
                            <p><strong>Bonus achetés:</strong> ${this.gameStats.bonusesPurchased}</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="summary-section">
                            <h4>🎯 Performance</h4>
                            <p><strong>Dégâts totaux:</strong> ${this.gameStats.totalDamageDealt.toLocaleString()}</p>
                            <p><strong>Meilleur tour:</strong> ${this.gameStats.bestTurnDamage} dégâts (tour ${this.gameStats.bestTurnRound})</p>
                            <p><strong>Rang atteint:</strong> ${this.gameStats.highestRank}</p>
                            <p><strong>Temps de jeu:</strong> ${gameTime} minutes</p>
                        </div>
                        <div class="summary-section">
                            <h4>👥 Unités</h4>
                            <p><strong>Unité la plus jouée:</strong> ${mostUsedUnit} (${mostUsedCount} fois)</p>
                            <p><strong>Unités différentes:</strong> ${Object.keys(this.gameStats.unitsUsed).length}</p>
                        </div>
                    </div>

                    <div class="summary-section">
                        <h4>🏆 Top 5 des Unités Utilisées</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${Object.entries(this.gameStats.unitsUsed)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 5)
                                .map(([unitName, count], index) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 6px;">
                                        <span><strong>${index + 1}.</strong> ${unitName}</span>
                                        <span style="color: #666;">${count} fois</span>
                                    </div>
                                `).join('')}
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn primary new-game-btn">Nouvelle Partie</button>
                        <button class="btn secondary close-modal-btn">Fermer</button>
                    </div>
                </div>
            </div>
        `;

        // Créer la modal si elle n'existe pas
        let modal = document.getElementById('game-summary-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'game-summary-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = modalContent;
        
        // Ajouter les gestionnaires d'événements pour les boutons
        const closeBtn = modal.querySelector('.close-btn');
        const newGameBtn = modal.querySelector('.new-game-btn');
        const closeModalBtn = modal.querySelector('.close-modal-btn');
        
        closeBtn.addEventListener('click', () => ModalManager.hideModal('game-summary-modal'));
        newGameBtn.addEventListener('click', () => {
            this.gameState.newGame();
            ModalManager.hideAllModals();
        });
        closeModalBtn.addEventListener('click', () => ModalManager.hideModal('game-summary-modal'));
        
        // Afficher la modal via ModalManager
        ModalManager.showModal('game-summary-modal');
    }

    // Obtenir les statistiques pour la sauvegarde
    getStatsForSave() {
        return this.gameStats;
    }

    // Charger les statistiques depuis la sauvegarde
    loadStatsFromSave(savedStats) {
        this.gameStats = { ...savedStats };
    }

    // Réinitialiser les statistiques pour une nouvelle partie
    resetStats() {
        this.gameStats = {
            combatsPlayed: 0,
            combatsWon: 0,
            combatsLost: 0,
            goldSpent: 0,
            goldEarned: 0,
            unitsPurchased: 0,
            bonusesPurchased: 0,
            unitsUsed: {},
            maxDamageInTurn: 0,
            bestTurnDamage: 0,
            bestTurnRound: 0,
            totalDamageDealt: 0,
            highestRank: 'F-',
            startTime: Date.now()
        };
    }
} 