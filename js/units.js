// Définition de toutes les unités du jeu
const UNITS = {
    // Unités de base
    epéiste: {
        name: 'Épéiste',
        type: ['Corps à corps', 'Physique'],
        damage: 5,
        multiplier: 2,
        icon: '⚔️',
        rarity: 'common',
        description: 'Unité de base équilibrée'
    },
    
    archer: {
        name: 'Archer',
        type: ['Distance', 'Physique'],
        damage: 4,
        multiplier: 3,
        icon: '🏹',
        rarity: 'common',
        description: 'Attaque à distance avec précision'
    },
    
    magicienRouge: {
        name: 'Magicien Rouge',
        type: ['Distance', 'Magique'],
        damage: 6,
        multiplier: 2,
        icon: '🔴',
        rarity: 'uncommon',
        description: 'Magie de feu destructrice'
    },
    
    magicienBleu: {
        name: 'Magicien Bleu',
        type: ['Corps à corps', 'Magique'],
        damage: 3,
        multiplier: 4,
        icon: '🔵',
        rarity: 'uncommon',
        description: 'Magie de glace avec multiplicateur élevé'
    },
    
    lancier: {
        name: 'Lancier',
        type: ['Corps à corps', 'Physique'],
        damage: 4,
        multiplier: 3,
        icon: '🔱',
        rarity: 'common',
        description: 'Attaque avec une lance'
    },
    
    Paysan: {
        name: 'Paysan',
        type: ['Corps à corps', 'Physique'],
        damage: 2,
        multiplier: 1,
        icon: '👨‍🌾',
        rarity: 'common',
        description: 'Paysan armés de fourches et d\'outils'
    },
    
    barbare: {
        name: 'Barbare',
        type: ['Corps à corps', 'Physique'],
        damage: 7,
        multiplier: 1,
        icon: '🪓',
        rarity: 'uncommon',
        description: 'Dégâts élevés, multiplicateur faible'
    },
    
    viking: {
        name: 'Viking',
        type: ['Corps à corps', 'Physique'],
        damage: 6,
        multiplier: 2,
        icon: '🛡️',
        rarity: 'uncommon',
        description: 'Guerrier nordique robuste'
    },
    
    fronde: {
        name: 'Fronde',
        type: ['Distance', 'Physique'],
        damage: 2,
        multiplier: 5,
        icon: '🪨',
        rarity: 'rare',
        description: 'Multiplicateur très élevé'
    },

    // Unités spéciales
    paladin: {
        name: 'Paladin',
        type: ['Corps à corps', 'Physique'],
        damage: 8,
        multiplier: 2,
        icon: '⚜️',
        rarity: 'rare',
        description: 'Guerrier sacré puissant'
    },
    
    assassin: {
        name: 'Assassin',
        type: ['Corps à corps', 'Physique'],
        damage: 3,
        multiplier: 6,
        icon: '🗡️',
        rarity: 'rare',
        description: 'Attaques critiques dévastatrices'
    },
    
    mage: {
        name: 'Mage',
        type: ['Distance', 'Magique'],
        damage: 5,
        multiplier: 4,
        icon: '🔮',
        rarity: 'rare',
        description: 'Magie pure et puissante'
    },
    
    chevalier: {
        name: 'Chevalier',
        type: ['Corps à corps', 'Physique'],
        damage: 9,
        multiplier: 1,
        icon: '🐎',
        rarity: 'epic',
        description: 'Défenseur d\'élite'
    },
    
    arbalétrier: {
        name: 'Arbalétrier',
        type: ['Distance', 'Physique'],
        damage: 8,
        multiplier: 2,
        icon: '🎯',
        rarity: 'epic',
        description: 'Arbalète de précision'
    },
    
    sorcier: {
        name: 'Sorcier',
        type: ['Distance', 'Magique'],
        damage: 4,
        multiplier: 5,
        icon: '🧙‍♂️',
        rarity: 'epic',
        description: 'Magie ancienne et mystérieuse'
    },
    
    berserker: {
        name: 'Berserker',
        type: ['Corps à corps', 'Physique'],
        damage: 10,
        multiplier: 1,
        icon: '😤',
        rarity: 'epic',
        description: 'Rage de combat maximale'
    },
    
    archerElite: {
        name: 'Archer d\'Élite',
        type: ['Distance', 'Physique'],
        damage: 6,
        multiplier: 4,
        icon: '🎖️',
        rarity: 'legendary',
        description: 'Archer d\'exception'
    },
    
    mageSupreme: {
        name: 'Mage Suprême',
        type: ['Distance', 'Magique', 'Corps à corps'],
        damage: 7,
        multiplier: 5,
        icon: '👑',
        rarity: 'legendary',
        description: 'Maître de la magie'
    },
    
    champion: {
        name: 'Champion',
        type: ['Corps à corps', 'Physique', 'Magique'],
        damage: 12,
        multiplier: 2,
        icon: '🏆',
        rarity: 'legendary',
        description: 'Le plus puissant des guerriers'
    }
};

// Fonction pour obtenir une unité aléatoire selon la rareté
function getRandomUnit(rank = 'F-') {
    const rankIndex = GameState.RANKS.indexOf(rank);
    
    // Définir les probabilités selon le rang
    let commonChance = 0.6;
    let uncommonChance = 0.3;
    let rareChance = 0.08;
    let epicChance = 0.015;
    let legendaryChance = 0.005;
    
    // Augmenter les chances de rareté avec le rang
    if (rankIndex > 5) { // Après E+
        commonChance -= 0.1;
        uncommonChance += 0.05;
        rareChance += 0.03;
        epicChance += 0.015;
        legendaryChance += 0.005;
    }
    
    if (rankIndex > 10) { // Après C+
        commonChance -= 0.1;
        uncommonChance -= 0.05;
        rareChance += 0.1;
        epicChance += 0.03;
        legendaryChance += 0.02;
    }
    
    if (rankIndex > 15) { // Après A+
        commonChance = 0.3;
        uncommonChance = 0.3;
        rareChance = 0.25;
        epicChance = 0.1;
        legendaryChance = 0.05;
    }
    
    const rand = Math.random();
    let targetRarity;
    
    if (rand < commonChance) targetRarity = 'common';
    else if (rand < commonChance + uncommonChance) targetRarity = 'uncommon';
    else if (rand < commonChance + uncommonChance + rareChance) targetRarity = 'rare';
    else if (rand < commonChance + uncommonChance + rareChance + epicChance) targetRarity = 'epic';
    else targetRarity = 'legendary';
    
    // Filtrer les unités par rareté
    const unitsOfRarity = Object.values(UNITS).filter(unit => unit.rarity === targetRarity);
    
    if (unitsOfRarity.length === 0) {
        // Fallback vers les unités communes
        return Object.values(UNITS).filter(unit => unit.rarity === 'common')[0];
    }
    
    return unitsOfRarity[Math.floor(Math.random() * unitsOfRarity.length)];
}

// Fonction pour obtenir plusieurs unités aléatoires
function getRandomUnits(count, rank = 'F-') {
    const units = [];
    for (let i = 0; i < count; i++) {
        units.push(getRandomUnit(rank));
    }
    return units;
}



// Fonction pour obtenir le coût de recrutement selon la rareté
function getRecruitCost(rarity) {
    const costs = {
        common: 50,
        uncommon: 75,
        rare: 125,
        epic: 200,
        legendary: 350
    };
    return costs[rarity] || 50;
} 