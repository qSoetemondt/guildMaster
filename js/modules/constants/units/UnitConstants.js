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

// Liste des éléments possibles
const ELEMENTS = ['Feu', 'Eau', 'Terre', 'Air', 'Ténèbre', 'Lumière'];
export function getRandomElement() {
    return ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
}

export const BASE_UNITS = [
    { name: 'Épéiste', type: ['Corps à corps'], damage: 5, multiplier: 2, icon: '⚔️', rarity: 'common', quantity: 5, element: getRandomElement() },
    { name: 'Archer', type: ['Distance'], damage: 4, multiplier: 3, icon: '🏹', rarity: 'common', quantity: 5, element: getRandomElement() },
    { name: 'Magicien Bleu', type: ['Magique'], damage: 3, multiplier: 4, icon: '🔵', rarity: 'uncommon', quantity: 5, element: getRandomElement() },
    { name: 'Lancier', type: ['Physique'], damage: 4, multiplier: 3, icon: '🔱', rarity: 'common', quantity: 5, element: getRandomElement() },
    { name: 'Paysan', type: ['Corps à corps'], damage: 2, multiplier: 2, icon: '👨‍🌾', rarity: 'common', quantity: 5, element: getRandomElement() },
    { name: 'Soigneur', type: ['Magique'], damage: 1, multiplier: 1, icon: '💚', rarity: 'common', quantity: 5, element: getRandomElement() },
     // unités uncommon
     { name: 'Magicien Rouge', type: ['Distance'], damage: 6, multiplier: 2, icon: '🔴', rarity: 'uncommon', quantity: 0, element: getRandomElement() },
     { name: 'Barbare', type: ['Physique'], damage: 7, multiplier: 3, icon: '🪓', rarity: 'uncommon', quantity: 0, element: getRandomElement() },
     { name: 'Viking', type: ['Corps à corps'], damage: 6, multiplier: 3, icon: '🛡️', rarity: 'uncommon', quantity: 0, element: getRandomElement() },
     // Unités rares
     { name: 'Paladin', type: ['Corps à corps'], damage: 8, multiplier: 4, icon: '⚜️', rarity: 'rare', quantity: 0, element: getRandomElement() },
     { name: 'Assassin', type: ['Physique'], damage: 3, multiplier: 6, icon: '🗡️', rarity: 'rare', quantity: 0, element: getRandomElement() },
     { name: 'Mage', type: ['Magique'], damage: 5, multiplier: 4, icon: '🔮', rarity: 'rare', quantity: 0, element: getRandomElement() },
     { name: 'Frondeur', type: ['Distance'], damage: 3, multiplier: 5, icon: '🪨', rarity: 'rare', quantity: 0, element: getRandomElement() },
     // Unités épiques
     { name: 'Chevalier', type: ['Corps à corps'], damage: 10, multiplier: 3, icon: '🐎', rarity: 'epic', quantity: 0, element: getRandomElement() },
     { name: 'Arbalétrier', type: ['Distance'], damage:7, multiplier: 4, icon: '🎯', rarity: 'epic', quantity: 0, element: getRandomElement() },
     { name: 'Sorcier', type: [ 'Magique'], damage: 5, multiplier: 5, icon: '🧙‍♂️', rarity: 'epic', quantity: 0, element: getRandomElement() },
     { name: 'Berserker', type: ['Physique'], damage: 9, multiplier: 3, icon: '😤', rarity: 'epic', quantity: 0, element: getRandomElement() },
     
     // Unités légendaires
     { name: 'Archer d\'Élite', type: ['Physique'], damage: 11, multiplier: 6, icon: '🎖️', rarity: 'legendary', quantity: 0, element: getRandomElement() },
     { name: 'Mage Suprême', type: ['Magique'], damage: 17, multiplier: 4, icon: '👑', rarity: 'legendary', quantity: 0, element: getRandomElement() },
     { name: 'Champion', type: ['Corps à corps'], damage: 22, multiplier: 3, icon: '🏆', rarity: 'legendary', quantity: 0, element: getRandomElement() }
];

// Toutes les unités disponibles dans le jeu
export const ALL_UNITS = [...BASE_UNITS]; 