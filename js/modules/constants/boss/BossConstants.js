// Boss disponibles

// Constantes pour les malus de boss
export const BOSS_MALUS_VALUES = {
    GOLEM_DAMAGE_REDUCTION: 50,    // -50% de dégâts corps à corps
    DRAGON_DAMAGE_REDUCTION: 30,   // -30% de dégâts distance
    LICHE_DAMAGE_REDUCTION: 2,     // -2 dégâts corps à corps
    TITAN_MULTIPLIER_REDUCTION: 50, // -50% multiplicateurs (réduits de moitié)
    DEMON_DAMAGE_BONUS: 50         // +50% de dégâts magiques
};

// Fonction pour obtenir le nom traduit d'un boss
export function getBossDisplayName(bossName) {
    const bossNames = {
        'Golem de Pierre': 'boss.stoneGolem',
        'Dragon de Glace': 'boss.iceDragon',
        'Liche': 'boss.liche',
        'Titan': 'boss.titan',
        'Démon': 'boss.demon',
        'Quilegan': 'boss.quilegan'
    };
    
    const translationKey = bossNames[bossName];
    return bossName;
}

// Fonction pour obtenir la mécanique traduite d'un boss
export function getBossMechanic(bossName) {
    const bossMechanics = {
        'Golem de Pierre': 'boss.stoneGolemMechanic',
        'Dragon de Glace': 'boss.iceDragonMechanic',
        'Liche': 'boss.licheMechanic',
        'Titan': 'boss.titanMechanic',
        'Démon': 'boss.demonMechanic',
        'Quilegan': 'boss.quileganMechanic'
    };
    
    const translationKey = bossMechanics[bossName];
    return bossMechanics[bossName] || '';
}

export const BOSSES = [
    { name: 'Golem de Pierre', mechanic: 'Les unités corps à corps sont désactivées', targetDamage: 2500, icon: '🗿' },
    { name: 'Dragon de Glace', mechanic: 'Les unités distance sont désactivées', targetDamage: 4000, icon: '❄️' },
    { name: 'Liche', mechanic: 'Les unités physiques sont désactivées', targetDamage: 4500, icon: '💀' },
    { name: 'Titan', mechanic: 'Les multiplicateurs sont réduits de moitié', targetDamage: 3000, icon: '🏔️' },
    { name: 'Démon', mechanic: 'Les unités magiques sont désactivées', targetDamage: 7500, icon: '👹' },
    { name: 'Elémentaire de feu', mechanic: 'Les unités feu sont désactivées', targetDamage: 7500, icon: '🔥' },
    { name: 'Elémentaire d\'eau', mechanic: 'Les unités eau sont désactivées', targetDamage: 7500, icon: '💧' },
    { name: 'Elémentaire de terre', mechanic: 'Les unités terre sont désactivées', targetDamage: 7500, icon: '🌍' },
    { name: 'Elémentaire d\'air', mechanic: 'Les unités air sont désactivées', targetDamage: 7500, icon: '🌬️' },
    { name: 'Elémentaire de ténèbres', mechanic: 'Les unités ténèbres sont désactivées', targetDamage: 7500, icon: '🌑' },
    { name: 'Elémentaire de lumière', mechanic: 'Les unités lumière sont désactivées', targetDamage: 7500, icon: '🌞' },
];

// Boss spécifique pour le rang S
export const S_RANK_BOSS = {
    name: 'Quilegan',
    mechanic: 'Bloque les relances, les bonus, les synergies et les dégâts des unités tant qu\'aucun bonus n\'est vendu',
    targetDamage: 10000,
    icon: '🌌'
};

// Fonction utilitaire pour sélectionner un boss aléatoire
export function selectRandomBoss() {
    return BOSSES[Math.floor(Math.random() * BOSSES.length)];
}

// Fonction pour obtenir le boss selon le rang
export function getBossForRank(rank) {
    if (rank === 'S') {
        return S_RANK_BOSS; // Quilegan pour S
    } else {
        return selectRandomBoss();
    }
} 