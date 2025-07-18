// Définition des unités de base avec quantités configurables
// Exemple d'ajustement des quantités :
// - Réduire les unités communes pour plus de rareté
// - Augmenter les unités spécialisées pour plus de variété
// - Équilibrer selon les besoins du gameplay

// Fonction pour obtenir le nom traduit d'une unité
export function getUnitDisplayName(unitName) {
    const unitNames = {
        'Épéiste': 'units.swordsman',
        'Archer': 'units.archer',
        'Magicien Bleu': 'units.blueMage',
        'Lancier': 'units.lancer',
        'Paysan': 'units.peasant',
        'Soigneur': 'units.healer',
        'Magicien Rouge': 'units.redMage',
        'Barbare': 'units.barbarian',
        'Viking': 'units.viking',
        'Paladin': 'units.paladin',
        'Assassin': 'units.assassin',
        'Mage': 'units.mage',
        'Frondeur': 'units.slinger',
        'Chevalier': 'units.knight',
        'Arbalétrier': 'units.crossbowman',
        'Sorcier': 'units.sorcerer',
        'Berserker': 'units.berserker',
        'Archer d\'Élite': 'units.eliteArcher',
        'Mage Suprême': 'units.supremeMage',
        'Champion': 'units.champion'
    };
    
    const translationKey = unitNames[unitName];
    return unitName;
}

export const BASE_UNITS = [
    { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, icon: '⚔️', rarity: 'common', quantity: 5 },
    { name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3, icon: '🏹', rarity: 'common', quantity: 5 },
    { name: 'Magicien Bleu', type: ['Distance', 'Magique'], damage: 3, multiplier: 4, icon: '🔵', rarity: 'uncommon', quantity: 5 },
    { name: 'Lancier', type: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, icon: '🔱', rarity: 'common', quantity: 5 },
    { name: 'Paysan', type: ['Corps à corps', 'Physique'], damage: 2, multiplier: 2, icon: '👨‍🌾', rarity: 'common', quantity: 5 },
    { name: 'Soigneur', type: ['Soigneur', 'Magique'], damage: 1, multiplier: 1, icon: '💚', rarity: 'common', quantity: 5 },
     // unités uncommon
     { name: 'Magicien Rouge', type: ['Distance', 'Magique'], damage: 6, multiplier: 2, icon: '🔴', rarity: 'uncommon', quantity: 0 },
     { name: 'Barbare', type: ['Corps à corps', 'Physique'], damage: 7, multiplier: 3, icon: '🪓', rarity: 'uncommon', quantity: 0 },
     { name: 'Viking', type: ['Corps à corps', 'Physique'], damage: 6, multiplier: 3, icon: '🛡️', rarity: 'uncommon', quantity: 0 },
     // Unités rares
     { name: 'Paladin', type: ['Corps à corps', 'Physique'], damage: 8, multiplier: 4, icon: '⚜️', rarity: 'rare', quantity: 0 },
     { name: 'Assassin', type: ['Corps à corps', 'Physique'], damage: 3, multiplier: 6, icon: '🗡️', rarity: 'rare', quantity: 0 },
     { name: 'Mage', type: ['Distance', 'Magique'], damage: 5, multiplier: 4, icon: '🔮', rarity: 'rare', quantity: 0 },
     { name: 'Frondeur', type: ['Distance', 'Physique'], damage: 3, multiplier: 5, icon: '🪨', rarity: 'rare', quantity: 0 },
     // Unités épiques
     { name: 'Chevalier', type: ['Corps à corps', 'Physique'], damage: 10, multiplier: 3, icon: '🐎', rarity: 'epic', quantity: 0 },
     { name: 'Arbalétrier', type: ['Distance', 'Physique'], damage:7, multiplier: 4, icon: '🎯', rarity: 'epic', quantity: 0 },
     { name: 'Sorcier', type: ['Distance', 'Magique'], damage: 5, multiplier: 5, icon: '🧙‍♂️', rarity: 'epic', quantity: 0 },
     { name: 'Berserker', type: ['Corps à corps', 'Physique'], damage: 9, multiplier: 3, icon: '😤', rarity: 'epic', quantity: 0 },
     
     // Unités légendaires
     { name: 'Archer d\'Élite', type: ['Distance', 'Physique'], damage: 11, multiplier: 6, icon: '🎖️', rarity: 'legendary', quantity: 0 },
     { name: 'Mage Suprême', type: ['Distance', 'Magique', 'Corps à corps'], damage: 17, multiplier: 4, icon: '👑', rarity: 'legendary', quantity: 0 },
     { name: 'Champion', type: ['Corps à corps', 'Physique', 'Magique'], damage: 22, multiplier: 3, icon: '🏆', rarity: 'legendary', quantity: 0 }
];

// Toutes les unités disponibles dans le jeu
export const ALL_UNITS = [...BASE_UNITS]; 