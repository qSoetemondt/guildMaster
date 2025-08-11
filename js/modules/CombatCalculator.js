// Module de calcul de combat centralisé
// Ce module contient toute la logique de calcul des dégâts, bonus et synergies

import { calculateSynergies, calculateEquipmentBonuses, hasTroopType } from './UnitManager.js';
import { computeUnitStatsWithBonuses } from '../utils/TypeUtils.js';

export class CombatCalculator {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Calcul principal des dégâts d'un tour (NOUVELLE LOGIQUE)
     * Délègue à CombatManager pour garantir l'unicité du calcul.
     */
    calculateTurnDamage(troops) {
        if (this.gameState.combatManager && typeof this.gameState.combatManager.calculateTurnDamage === 'function') {
            return this.gameState.combatManager.calculateTurnDamage(troops);
            }
        throw new Error('CombatManager non disponible pour le calcul des dégâts');
    }

    /**
     * Calculer les dégâts d'une unité individuelle avec tous les bonus et malus
     * @param {Object} troop - L'unité à calculer
     * @param {Array} troopsList - Liste des troupes pour les synergies
     * @param {number} troopIndex - L'index de la troupe dans la liste (optionnel)
     * @returns {Object} - Les dégâts et multiplicateur de l'unité avec tous les bonus
     */
    calculateTroopDamageWithBonuses(troop, troopsList = null, troopIndex = null) {
        return computeUnitStatsWithBonuses(troop, { gameState: this.gameState, troopsList, troopIndex });
    }

    /**
     * Calculer les synergies actives
     * @param {Array} troops - Les troupes à analyser (optionnel)
     * @returns {Array} - Liste des synergies actives
     */
    calculateSynergies(troops = null) {
        return calculateSynergies(troops, this.gameState);
    }

    /**
     * Calculer les bonus d'équipement
     * @returns {Array} - Liste des bonus d'équipement actifs
     */
    calculateEquipmentBonuses() {
        return calculateEquipmentBonuses(this.gameState);
    }

    /**
     * Retirer les troupes utilisées du pool de combat
     * @param {Array} troopsUsed - Les troupes utilisées
     */
    removeUsedTroopsFromCombat(troopsUsed) {
        troopsUsed.forEach(usedTroop => {
            // Retirer de la sélection
            const selectedIndex = this.gameState.selectedTroops.findIndex(troop => troop.id === usedTroop.id);
            if (selectedIndex !== -1) {
                this.gameState.selectedTroops.splice(selectedIndex, 1);
            }
            
            // Retirer du pool de combat
            const combatIndex = this.gameState.combatTroops.findIndex(troop => troop.id === usedTroop.id);
            if (combatIndex !== -1) {
                this.gameState.combatTroops.splice(combatIndex, 1);
            }
            
            // Si c'est une unité achetée/transformée (permanente), NE PAS la remettre dans availableTroops
            // pour éviter la duplication. Elle sera retirée du pool de combat et ne réapparaîtra pas automatiquement.
            // Les unités transformées doivent être retirées définitivement du pool après utilisation.
        });
    }

    /**
     * Vérifier si une unité est permanente (achetée/transformée)
     * @param {Object} troop - L'unité à vérifier
     * @returns {boolean} - True si l'unité est permanente
     */
    isPermanentUnit(troop) {
        return troop.rarity && troop.rarity !== 'common';
    }

    /**
     * Calculer les dégâts pour l'auto-simulateur
     * @param {Array} troops - Les troupes à utiliser
     * @returns {Object} - Résultat du calcul avec détails
     */
    calculateCombatDamageForSimulator(troops) {
        // Calculer les synergies actives
        const synergies = this.calculateSynergies(troops);
        
        // Calculer les bonus d'équipement
        const equipmentBonuses = this.calculateEquipmentBonuses();
        
        // Utiliser la fonction du jeu de base
        const turnDamage = this.calculateTurnDamage(troops);
        
        return {
            damage: turnDamage,
            synergies: synergies,
            bonuses: equipmentBonuses
        };
    }
} 