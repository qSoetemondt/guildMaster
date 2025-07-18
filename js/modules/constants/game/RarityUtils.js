/**
 * Utilitaires pour la gestion des raretés
 * Centralise les fonctions getRarityIcon, getRarityColor et getRarityDisplayName
 */

/**
 * Retourne l'icône correspondant à la rareté
 * @param {string} rarity - La rareté ('common', 'uncommon', 'rare', 'epic', 'legendary')
 * @returns {string} L'icône de la rareté
 */
export function getRarityIcon(rarity) {
    const icons = {
        'common': '⚪',
        'uncommon': '🟢',
        'rare': '🔵',
        'epic': '🟣',
        'legendary': '🟡'
    };
    return icons[rarity] || '⚪';
}

/**
 * Retourne la couleur correspondant à la rareté
 * @param {string} rarity - La rareté ('common', 'uncommon', 'rare', 'epic', 'legendary')
 * @returns {string} La couleur hexadécimale de la rareté
 */
export function getRarityColor(rarity) {
    const colors = {
        'common': '#666666',
        'uncommon': '#00b894',
        'rare': '#74b9ff',
        'epic': '#a29bfe',
        'legendary': '#fdcb6e'
    };
    return colors[rarity] || '#666666';
}

/**
 * Retourne le nom d'affichage traduit de la rareté
 * @param {string} rarity - La rareté ('common', 'uncommon', 'rare', 'epic', 'legendary')
 * @returns {string} Le nom traduit de la rareté
 */
export function getRarityDisplayName(rarity) {
    const displayNames = {
        'common': 'Normale',
        'uncommon': 'Commune',
        'rare': 'Rare',
        'epic': 'Épique',
        'legendary': 'Légendaire'
    };
    return displayNames[rarity] || 'Normale';
} 