// Constantes de combat et progression
export const RANKS = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];

// Rangs qui déclenchent des combats de boss
export const BOSS_RANKS = ['F+', 'E+', 'D+', 'C+', 'B+', 'A+', 'S'];

// Multiplicateurs selon le rang majeur pour le calcul des dégâts cibles
export const RANK_MULTIPLIERS = {
    'F': 1,    // F reste comme maintenant
    'E': 2,    // E multiplié par 2
    'D': 4,    // D par 4
    'C': 8,    // C par 8
    'B': 16,   // B par 16
    'A': 32,   // A par 32
    'S': 64    // S par 64
};

// Dégâts de base pour le calcul des objectifs
export const BASE_DAMAGE = 2000;
export const DAMAGE_INCREMENT_PER_RANK = 500;

// Fonction utilitaire pour déterminer le rang majeur à partir d'un rang spécifique
export function getMajorRank(rank) {
    const rankIndex = RANKS.indexOf(rank);
    if (rankIndex === -1) return 'F'; // Valeur par défaut
    
    // Déterminer le rang majeur (F, E, D, C, B, A, S)
    if (rankIndex >= 3 && rankIndex <= 5) return 'E';      // E-, E, E+
    else if (rankIndex >= 6 && rankIndex <= 8) return 'D'; // D-, D, D+
    else if (rankIndex >= 9 && rankIndex <= 11) return 'C'; // C-, C, C+
    else if (rankIndex >= 12 && rankIndex <= 14) return 'B'; // B-, B, B+
    else if (rankIndex >= 15 && rankIndex <= 17) return 'A'; // A-, A, A+
    else if (rankIndex === 18) return 'S';                   // S
    else return 'F';                                          // F-, F, F+
}

// Données unifiées des ennemis par rang
export const ENEMY_DATA = {
    'F-': { 
        name: 'Troupes de gobelin', 
        image: 'assets/gobelin.jpg',
        names: ['Gobelin', 'Loup', 'Bandit']
    },
    'F': { 
        name: 'Bandits', 
        image: 'assets/orcs.jpg',
        names: ['Orc', 'Troll', 'Géant']
    },
    'F+': { 
        name: 'Orcs', 
        image: 'assets/orcs.jpg',
        names: ['Dragonnet', 'Démon Mineur', 'Hydre']
    },
    'E-': { 
        name: 'Trolls', 
        image: 'assets/orcs.jpg',
        names: ['Gargouille', 'Minotaure', 'Basilic']
    },
    'E': { 
        name: 'Géants', 
        image: 'assets/orcs.jpg',
        names: ['Liche', 'Dragon', 'Démon']
    },
    'E+': { 
        name: 'Dragons', 
        image: 'assets/orcs.jpg',
        names: ['Dragon Ancien', 'Démon Suprême', 'Titan']
    },
    'D-': { 
        name: 'Démons', 
        image: 'assets/orcs.jpg',
        names: ['Seigneur des Ombres', 'Golem de Pierre', 'Hydre Ancienne']
    },
    'D': { 
        name: 'Archidémons', 
        image: 'assets/orcs.jpg',
        names: ['Dragon Légendaire', 'Démon Primordial', 'Titan de Guerre']
    },
    'D+': { 
        name: 'Seigneurs de guerre', 
        image: 'assets/orcs.jpg',
        names: ['Seigneur du Chaos', 'Dragon Divin', 'Titan Suprême']
    },
    'C-': { 
        name: 'Gardiens anciens', 
        image: 'assets/orcs.jpg',
        names: ['Déité Mineure', 'Dragon Cosmique', 'Titan Primordial']
    },
    'C': { 
        name: 'Légendes vivantes', 
        image: 'assets/orcs.jpg',
        names: ['Déité Majeure', 'Dragon Éternel', 'Titan Divin']
    },
    'C+': { 
        name: 'Entités primordiales', 
        image: 'assets/orcs.jpg',
        names: ['Déité Suprême', 'Dragon Primordial', 'Titan Cosmique']
    },
    'B-': { 
        name: 'Créatures mythiques', 
        image: 'assets/orcs.jpg',
        names: ['Entité Primordiale', 'Dragon Absolu', 'Titan Éternel']
    },
    'B': { 
        name: 'Êtres divins', 
        image: 'assets/orcs.jpg',
        names: ['Entité Divine', 'Dragon Suprême', 'Titan Absolu']
    },
    'B+': { 
        name: 'Anciens dieux', 
        image: 'assets/orcs.jpg',
        names: ['Entité Cosmique', 'Dragon Primordial', 'Titan Suprême']
    },
    'A-': { 
        name: 'Entités cosmiques', 
        image: 'assets/orcs.jpg',
        names: ['Être Primordial', 'Dragon Divin', 'Titan Cosmique']
    },
    'A': { 
        name: 'Créateurs de mondes', 
        image: 'assets/orcs.jpg',
        names: ['Être Divin', 'Dragon Absolu', 'Titan Éternel']
    },
    'A+': { 
        name: 'Maîtres du temps', 
        image: 'assets/orcs.jpg',
        names: ['Être Cosmique', 'Dragon Suprême', 'Titan Absolu']
    },
    'S': { 
        name: 'Entités absolues', 
        image: 'assets/orcs.jpg',
        names: ['Seigneur du Chaos Absolu']
    }
};

// Fonction utilitaire pour obtenir les données d'ennemi par rang
export function getEnemyData(rank) {
    return ENEMY_DATA[rank] || ENEMY_DATA['F-'];
}

// Fonction utilitaire pour obtenir l'image d'ennemi par rang
export function getEnemyImage(rank) {
    return getEnemyData(rank).image;
}

// Fonction utilitaire pour obtenir le nom d'ennemi par rang
export function getEnemyName(rank) {
    const enemyData = getEnemyData(rank);
    return enemyData.names[Math.floor(Math.random() * enemyData.names.length)];
} 