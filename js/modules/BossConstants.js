// Boss disponibles
export const BOSSES = [
    { name: 'Golem de Pierre', mechanic: 'Les unités corps à corps font -50% de dégâts', targetDamage: 2500, icon: '🗿' },
    { name: 'Dragon de Glace', mechanic: 'Les unités distance font -30% de dégâts', targetDamage: 4000, icon: '❄️' },
    { name: 'Liche', mechanic: 'Les unités corps à corps font -2 dégâts', targetDamage: 4500, icon: '💀' },
    { name: 'Titan', mechanic: 'Les multiplicateurs sont réduits de moitié', targetDamage: 3000, icon: '🏔️' },
    { name: 'Démon', mechanic: 'Les unités magiques font +50% de dégâts', targetDamage: 7500, icon: '👹' }
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