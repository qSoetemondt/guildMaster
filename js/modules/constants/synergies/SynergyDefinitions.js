// Définitions des synergies du jeu
export const SYNERGY_DEFINITIONS = {
    // Synergies de base (3 unités requises)
    'Formation Corps à Corps': {
        name: 'Formation Corps à Corps',
        description: '+{bonus} multiplicateur pour toutes les unités corps à corps (Niveau {level})',
        requiredType: 'Corps à corps',
        requiredCount: 3,
        baseBonus: 3,
        bonusType: 'multiplier',
        target: 'Corps à corps'
    },
    
    'Formation Distance': {
        name: 'Formation Distance',
        description: '+{bonus} multiplicateur pour toutes les unités distance (Niveau {level})',
        requiredType: 'Distance',
        requiredCount: 3,
        baseBonus: 3,
        bonusType: 'multiplier',
        target: 'Distance'
    },
    
    'Formation Magique': {
        name: 'Formation Magique',
        description: '+{bonus} multiplicateur pour toutes les unités magiques (Niveau {level})',
        requiredType: 'Magique',
        requiredCount: 3,
        baseBonus: 3,
        bonusType: 'multiplier',
        target: 'Magique'
    },
    
    // Synergies avancées (5 unités requises)
    'Horde Corps à Corps': {
        name: 'Horde Corps à Corps',
        description: '+{damage} dégâts et +{multiplier} multiplicateur pour toutes les unités corps à corps (Niveau {level})',
        requiredType: 'Corps à corps',
        requiredCount: 5,
        baseDamageBonus: 6,
        baseMultiplierBonus: 6,
        bonusType: 'mixed',
        target: 'Corps à corps'
    },
    
    'Volée de Flèches': {
        name: 'Volée de Flèches',
        description: '+{damage} dégâts et +{multiplier} multiplicateur pour toutes les unités distance (Niveau {level})',
        requiredType: 'Distance',
        requiredCount: 5,
        baseDamageBonus: 8,
        baseMultiplierBonus: 4,
        bonusType: 'mixed',
        target: 'Distance'
    },
    
    'Tempête Magique': {
        name: 'Tempête Magique',
        description: '+{damage} dégâts et +{multiplier} multiplicateur pour toutes les unités magiques (Niveau {level})',
        requiredType: 'Magique',
        requiredCount: 5,
        baseDamageBonus: 10,
        baseMultiplierBonus: 3,
        bonusType: 'mixed',
        target: 'Magique'
    },
    
    // Synergies mixtes
    'Tactique Mixte': {
        name: 'Tactique Mixte',
        description: '+{bonus} dégâts pour toutes les unités (Niveau {level})',
        requiredTypes: ['Corps à corps', 'Distance'],
        requiredCounts: [3, 3],
        baseBonus: 6,
        bonusType: 'damage',
        target: 'all'
    },
    
    'Force Physique': {
        name: 'Force Physique',
        description: '+{bonus} dégâts pour toutes les unités physiques (Niveau {level})',
        requiredType: 'Physique',
        requiredCount: 6,
        baseBonus: 12,
        bonusType: 'damage',
        target: 'Physique'
    }
};

// Synergies spéciales (non basées sur les niveaux)
export const SPECIAL_SYNERGIES = {
    'Présence de Soigneur': {
        name: 'Présence de Soigneur',
        description: '+{bonus * 3} dégâts pour toute l\'équipe (Soigneur)',
        requiredType: 'Soigneur',
        requiredCount: 1,
        bonusType: 'damage',
        target: 'all',
        isSpecial: true
    },
    
    'Sainte Trinité': {
        name: 'Sainte Trinité',
        description: '+5 dégâts et +3 multiplicateur pour toute l\'équipe',
        requiredTypes: ['Corps à corps', 'Distance', 'Soigneur'],
        requiredCounts: [1, 1, 1],
        bonusType: 'fixed',
        damageBonus: 3,
        multiplierBonus: 2,
        target: 'all',
        isSpecial: true
    }
};

// Fonction pour calculer le bonus d'une synergie selon son niveau
export const calculateSynergyBonus = (synergyName, level = 1) => {
    const synergy = SYNERGY_DEFINITIONS[synergyName];
    if (!synergy) return null;
    
    const result = {
        name: synergy.name,
        description: synergy.description,
        level: level,
        target: synergy.target
    };
    
    switch (synergy.bonusType) {
        case 'multiplier':
            result.bonus = synergy.baseBonus + (level - 1);
            result.description = synergy.description
                .replace('{bonus}', result.bonus)
                .replace('{level}', level);
            break;
            
        case 'damage':
            result.bonus = synergy.baseBonus + (level - 1);
            result.description = synergy.description
                .replace('{bonus}', result.bonus)
                .replace('{level}', level);
            break;
            
        case 'mixed':
            result.damage = synergy.baseDamageBonus + (level - 1);
            result.multiplier = synergy.baseMultiplierBonus + (level - 1);
            result.description = synergy.description
                .replace('{damage}', result.damage)
                .replace('{multiplier}', result.multiplier)
                .replace('{level}', level);
            break;
    }
    
    return result;
};

// Fonction pour vérifier si une synergie est activée
export const checkSynergyActivation = (synergyName, typeCounts) => {
    const synergy = SYNERGY_DEFINITIONS[synergyName];
    if (!synergy) return false;
    
    if (synergy.requiredTypes) {
        // Synergie avec plusieurs types requis
        return synergy.requiredTypes.every((type, index) => {
            const requiredCount = synergy.requiredCounts[index];
            return (typeCounts[type] || 0) >= requiredCount;
        });
    } else {
        // Synergie avec un seul type requis
        const count = typeCounts[synergy.requiredType] || 0;
        return count >= synergy.requiredCount;
    }
}; 