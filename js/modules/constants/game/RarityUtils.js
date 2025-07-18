/**
 * Utilitaires pour la gestion des raretés
 * Centralise les fonctions getRarityIcon, getRarityColor et getRarityDisplayName
 */

// Constantes pour les raretés
export const RARITY_LEVELS = {
    COMMON: 'common',
    UNCOMMON: 'uncommon', 
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

// Ordre des raretés pour le tri
export const RARITY_ORDER = {
    [RARITY_LEVELS.COMMON]: 1,
    [RARITY_LEVELS.UNCOMMON]: 2,
    [RARITY_LEVELS.RARE]: 3,
    [RARITY_LEVELS.EPIC]: 4,
    [RARITY_LEVELS.LEGENDARY]: 5
};

// Prix de base par rareté
export const RARITY_BASE_PRICES = {
    [RARITY_LEVELS.COMMON]: 25,
    [RARITY_LEVELS.UNCOMMON]: 30,
    [RARITY_LEVELS.RARE]: 50,
    [RARITY_LEVELS.EPIC]: 60,
    [RARITY_LEVELS.LEGENDARY]: 100
};

// Pourcentages de chance par rareté
export const RARITY_CHANCES = {
    [RARITY_LEVELS.COMMON]: 0.40,      // 40%
    [RARITY_LEVELS.UNCOMMON]: 0.25,    // 25%
    [RARITY_LEVELS.RARE]: 0.18,        // 18%
    [RARITY_LEVELS.EPIC]: 0.12,        // 12%
    [RARITY_LEVELS.LEGENDARY]: 0.05    // 5%
};

/**
 * Retourne l'icône correspondant à la rareté
 * @param {string} rarity - La rareté ('common', 'uncommon', 'rare', 'epic', 'legendary')
 * @returns {string} L'icône de la rareté
 */
export function getRarityIcon(rarity) {
    const icons = {
        [RARITY_LEVELS.COMMON]: '⚪',
        [RARITY_LEVELS.UNCOMMON]: '🟢',
        [RARITY_LEVELS.RARE]: '🔵',
        [RARITY_LEVELS.EPIC]: '🟣',
        [RARITY_LEVELS.LEGENDARY]: '🟡'
    };
    return icons[rarity] || icons[RARITY_LEVELS.COMMON];
}

/**
 * Retourne la couleur correspondant à la rareté
 * @param {string} rarity - La rareté ('common', 'uncommon', 'rare', 'epic', 'legendary')
 * @returns {string} La couleur hexadécimale de la rareté
 */
export function getRarityColor(rarity) {
    const colors = {
        [RARITY_LEVELS.COMMON]: '#666666',
        [RARITY_LEVELS.UNCOMMON]: '#00b894',
        [RARITY_LEVELS.RARE]: '#74b9ff',
        [RARITY_LEVELS.EPIC]: '#a29bfe',
        [RARITY_LEVELS.LEGENDARY]: '#fdcb6e'
    };
    return colors[rarity] || colors[RARITY_LEVELS.COMMON];
}

/**
 * Retourne le nom d'affichage traduit de la rareté
 * @param {string} rarity - La rareté ('common', 'uncommon', 'rare', 'epic', 'legendary')
 * @returns {string} Le nom traduit de la rareté
 */
export function getRarityDisplayName(rarity) {
    const displayNames = {
        [RARITY_LEVELS.COMMON]: 'Normale',
        [RARITY_LEVELS.UNCOMMON]: 'Commune',
        [RARITY_LEVELS.RARE]: 'Rare',
        [RARITY_LEVELS.EPIC]: 'Épique',
        [RARITY_LEVELS.LEGENDARY]: 'Légendaire'
    };
    return displayNames[rarity] || displayNames[RARITY_LEVELS.COMMON];
} 