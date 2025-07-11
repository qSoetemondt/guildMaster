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
        console.log(`🐛 calculateTurnDamage appelé avec ${troops.length} troupes`);
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        for (const troop of troops) {
            // Vérifier si la troupe a déjà été utilisée dans ce rang
            if (this.gameState.usedTroopsThisRank.includes(troop.id)) {
                console.log(`🐛 Troupe ${troop.name} déjà utilisée, skip`);
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
            this.gameState.usedTroopsThisRank.push(troop.id);
        }
        
        // Retirer les troupes utilisées du pool de combat
        this.removeUsedTroopsFromCombat(troops);
        
        // Calculer le total final
        let finalDamage = totalDamage * totalMultiplier;
        
        // Appliquer le malus de Quilegan à la fin (après tous les calculs)
        if (this.gameState.currentCombat && this.gameState.currentCombat.isBossFight && 
            this.gameState.currentCombat.bossMechanic.includes('Bloque les relances, les bonus, les synergies et les dégâts des unités tant qu\'aucun bonus n\'est vendu')) {
            
            console.log(`🐛 Quilegan Debug: bonusSoldThisCombat = ${this.gameState.bossManager.isBossMalusDisabled()}, finalDamage = ${finalDamage}`);
            
            if (!this.gameState.bossManager.isBossMalusDisabled()) {
                console.log(`🐛 Quilegan: Bonus non vendu, dégâts mis à 0 (était ${finalDamage})`);
                finalDamage = 0;
            } else {
                console.log(`🐛 Quilegan: Bonus vendu, dégâts normaux (${finalDamage})`);
            }
        }
        
        return Math.round(finalDamage);
    }

    /**
     * Calculer les dégâts d'une unité individuelle
     * @param {Object} troop - L'unité à calculer
     * @param {Array} troopsList - Liste des troupes pour les bonus (optionnel)
     * @returns {number} - Les dégâts de l'unité
     */
    calculateTroopDamage(troop, troopsList = null) {
        let damage = troop.damage;
        let multiplier = troop.multiplier;
        
        // BONUS SOIGNEUR : chaque soigneur sélectionné donne +1 dégâts à tous
        const selectedTroops = troopsList || this.gameState.selectedTroops || [];
        const healerCount = selectedTroops.filter(t => Array.isArray(t.type) ? t.type.includes('Soigneur') : t.type === 'Soigneur').length;
        if (healerCount > 0) {
            damage += healerCount;
        }
        
        // Appliquer les synergies d'équipe
        const synergies = this.calculateSynergies();
        synergies.forEach(synergy => {
            if (synergy.bonus.target === troop.type || !synergy.bonus.target) {
                if (synergy.bonus.damage) {
                    damage += synergy.bonus.damage;
                }
                if (synergy.bonus.multiplier) {
                    multiplier += synergy.bonus.multiplier;
                }
            }
        });
        
        return damage * multiplier;
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
            
            // Si c'est une unité achetée/transformée (permanente), la remettre seulement dans availableTroops
            if (this.isPermanentUnit(usedTroop)) {
                // Vérifier qu'elle n'est pas déjà dans availableTroops
                const existingAvailableIndex = this.gameState.availableTroops.findIndex(troop => troop.id === usedTroop.id);
                if (existingAvailableIndex === -1) {
                    this.gameState.availableTroops.push(usedTroop);
                }
                // NE PAS remettre dans combatTroops pour éviter qu'elle apparaisse automatiquement
            }
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
        console.log(`⚔️ Calcul des dégâts pour ${troops.length} troupes`);
        
        // Afficher les troupes utilisées
        console.log(`🎯 Troupes utilisées dans ce tour:`);
        troops.forEach((troop, index) => {
            console.log(`  ${index + 1}. ${troop.name} - 💥${troop.damage} ×⚡${troop.multiplier} = ${troop.damage * troop.multiplier} puissance`);
        });
        
        // Calculer les synergies actives
        const synergies = this.calculateSynergies(troops);
        if (synergies && synergies.length > 0) {
            console.log(`🔗 Synergies actives:`);
            synergies.forEach(synergy => {
                console.log(`  • ${synergy.name}: ${synergy.description}`);
            });
        } else {
            console.log(`❌ Aucune synergie active`);
        }
        
        // Calculer les bonus d'équipement
        const equipmentBonuses = this.calculateEquipmentBonuses();
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
        const turnDamage = this.calculateTurnDamage(troops);
        
        console.log(`💥 DÉGÂTS FINAUX: ${turnDamage}`);
        
        return {
            damage: turnDamage,
            synergies: synergies,
            bonuses: equipmentBonuses
        };
    }
} 