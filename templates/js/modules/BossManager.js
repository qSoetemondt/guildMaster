// Gestionnaire de boss pour GuildMaster
import { BOSS_RANKS, getMajorRank, RANK_MULTIPLIERS } from './GameConstants.js';
import { BOSSES, selectRandomBoss, getBossForRank } from './BossConstants.js';
import { getEnemyImage } from './GameConstants.js';

export class BossManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.displayBoss = null; // Boss sélectionné pour l'affichage (mémorisé)
        this.bonusSoldThisCombat = false; // Variable pour tracker si un bonus a été vendu pendant le combat actuel (pour le boss Quilegan)
    }

    // Vérifier si le rang actuel est un rang de boss
    isBossRank(rank) {
        return BOSS_RANKS.includes(rank);
    }

    // Sélectionner un boss pour le rang actuel
    selectBossForRank(rank) {
        if (!this.isBossRank(rank)) {
            return null;
        }
        
        // Utiliser le boss d'affichage s'il existe, sinon en sélectionner un selon le rang
        return this.displayBoss || getBossForRank(rank);
    }

    // Calculer les HP des boss selon le rang majeur
    calculateBossTargetDamageByRank(boss, rank) {
        const rankIndex = this.gameState.RANKS.indexOf(rank);
        if (rankIndex === -1) return boss.targetDamage; // Valeur par défaut
        
        const majorRank = getMajorRank(rank);
        // Appliquer le multiplicateur du rang aux HP de base du boss
        return boss.targetDamage * RANK_MULTIPLIERS[majorRank];
    }

    // Démarrer un combat de boss
    startBossFight(selectedBoss, rank) {
        const targetDamage = this.calculateBossTargetDamageByRank(selectedBoss, rank);
        
        this.gameState.currentCombat = {
            targetDamage: targetDamage,
            totalDamage: 0,
            round: 0,
            maxRounds: 5,
            isActive: true,
            isBossFight: true,
            bossName: selectedBoss.name,
            bossMechanic: selectedBoss.mechanic
        };

        // Réinitialiser l'état de vente de bonus pour le nouveau combat
        this.bonusSoldThisCombat = false;
        
        return this.gameState.currentCombat;
    }

    // Appliquer les mécaniques de boss sur les dégâts
    applyBossMechanics(damage, troop) {
        const mechanic = this.gameState.currentCombat.bossMechanic;
        
        if (mechanic.includes('corps à corps') && this.gameState.hasTroopType(troop, 'Corps à corps')) {
            if (mechanic.includes('-50%')) {
                return Math.floor(damage * 0.5);
            }
            if (mechanic.includes('-2')) {
                return Math.max(0, damage - 2);
            }
        }
        
        if (mechanic.includes('distance') && this.gameState.hasTroopType(troop, 'Distance')) {
            if (mechanic.includes('-30%')) {
                return Math.floor(damage * 0.7);
            }
        }
        
        if (mechanic.includes('multiplicateurs')) {
            return Math.floor(damage * 0.5);
        }
        
        if (mechanic.includes('magiques') && this.gameState.hasTroopType(troop, 'Magique')) {
            return Math.floor(damage * 1.5);
        }
        
        // Effet spécial du boss Quilegan : bloque les relances, bonus et synergies tant qu'aucun bonus n'est vendu
        if (mechanic.includes('Bloque les relances, les bonus et les synergies tant qu\'aucun bonus n\'est vendu')) {
            // Vérifier si un bonus a été vendu pendant ce combat
            if (!this.bonusSoldThisCombat) {
                console.log('🐛 Quilegan: Bonus non vendu, dégâts mis à 0');
                return 0; // Aucun dégât si aucun bonus n'a été vendu
            } else {
                console.log('🐛 Quilegan: Bonus vendu, dégâts normaux');
            }
        }
        
        return damage;
    }

    // Appliquer les mécaniques de boss sur les multiplicateurs
    applyBossMechanicsToMultiplier(multiplier, troop) {
        const mechanic = this.gameState.currentCombat.bossMechanic;
        
        if (mechanic.includes('multiplicateurs')) {
            return Math.floor(multiplier * 0.5);
        }
        
        return multiplier;
    }

    // Vérifier si le malus de boss est désactivé (pour Quilegan)
    isBossMalusDisabled() {
        if (!this.gameState.currentCombat.isBossFight) {
            return false;
        }
        
        const mechanic = this.gameState.currentCombat.bossMechanic;
        
        // Pour Quilegan, vérifier si un bonus a été vendu
        if (mechanic.includes('Bloque les relances, les bonus et les synergies tant qu\'aucun bonus n\'est vendu')) {
            return this.bonusSoldThisCombat;
        }
        
        return false;
    }

    // Marquer qu'un bonus a été vendu (pour Quilegan)
    markBonusSold() {
        this.bonusSoldThisCombat = true;
        console.log('🐛 Quilegan: Bonus vendu, malus désactivé');
    }

    // Obtenir le nom du boss actuel
    getCurrentBossName() {
        if (!this.gameState.currentCombat.isBossFight) {
            return '';
        }
        return this.gameState.currentCombat.bossName;
    }

    // Obtenir la mécanique du boss actuel
    getCurrentBossMechanic() {
        if (!this.gameState.currentCombat.isBossFight) {
            return '';
        }
        return this.gameState.currentCombat.bossMechanic;
    }

    // Vérifier si Quilegan est le boss actuel
    isQuileganActive() {
        return this.gameState.currentCombat && 
               this.gameState.currentCombat.isBossFight && 
               this.gameState.currentCombat.bossName === 'Quilegan';
    }

    // Créer l'élément HTML pour la mécanique du boss
    createBossMechanicElement() {
        if (!this.gameState.currentCombat.isBossFight || !this.gameState.currentCombat.bossMechanic) {
            return null;
        }
        
        const mechanicText = document.createElement('div');
        mechanicText.className = 'boss-mechanic';
        mechanicText.style.cssText = `
            color: #856404;
            font-size: 0.9rem;
            font-style: italic;
            margin-bottom: 10px;
            padding: 5px;
            background: rgba(255, 193, 7, 0.2);
            border-radius: 4px;
        `;
        mechanicText.textContent = `Mécanique: ${this.gameState.currentCombat.bossMechanic}`;
        
        return mechanicText;
    }

    // Créer l'indicateur de statut pour Quilegan
    createQuileganIndicator() {
        if (!this.isQuileganActive()) {
            return null;
        }
        
        const quileganIndicator = document.createElement('div');
        quileganIndicator.className = 'quilegan-progress-indicator';
        quileganIndicator.style.cssText = `
            background: ${this.bonusSoldThisCombat ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #e74c3c, #c0392b)'};
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 10px;
            font-weight: bold;
            text-align: center;
            border: 2px solid ${this.bonusSoldThisCombat ? '#28a745' : '#e74c3c'};
            font-size: 0.9rem;
        `;
        
        quileganIndicator.innerHTML = `
            🎯 <strong>Quilegan:</strong> ${this.bonusSoldThisCombat ? 'MÉCANIQUE DÉSACTIVÉE' : 'MÉCANIQUE ACTIVE'}
            <br><small>${this.bonusSoldThisCombat ? 'Bonus vendu - malus désactivé' : 'Bloque les relances, bonus et synergies tant qu\'aucun bonus n\'est vendu'}</small>
        `;
        
        return quileganIndicator;
    }

    // Obtenir l'image du boss
    getBossImage() {
        if (this.gameState.currentCombat.isBossFight) {
            return 'assets/orcs.jpg';
        } else {
            return getEnemyImage(this.gameState.rank);
        }
    }

    // Nettoyer l'affichage du malus de boss
    cleanBossMalusDisplay() {
        // Nettoyer le malus de boss dans l'animation de combat
        const bossMalusContainer = document.querySelector('.boss-malus-container');
        if (bossMalusContainer) {
            bossMalusContainer.remove();
        }
        
        // Nettoyer le malus de boss dans la modal de combat
        const bossMalusModal = document.querySelector('.boss-malus-modal');
        if (bossMalusModal) {
            bossMalusModal.remove();
        }
        
        // Nettoyer le malus de boss dans la progression du combat
        const bossMechanic = document.querySelector('.boss-mechanic');
        if (bossMechanic) {
            bossMechanic.remove();
        }
        
        // Nettoyer les éléments de malus de boss dans le log de combat
        const combatLog = document.getElementById('combat-log');
        if (combatLog) {
            const bossMalusInLog = combatLog.querySelector('.boss-malus-modal');
            if (bossMalusInLog) {
                bossMalusInLog.remove();
            }
        }
        
        // Nettoyer l'affichage du statut de Quilegan
        const quileganStatus = document.getElementById('quilegan-status');
        if (quileganStatus) {
            quileganStatus.remove();
        }
    }

    // Mettre à jour l'affichage du statut de Quilegan
    updateQuileganStatusDisplay(isDisabled, mechanicText) {
        // Désactivé - l'information est déjà visible dans l'interface
        // Supprimer toute notification existante
        const quileganStatus = document.getElementById('quilegan-status');
        if (quileganStatus) {
            quileganStatus.remove();
        }
    }

    // Mettre à jour l'affichage du malus de boss
    updateBossMalusDisplay() {
        if (!this.gameState.currentCombat.isBossFight || !this.gameState.currentCombat.bossMechanic) {
            return;
        }
        
        const isDisabled = this.isBossMalusDisabled();
        const mechanicText = this.gameState.currentCombat.bossMechanic;
        
        this.updateQuileganStatusDisplay(isDisabled, mechanicText);
    }

    // Réinitialiser l'état du boss pour un nouveau rang
    resetForNewRank() {
        this.displayBoss = null;
        this.bonusSoldThisCombat = false;
    }

    // Sauvegarder l'état du boss
    saveState() {
        return {
            displayBoss: this.displayBoss,
            bonusSoldThisCombat: this.bonusSoldThisCombat
        };
    }

    // Charger l'état du boss
    loadState(state) {
        if (state.displayBoss) {
            this.displayBoss = state.displayBoss;
        } else {
            this.displayBoss = null;
        }
        this.bonusSoldThisCombat = state.bonusSoldThisCombat || false;
    }
} 