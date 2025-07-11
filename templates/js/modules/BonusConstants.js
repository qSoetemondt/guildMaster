// Définitions centralisées des bonus d'équipement
export const BONUS_DESCRIPTIONS = {
    // Bonus de base
    'gold_bonus': { 
        name: 'Bonus Or', 
        description: '+25 or par combat', 
        icon: '💰',
        rarity: 'common',
        basePrice: 30
    },
    'corps_a_corps_bonus': { 
        name: 'Bonus Corps à corps', 
        description: '+10 dégâts par combat', 
        icon: '⚔️',
        rarity: 'common',
        basePrice: 30
    },
    'distance_bonus': { 
        name: 'Bonus Distance', 
        description: '+10 dégâts par combat', 
        icon: '🏹',
        rarity: 'common',
        basePrice: 30
    },
    'magique_bonus': { 
        name: 'Bonus Magique', 
        description: '+10 dégâts par combat', 
        icon: '🔮',
        rarity: 'common',
        basePrice: 30
    },
    
    // Bonus d'équipement communs
    'epee_aiguisee': { 
        name: 'Épée Aiguisée', 
        description: '+2 dégâts pour les unités corps à corps', 
        icon: '⚔️',
        rarity: 'common',
        basePrice: 25
    },
    'arc_renforce': { 
        name: 'Arc Renforcé', 
        description: '+2 dégâts pour les unités distance', 
        icon: '🏹',
        rarity: 'common',
        basePrice: 25
    },
    'grimoire_magique': { 
        name: 'Grimoire Magique', 
        description: '+2 dégâts pour les unités magiques', 
        icon: '📚',
        rarity: 'common',
        basePrice: 25
    },
    
    // Bonus d'équipement rares
    'amulette_force': { 
        name: 'Amulette de Force', 
        description: '+1 multiplicateur pour les unités corps à corps', 
        icon: '💎',
        rarity: 'uncommon',
        basePrice: 40
    },
    'cristal_precision': { 
        name: 'Cristal de Précision', 
        description: '+1 multiplicateur pour les unités distance', 
        icon: '💎',
        rarity: 'uncommon',
        basePrice: 40
    },
    'orbe_mystique': { 
        name: 'Orbe Mystique', 
        description: '+1 multiplicateur pour les unités magiques', 
        icon: '🔮',
        rarity: 'uncommon',
        basePrice: 40
    },
    'potion_force': { 
        name: 'Potion de Force', 
        description: '+3 dégâts pour toutes les unités', 
        icon: '🧪',
        rarity: 'uncommon',
        basePrice: 40
    },
    'elixir_puissance': { 
        name: 'Élixir de Puissance', 
        description: '+1 multiplicateur pour toutes les unités', 
        icon: '🧪',
        rarity: 'uncommon',
        basePrice: 40
    },
    
    // Bonus d'équipement très rares
    'armure_legendaire': { 
        name: 'Armure Légendaire', 
        description: '+5 dégâts et +2 multiplicateur pour les unités corps à corps', 
        icon: '🛡️',
        rarity: 'rare',
        basePrice: 60
    },
    'arc_divin': { 
        name: 'Arc Divin', 
        description: '+5 dégâts et +2 multiplicateur pour les unités distance', 
        icon: '🏹',
        rarity: 'rare',
        basePrice: 60
    },
    'baguette_supreme': { 
        name: 'Baguette Suprême', 
        description: '+5 dégâts et +2 multiplicateur pour les unités magiques', 
        icon: '🪄',
        rarity: 'rare',
        basePrice: 60
    },
    
    // Bonus légendaires
    'relique_ancienne': { 
        name: 'Relique Ancienne', 
        description: '+10 dégâts et +3 multiplicateur pour toutes les unités', 
        icon: '🏛️',
        rarity: 'legendary',
        basePrice: 100
    },
    
    // Bonus dynamiques
    'cac_cest_la_vie': {
        name: 'Le CAC c\'est la vie',
        description: 'Augmente les multiplicateurs de +1 des unités de corps à corps. +1 bonus supplémentaire à chaque activation de Formation Corps à Corps.',
        icon: '🥊',
        rarity: 'epic',
        basePrice: 80,
        effects: [
            {
                type: 'multiplier_bonus',
                target: 'melee_units',
                value: 1,
                condition: 'base'
            },
            {
                type: 'multiplier_bonus',
                target: 'melee_units',
                value: 1,
                condition: 'synergy_trigger',
                triggerSynergy: 'formation_corps_a_corps',
                triggerCount: 0
            }
        ]
    }
};

// Fonction pour calculer le prix d'un bonus
export const calculateBonusPrice = (bonusId) => {
    const bonus = BONUS_DESCRIPTIONS[bonusId];
    if (!bonus) return Math.ceil(50 * 1.75); // Prix par défaut
    
    // Prix augmentés de 75% pour équilibrer l'économie
    return Math.ceil(bonus.basePrice * 1.75);
};

// Fonction pour obtenir la rareté d'un bonus
export const getBonusRarity = (bonusId) => {
    const bonus = BONUS_DESCRIPTIONS[bonusId];
    return bonus ? bonus.rarity : 'common';
}; 