// Module de calcul de combat centralisé
// Ce module contient toute la logique de calcul des dégâts, bonus et synergies

import { calculateSynergies, calculateEquipmentBonuses, hasTroopType, removeUsedTroopsFromCombat } from './UnitManager.js';
import { computeUnitStatsWithBonuses } from '../utils/TypeUtils.js';

export class CombatCalculator {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Calcul principal des dégâts d'un tour (LOGIQUE CENTRALISÉE)
     * Cette méthode contient toute la logique de calcul des dégâts de combat
     */
    calculateTurnDamage(troops) {
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        // 1. Appliquer les bonus/malus à chaque unité
        for (let i = 0; i < troops.length; i++) {
            const troop = troops[i];
            
            // Vérifier si la troupe a déjà été utilisée dans ce rang
            if (this.gameState.usedTroopsThisCombat.includes(troop.id)) {
                continue; // Passer cette troupe
            }

            let unitDamage = troop.damage;
            let unitMultiplier = troop.multiplier;
            
            // Appliquer les bonus d'équipement (sauf les bonus de position)
            const equipmentBonuses = this.calculateEquipmentBonuses();
            equipmentBonuses.forEach(bonus => {
                if (bonus.type !== 'position_bonus') {
                    if (bonus.target === 'all' || this.hasTroopType(troop, bonus.target)) {
                        if (bonus.damage) unitDamage += bonus.damage;
                        if (bonus.multiplier) unitMultiplier += bonus.multiplier;
                    }
                }
            });
            
            // Appliquer les mécaniques de boss (après les bonus)
            if (this.gameState.currentCombat.isBossFight) {
                unitDamage = this.gameState.bossManager.applyBossMechanics(unitDamage, troop);
                unitMultiplier = this.gameState.bossManager.applyBossMechanicsToMultiplier(unitMultiplier, troop);
            }
            
            // Appliquer le bonus "Position Quatre" si c'est la 4ème unité
            const positionBonuses = this.calculateEquipmentBonuses().filter(bonus => bonus.type === 'position_bonus');
            if (positionBonuses.length > 0 && i === 3) { // 4ème position (index 3)
                positionBonuses.forEach(bonus => {
                    if (bonus.target === 'fourth_position') {
                        unitMultiplier = unitMultiplier * bonus.positionMultiplier;
                    }
                });
            }
            
            // Accumuler les dégâts et multiplicateurs
            totalDamage += unitDamage;
            totalMultiplier += unitMultiplier;
            
            // Marquer la troupe comme utilisée dans ce rang
            this.gameState.usedTroopsThisCombat.push(troop.id);
        }
        
        // 2. Appliquer les synergies sur le total (une seule fois)
        const synergies = this.calculateSynergies(troops);
        synergies.forEach(synergy => {
            if (synergy.bonus.target === 'all') {
                if (synergy.bonus.damage) totalDamage += synergy.bonus.damage;
                if (synergy.bonus.multiplier) totalMultiplier += synergy.bonus.multiplier;
            }
        });

        // 3. Retirer les troupes utilisées du pool de combat
        removeUsedTroopsFromCombat(troops, this.gameState);
        
        // 4. Calculer le total final
        let finalDamage = totalDamage * totalMultiplier;
        
        // 5. Appliquer le malus de Quilegan à la fin (après tous les calculs)
        if (this.gameState.currentCombat && this.gameState.currentCombat.isBossFight && 
            this.gameState.currentCombat.bossMechanic.includes('Bloque les relances, les bonus, les synergies et les dégâts des unités tant qu\'aucun bonus n\'est vendu')) {
            if (!this.gameState.bossManager.isBossMalusDisabled()) {
                finalDamage = 0;
            }
        }
        
        return Math.round(finalDamage);
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

    // La méthode removeUsedTroopsFromCombat a été centralisée dans UnitManager
    // pour éviter la duplication de code et centraliser la logique

    /**
     * Vérifier si une unité est permanente (achetée/transformée)
     * @param {Object} troop - L'unité à vérifier
     * @returns {boolean} - True si l'unité est permanente
     */
    isPermanentUnit(troop) {
        return troop.rarity && troop.rarity !== 'common';
    }

    /**
     * Vérifier si une troupe a un type spécifique
     * @param {Object} troop - La troupe à vérifier
     * @param {string} targetType - Le type à vérifier
     * @returns {boolean} - True si la troupe a le type cible
     */
    hasTroopType(troop, targetType) {
        // Gérer le cas où troop.type est un tableau
        if (Array.isArray(troop.type)) {
            return troop.type.includes(targetType);
        }
        // Gérer le cas où troop.type est une chaîne
        return troop.type === targetType;
    }

    /**
     * Appliquer les bonus de combat (méthode de délégation)
     * @returns {Array} - Liste des bonus appliqués
     */
    applyCombatBonuses() {
        // Cette méthode est une délégation vers UnitManager
        // pour maintenir la cohérence avec l'architecture existante
        return this.calculateEquipmentBonuses();
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