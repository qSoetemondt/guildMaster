/**
 * Utilitaires pour la gestion des types d'unités
 */

/**
 * Convertit un type d'unité en son abréviation d'affichage
 * @param {string} type - Le type d'unité
 * @returns {string} - L'abréviation du type
 */
export function getTypeDisplayName(type) {
    const typeMap = {
        'Corps à corps': 'CAC',
        'Distance': 'Dist.',
        'Magique': 'Mag.',
        'Physique': 'Phy.',
        'Soigneur': 'Soigneur' // Garde le nom complet pour les soigneurs
    };
    
    return typeMap[type] || type;
}

/**
 * Convertit un tableau de types en chaîne d'affichage avec abréviations
 * @param {Array|string} types - Les types d'unité
 * @returns {string} - La chaîne d'affichage avec abréviations
 */
export function getTypeDisplayString(types) {
    if (!types) return '';
    
    const typeArray = Array.isArray(types) ? types : [types];
    return typeArray.map(type => getTypeDisplayName(type)).join(' / ');
} 

/**
 * Calcule les dégâts et le multiplicateur d'une unité avec tous les bonus, synergies, position et boss.
 * @param {Object} troop - L'unité à calculer
 * @param {Object} context - { gameState, troopsList, troopIndex }
 * @returns {Object} - { damage, multiplier }
 */
export function computeUnitStatsWithBonuses(troop, context) {
    const { gameState, troopsList = null, troopIndex = null } = context;
    if (!troop || typeof troop.damage === 'undefined' || typeof troop.multiplier === 'undefined') {
        console.error('Troop invalide dans computeUnitStatsWithBonuses:', troop);
        return { damage: 0, multiplier: 0 };
    }
    let damage = troop.damage;
    let multiplier = troop.multiplier;
    // --- FUSION D'ÉLÉMENTS ---
    // Détecter les fusions d'éléments actives
    const fusionElements = [];
    const bonusDescriptions = gameState.getBonusDescriptions();
    for (const bonusId in gameState.bonuses) {
        const bonusDesc = bonusDescriptions[bonusId];
        if (bonusDesc && bonusDesc.effects) {
            for (const effect of bonusDesc.effects) {
                if (effect.type === 'fusion_element') {
                    fusionElements.push(effect.elements);
                }
            }
        }
    }
    function getFusionKey(element) {
        for (const fusion of fusionElements) {
            if (fusion.includes(element)) {
                return fusion[0];
            }
        }
        return element;
    }
    // --- FIN FUSION D'ÉLÉMENTS ---
    // Toujours recalculer les equipmentBonuses à jour (après trigger dynamique)
    const equipmentBonuses = gameState.calculateEquipmentBonuses();
    equipmentBonuses.forEach(bonus => {
        if (bonus.type !== 'position_bonus') {
            // Correction : appliquer le bonus si l'élément fusionné de la troupe correspond à celui du bonus
            if (bonus.target === 'all' ||
                (troop.element && bonus.target && getFusionKey(troop.element) === getFusionKey(bonus.target)) ||
                gameState.hasTroopType(troop, bonus.target)) {
                if (bonus.damage) damage += bonus.damage;
                if (bonus.multiplier) multiplier += bonus.multiplier;
            }
        }
    });
    // NE PAS appliquer les synergies ici !
    // Boss
    if (gameState.currentCombat && gameState.currentCombat.isBossFight) {
        damage = gameState.bossManager.applyBossMechanics(damage, troop);
        multiplier = gameState.bossManager.applyBossMechanicsToMultiplier(multiplier, troop);
    }
    // Bonus de position (4ème unité)
    const positionBonuses = gameState.calculateEquipmentBonuses().filter(bonus => bonus.type === 'position_bonus');
    if (troopsList && positionBonuses.length > 0 && troopIndex !== null && troopIndex === 3) {
        positionBonuses.forEach(bonus => {
            if (bonus.target === 'fourth_position') {
                multiplier = multiplier * bonus.positionMultiplier;
            }
        });
    }
    // Désactivation par boss (nouveaux boss)
    if (gameState.bossManager && typeof gameState.bossManager.isUnitDisabledByBoss === 'function') {
        if (gameState.bossManager.isUnitDisabledByBoss(troop)) {
            return { damage: 0, multiplier: 0 };
        }
    }
    return { damage, multiplier };
} 