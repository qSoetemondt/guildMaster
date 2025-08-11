// Utilitaires pour la gestion centralisée des bonus dynamiques (compteurs, triggers, etc.)

/**
 * Récupère la valeur actuelle d'un bonus dynamique (base, synergy_trigger, end_of_combat...)
 * @param {string} bonusId
 * @param {string} key (ex: 'base', 'synergy_trigger', 'end_of_combat', ou nom de synergie)
 * @param {Object} gameState
 * @returns {number}
 */
export function getDynamicBonusValue(bonusId, key, gameState) {
    if (!gameState.dynamicBonusStates || !gameState.dynamicBonusStates[bonusId]) return 0;
    return gameState.dynamicBonusStates[bonusId][key] || 0;
}

/**
 * Incrémente le compteur d'un bonus dynamique (ex: synergie déclenchée, base, end_of_combat...)
 * @param {string} bonusId
 * @param {string} key
 * @param {Object} gameState
 * @param {number} [amount=1]
 */
export function incrementDynamicBonus(bonusId, key, gameState, amount = 1) {
    if (!gameState.dynamicBonusStates) gameState.dynamicBonusStates = {};
    if (!gameState.dynamicBonusStates[bonusId]) gameState.dynamicBonusStates[bonusId] = {};
    if (!gameState.dynamicBonusStates[bonusId][key]) gameState.dynamicBonusStates[bonusId][key] = 0;
    gameState.dynamicBonusStates[bonusId][key] += amount;
}

/**
 * Synchronise le compteur d'un bonus dynamique avec le nombre d'exemplaires possédés (utile pour les triggers de synergie)
 * @param {string} bonusId
 * @param {string} key
 * @param {Object} gameState
 * @param {number} minValue
 */
export function syncDynamicBonus(bonusId, key, gameState, minValue) {
    if (!gameState.dynamicBonusStates) gameState.dynamicBonusStates = {};
    if (!gameState.dynamicBonusStates[bonusId]) gameState.dynamicBonusStates[bonusId] = {};
    const current = gameState.dynamicBonusStates[bonusId][key] || 0;
    if (current < minValue) {
        gameState.dynamicBonusStates[bonusId][key] = minValue;
    }
}

/**
 * Réinitialise tous les compteurs de bonus dynamiques (utile en début de partie ou de combat)
 * @param {Object} gameState
 */
export function resetDynamicBonuses(gameState) {
    gameState.dynamicBonusStates = {};
} 