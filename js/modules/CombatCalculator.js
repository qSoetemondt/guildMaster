// Module de calcul de combat centralisé
// Ce module contient toute la logique de calcul des dégâts, bonus et synergies

import { calculateSynergies, calculateEquipmentBonuses, hasTroopType } from './UnitManager.js';

export class CombatCalculator {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Calcul principal des dégâts d'un tour
     * @param {Array} troops - Les troupes à utiliser
     * @returns {number} - Les dégâts totaux du tour
     */
    calculateTurnDamage(troops) {
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        for (const troop of troops) {
            // Vérification de sécurité pour éviter les erreurs
            if (!troop || typeof troop.damage === 'undefined' || typeof troop.multiplier === 'undefined') {
                console.error('Troop invalide dans calculateTurnDamage:', troop);
                continue;
            }
            
            // Vérifier si la troupe a déjà été utilisée dans ce rang
            if (this.gameState.usedTroopsThisCombat.includes(troop.id)) {
                continue; // Passer cette troupe
            }

            let unitDamage = troop.damage;
            let unitMultiplier = troop.multiplier;
            
            // Appliquer les synergies
            const synergies = this.calculateSynergies(troops);
            synergies.forEach(synergy => {
                if (synergy.bonus.target === 'all' || hasTroopType(troop, synergy.bonus.target)) {
                    if (synergy.bonus.damage) unitDamage += synergy.bonus.damage;
                    if (synergy.bonus.multiplier) unitMultiplier += synergy.bonus.multiplier;
                }
            });
            
            // Appliquer les bonus d'équipement
            const equipmentBonuses = this.calculateEquipmentBonuses();
            equipmentBonuses.forEach(bonus => {
                if (bonus.target === 'all' || hasTroopType(troop, bonus.target)) {
                    if (bonus.damage) unitDamage += bonus.damage;
                    if (bonus.multiplier) unitMultiplier += bonus.multiplier;
                }
            });
            
            // Appliquer les mécaniques de boss (après les synergies et bonus)
            if (this.gameState.currentCombat.isBossFight) {
                // Appliquer les mécaniques de boss sur les dégâts
                unitDamage = this.applyBossMechanics(unitDamage, troop);
                
                // Appliquer les mécaniques de boss sur les multiplicateurs
                const mechanic = this.gameState.currentCombat.bossMechanic;
                
                if (mechanic.includes('multiplicateurs')) {
                    unitMultiplier = Math.floor(unitMultiplier * 0.5);
                }
            }
            
            // Accumuler les dégâts et multiplicateurs
            totalDamage += unitDamage;
            totalMultiplier += unitMultiplier;
            
            // Marquer la troupe comme utilisée dans ce rang
            this.gameState.usedTroopsThisCombat.push(troop.id);
        }
        
        // Retirer les troupes utilisées du pool de combat
        this.removeUsedTroopsFromCombat(troops);
        
        // Calculer le total final
        let finalDamage = totalDamage * totalMultiplier;
        
        // Appliquer le malus de Quilegan à la fin (après tous les calculs)
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
     * @returns {Object} - Les dégâts et multiplicateur de l'unité avec tous les bonus
     */
    calculateTroopDamageWithBonuses(troop, troopsList = null) {
        // Vérification de sécurité pour éviter les erreurs
        if (!troop || typeof troop.damage === 'undefined' || typeof troop.multiplier === 'undefined') {
            console.error('Troop invalide dans calculateTroopDamageWithBonuses:', troop);
            return { damage: 0, multiplier: 0 };
        }
        
        let damage = troop.damage;
        let multiplier = troop.multiplier;
        
        // Appliquer les bonus d'équipement
        const equipmentBonuses = this.calculateEquipmentBonuses();
        equipmentBonuses.forEach(bonus => {
            if (bonus.target === 'all' || hasTroopType(troop, bonus.target)) {
                if (bonus.damage) damage += bonus.damage;
                if (bonus.multiplier) multiplier += bonus.multiplier;
            }
        });
        
        // Appliquer les synergies
        const synergies = this.calculateSynergies(troopsList);
        synergies.forEach(synergy => {
            if (synergy.bonus.target === 'all' || hasTroopType(troop, synergy.bonus.target)) {
                if (synergy.bonus.damage) damage += synergy.bonus.damage;
                if (synergy.bonus.multiplier) multiplier += synergy.bonus.multiplier;
            }
        });
        
        // Appliquer les mécaniques de boss
        if (this.gameState.currentCombat.isBossFight) {
            damage = this.applyBossMechanics(damage, troop);
            multiplier = this.applyBossMechanicsToMultiplier(multiplier, troop);
        }
        
        return { damage, multiplier };
    }

    /**
     * Appliquer les mécaniques de boss sur les multiplicateurs
     * @param {number} multiplier - Le multiplicateur de base
     * @param {Object} troop - L'unité
     * @returns {number} - Le multiplicateur modifié
     */
    applyBossMechanicsToMultiplier(multiplier, troop) {
        if (!this.gameState.currentCombat.isBossFight) {
            return multiplier;
        }
        
        const mechanic = this.gameState.currentCombat.bossMechanic;
        
        if (mechanic.includes('multiplicateurs')) {
            return Math.floor(multiplier * 0.5);
        }
        
        return multiplier;
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
     * Appliquer les mécaniques de boss sur les dégâts
     * @param {number} damage - Les dégâts de base
     * @param {Object} troop - L'unité
     * @returns {number} - Les dégâts modifiés
     */
    applyBossMechanics(damage, troop) {
        const mechanic = this.gameState.currentCombat.bossMechanic;
        
        if (mechanic.includes('corps à corps') && hasTroopType(troop, 'Corps à corps')) {
            if (mechanic.includes('-50%')) {
                return Math.floor(damage * 0.5);
            }
            if (mechanic.includes('-2')) {
                return Math.max(0, damage - 2);
            }
        }
        
        if (mechanic.includes('distance') && hasTroopType(troop, 'Distance')) {
            if (mechanic.includes('-30%')) {
                return Math.floor(damage * 0.7);
            }
        }
        
        if (mechanic.includes('magiques') && hasTroopType(troop, 'Magique')) {
            if (mechanic.includes('+50%')) {
                return Math.floor(damage * 1.5);
            }
        }
        
        return damage;
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