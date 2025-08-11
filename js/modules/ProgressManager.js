// ProgressManager.js - Gestion centralisée de la progression
import { getEnemyImage } from './constants/combat/GameConstants.js';

export class ProgressManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // Gagner un rang après chaque combat
    gainRank() {
        const currentIndex = this.gameState.RANKS.indexOf(this.gameState.rank);
        if (currentIndex < this.gameState.RANKS.length - 1) {
            const oldRank = this.gameState.rank;
            this.gameState.rank = this.gameState.RANKS[currentIndex + 1];
            
            // Réinitialiser les troupes utilisées pour le nouveau rang
            this.gameState.usedTroopsThisCombat = [];
            
            // Réinitialiser le compteur de relances pour le nouveau rang
            this.gameState.rerollCount = 0;
            
            // Réinitialiser l'état du boss pour le nouveau rang
            this.gameState.bossManager.resetForNewRank();
            
            // Tirer de nouvelles troupes pour le nouveau rang
            this.gameState.drawCombatTroops();
            
            // Mettre à jour l'interface pour afficher le nouveau boss si nécessaire
            this.gameState.updateUI();
            
            this.gameState.notificationManager.showRankGained(this.gameState.rank);
        }
    }

    // Calculer l'objectif de progression pour le rang actuel
    calculateRankTarget() {
        const rankIndex = this.gameState.RANKS.indexOf(this.gameState.rank);
        return 100 + (rankIndex * 25);
    }

    // Mettre à jour l'affichage de la progression du combat
    updateCombatProgressDisplay() {
        const combatProgressContainer = document.getElementById('combat-progress-container');
        
        // Afficher la barre pour tous les combats, y compris les boss
        if (this.gameState.currentCombat.isActive) {
            if (!combatProgressContainer) {
                // Créer le conteneur de progression s'il n'existe pas
                const newContainer = this.gameState.uiManager.createCombatProgressDisplay();
                this.gameState.uiManager.insertCombatProgressContainer(newContainer);
            } else {
                // Mettre à jour l'affichage existant
                this.gameState.uiManager.updateExistingCombatProgress();
            }
        } else {
            // Supprimer l'affichage si le combat n'est pas actif
            if (combatProgressContainer) {
                combatProgressContainer.remove();
            }
        }
    }
} 