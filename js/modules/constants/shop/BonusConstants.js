// Définitions centralisées des bonus d'équipement



// Fonction pour obtenir le nom traduit d'un bonus
export function getBonusDisplayName(bonusId) {
    const bonusNames = {
        'gold_bonus': 'bonus.goldBonus',
        'corps_a_corps_bonus': 'bonus.meleeBonus',
        'distance_bonus': 'bonus.rangedBonus',
        'magique_bonus': 'bonus.magicBonus',
        'epee_aiguisee': 'bonus.sharpSword',
        'arc_renforce': 'bonus.reinforcedBow',
        'grimoire_magique': 'bonus.magicGrimoire',
        'amulette_force': 'bonus.strengthAmulet',
        'cristal_precision': 'bonus.precisionCrystal',
        'orbe_mystique': 'bonus.mysticOrb',
        'potion_force': 'bonus.strengthPotion',
        'elixir_puissance': 'bonus.powerElixir',
        'armure_legendaire': 'bonus.legendaryArmor',
        'arc_divin': 'bonus.divineBow',
        'baguette_supreme': 'bonus.supremeWand',
        'relique_ancienne': 'bonus.ancientRelic',
        'cac_cest_la_vie': 'bonus.meleeIsLife',
        'economie_dune_vie': 'bonus.economyOfLife',
        'position_quatre': 'bonus.positionFour'
    };
    
    const translationKey = bonusNames[bonusId];
    return bonusId;
}

// Fonction pour obtenir la description traduite d'un bonus
export function getBonusDescription(bonusId) {
    const bonusDescriptions = {
        'gold_bonus': 'bonus.goldBonusDesc',
        'corps_a_corps_bonus': 'bonus.meleeBonusDesc',
        'distance_bonus': 'bonus.rangedBonusDesc',
        'magique_bonus': 'bonus.magicBonusDesc',
        'epee_aiguisee': 'bonus.sharpSwordDesc',
        'arc_renforce': 'bonus.reinforcedBowDesc',
        'grimoire_magique': 'bonus.magicGrimoireDesc',
        'amulette_force': 'bonus.strengthAmuletDesc',
        'cristal_precision': 'bonus.precisionCrystalDesc',
        'orbe_mystique': 'bonus.mysticOrbDesc',
        'potion_force': 'bonus.strengthPotionDesc',
        'elixir_puissance': 'bonus.powerElixirDesc',
        'armure_legendaire': 'bonus.legendaryArmorDesc',
        'arc_divin': 'bonus.divineBowDesc',
        'baguette_supreme': 'bonus.supremeWandDesc',
        'relique_ancienne': 'bonus.ancientRelicDesc',
        'cac_cest_la_vie': 'bonus.meleeIsLifeDesc',
        'economie_dune_vie': 'bonus.economyOfLifeDesc',
        'position_quatre': 'bonus.positionFourDesc'
    };
    
    const translationKey = bonusDescriptions[bonusId];
    return bonusDescriptions[bonusId] || '';
}

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
        description: '+3 dégâts pour les unités corps à corps', 
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
        description: '+5 dégâts et +4 multiplicateur pour les unités corps à corps', 
        icon: '🛡️',
        rarity: 'rare',
        basePrice: 60
    },
    'arc_divin': { 
        name: 'Arc Divin', 
        description: '+4 dégâts et +4 multiplicateur pour les unités distance', 
        icon: '🏹',
        rarity: 'rare',
        basePrice: 60
    },
    'baguette_supreme': { 
        name: 'Baguette Suprême', 
        description: '+6 dégâts et +3 multiplicateur pour les unités magiques', 
        icon: '🪄',
        rarity: 'rare',
        basePrice: 60
    },
    
    // Bonus légendaires
    'relique_ancienne': { 
        name: 'Relique Ancienne', 
        description: '+25 dégâts et +5 multiplicateur pour toutes les unités', 
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
                value: 5,
                condition: 'base'
            },
            {
                type: 'multiplier_bonus',
                target: 'melee_units',
                value: 2,
                condition: 'synergy_trigger',
                triggerSynergy: 'formation_corps_a_corps',
                triggerCount: 0
            }
        ]
    },
    'economie_dune_vie' : {
        name: 'Economie d\'une vie',
        description: 'Ce bonus donne +5 d\'or par combat. Il augmente de +2 d\'or par combat',
        icon: '💰',
        rarity: 'epic',
        basePrice: 80,
        effects: [
            {
                type: 'gold_bonus',
                value: 7,
                condition: 'base'
            },
            {
                type: 'gold_bonus',
                value: 3,
                condition: 'end_of_combat',
                triggerCount: 0
            }
        ]
    },
    
    // Bonus légendaire basé sur la position
    'position_quatre': {
        name: 'Position Quatre',
        description: 'L\'unité en 4ème position voit son multiplicateur multiplié par 2',
        icon: '🎯',
        rarity: 'legendary',
        basePrice: 120,
        effects: [
            {
                type: 'position_multiplier',
                target: 'fourth_position',
                value: 2,
                condition: 'base'
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