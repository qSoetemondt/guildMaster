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