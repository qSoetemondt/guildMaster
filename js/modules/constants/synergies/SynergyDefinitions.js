// Définitions des synergies du jeu
export const SYNERGY_DEFINITIONS = {
    
    // Synergies de base (3 unités requises)
    // Synergies avancées (5 unités requises)
    'Horde Corps à Corps': {
        name: 'Horde Corps à Corps',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredType: 'Corps à corps',
        requiredCount: 5,
        baseDamageBonus: 100,
        baseMultiplierBonus: 3,
        damagePerLevel: 10,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'Corps à corps',
        priority: 2
    },
    'Horde Physique': {
        name: 'Horde Physique',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredType: 'Physique',
        requiredCount: 5,
        baseDamageBonus: 150,
        baseMultiplierBonus: 2,
        damagePerLevel: 10,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'Physique',
        priority: 2
    },
    
    'Volée de Flèches': {
        name: 'Volée de Flèches',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredType: 'Distance',
        requiredCount: 5,
        baseDamageBonus: 50,
        baseMultiplierBonus: 6,
        damagePerLevel: 10,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'Distance',
        priority: 2
    },
    
    'Tempête Magique': {
        name: 'Tempête Magique',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredType: 'Magique',
        requiredCount: 5,
        baseDamageBonus: 30,
        baseMultiplierBonus: 10,
        damagePerLevel: 10,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'Magique',
        priority: 2
    },
    
    'Ouragan' : {
        name: 'Ouragan',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredElement: 'Air',
        requiredCount: 4,
        baseDamageBonus: 100,
        baseMultiplierBonus: 4,
        damagePerLevel: 15,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'all',
        priority: 3
    },
    'Séisme' : {
        name: 'Séisme',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredElement: 'Terre',
        requiredCount: 4,
        baseDamageBonus: 200,
        baseMultiplierBonus: 2,
        damagePerLevel: 15,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'all',
        priority: 3
    },
    'Incendie' : {
        name: 'Incendie',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredElement: 'Feu',
        requiredCount: 4,
        baseDamageBonus: 80,
        baseMultiplierBonus: 5,
        damagePerLevel: 15,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'all',
        priority: 3
    },
    'Inondation' : {
        name: 'Inondation',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredElement: 'Eau',
        requiredCount: 4,
        baseDamageBonus: 40,
        baseMultiplierBonus: 10,
        damagePerLevel: 15,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'all',
        priority: 3
    },
    'Bénédiction' : {
        name: 'Bénédiction',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredElement: 'Lumière',
        requiredCount: 4,
        baseDamageBonus: 20,
        baseMultiplierBonus: 20,
        damagePerLevel: 15,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'all',
        priority: 3
    },
    'Malédiction' : {
        name: 'Malédiction',
        description: '+{damage} dégâts et +{multiplier} multiplicateurs (Niveau {level})',
        requiredElement: 'Ténèbres',
        requiredCount: 4,
        baseDamageBonus: 10,
        baseMultiplierBonus: 40,
        damagePerLevel: 15,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'all',
        priority: 3
    },
    'Elementaire': {
        name: 'Elementaire',
        description: '+{damage} dégâts et +{multiplier} multiplicateur pour toutes les unités disposant des éléments feu, eau, terre et air (Niveau {level})',
        requiredElement: ['Feu', 'Eau', 'Terre', 'Air'],
        requiredCount: [1,1,1,1],
        baseDamageBonus: 80,
        baseMultiplierBonus: 10,
        damagePerLevel: 20,
        multiplierPerLevel: 2,
        bonusType: 'mixed',
        target: 'all',
        priority: 4
    },
    'Chaos': {
        name: 'Chaos',
        description: '+{damage} dégâts et +{multiplier} multiplicateur pour toutes les unités disposant de l\'élément ténèbres et lumière (Niveau {level})',
        requiredElement: ['Lumière', 'Ténèbre'],
        requiredCount: [2,2],
        baseDamageBonus: 100,
        baseMultiplierBonus: 10,
        damagePerLevel: 25,
        multiplierPerLevel: 2,
        bonusType: 'mixed',
        target: 'all',
        priority: 5
    },
    'RAID': {
        name: 'RAID',
        description: '+{damage} dégâts et +{multiplier} multiplicateur pour toute l\'équipe (Niveau {level})',
        requiredTypes: ['Corps à corps', 'Distance', 'Magique', 'Physique'],
        requiredCounts: [1, 1, 1, 1],
        bonusType: 'mixed',
        baseDamageBonus: 150,
        baseMultiplierBonus: 10,
        damagePerLevel: 25,
        multiplierPerLevel: 3,
        target: 'all',
        isSpecial: true,
        priority: 6
    },
    'All in One': {
        name: 'All in One',
        description: '+{damage} dégâts et +{multiplier} multiplicateur pour toutes les unités (Niveau {level})',
        requiredTypes: ['Corps à corps', 'Distance', 'Magique', 'Physique'],
        requiredTypesCounts: [1, 1, 1, 1],
        requiredElements: ['Feu', 'Eau', 'Terre', 'Air'],
        requiredElementsCounts: [1, 1, 1, 1],
        requiredCount: 4,
        baseDamageBonus: 200,
        baseMultiplierBonus: 15,
        damagePerLevel: 30,
        multiplierPerLevel: 3,
        bonusType: 'mixed',
        target: 'all',
        priority: 7
    },
    'Duo': {
        name: 'Duo',
        description: '+{damage} dégâts et +{multiplier} multiplicateur si deux unités ont le même type',
        requiredType: 'any',
        requiredCount: 2,
        baseDamageBonus: 20,
        baseMultiplierBonus: 1,
        damagePerLevel: 5,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'all',
        priority: 0
    },
    'Doublon': {
        name: 'Doublon',
        description: '+{damage} dégâts et +{multiplier} multiplicateur si deux unités ont le même élément',
        requiredElement: 'any',
        requiredCount: 2,
        baseDamageBonus: 20,
        baseMultiplierBonus: 1,
        damagePerLevel: 5,
        multiplierPerLevel: 1,
        bonusType: 'mixed',
        target: 'all',
        priority: 0
    },
    'Trio': {
        name: 'Trio',
        description: '+{damage} dégâts et +{multiplier} multiplicateur si trois unités ont le même type',
        requiredType: 'any',
        requiredCount: 3,
        baseDamageBonus: 50,
        baseMultiplierBonus: 2,
        damagePerLevel: 5,
        multiplierPerLevel: 2,
        bonusType: 'mixed',
        target: 'all',
        priority: 1
    },
    'Triplette': {
        name: 'Triplette',
        description: '+{damage} dégâts et +{multiplier} multiplicateur si trois unités ont le même élément',
        requiredElement: 'any',
        requiredCount: 3,
        baseDamageBonus: 50,
        baseMultiplierBonus: 2,
        damagePerLevel: 5,
        multiplierPerLevel: 2,
        bonusType: 'mixed',
        target: 'all',
        priority: 1
    }
};

// Synergies spéciales (non basées sur les niveaux)
export const SPECIAL_SYNERGIES = {
    
    
};

// Fonction pour calculer le bonus d'une synergie selon son niveau
export const calculateSynergyBonus = (synergyName, level = 1) => {
    let synergy = SYNERGY_DEFINITIONS[synergyName];
    if (!synergy) {
        synergy = SPECIAL_SYNERGIES[synergyName];
    }
    if (!synergy) return null;
    
    const result = {
        name: synergy.name,
        description: synergy.description,
        level: level
    };
    
    switch (synergy.bonusType) {
        case 'multiplier': {
            const bonus = synergy.baseBonus + (level - 1);
            result.bonus = {
                multiplier: bonus,
                target: synergy.target
            };
            result.description = synergy.description
                .replace('{bonus}', bonus)
                .replace('{level}', level);
            break;
        }
        case 'damage': {
            const bonus = synergy.baseBonus + (level - 1);
            result.bonus = {
                damage: bonus,
                target: synergy.target
            };
            result.description = synergy.description
                .replace('{bonus}', bonus)
                .replace('{level}', level);
            break;
        }
        case 'mixed': {
            const damage = synergy.baseDamageBonus + (level - 1) * synergy.damagePerLevel || 1;
            const multiplier = synergy.baseMultiplierBonus + (level - 1) * synergy.multiplierPerLevel || 1;
            result.bonus = {
                damage: damage,
                multiplier: multiplier,
                target: synergy.target
            };
            result.description = synergy.description
                .replace('{damage}', damage)
                .replace('{multiplier}', multiplier)
                .replace('{level}', level);
            break;
        }
        case 'fixed': {
            // Pour RAID et autres synergies spéciales à bonus fixe
            result.bonus = {
                damage: synergy.damageBonus,
                multiplier: synergy.multiplierBonus,
                target: synergy.target
            };
            // On garde la description telle quelle
            break;
        }
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