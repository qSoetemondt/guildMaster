// Constantes de combat et progression
export const RANKS = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];

// Rangs qui déclenchent des combats de boss
export const BOSS_RANKS = ['F+', 'E+', 'D+', 'C+', 'B+', 'A+', 'S'];

// Rangs infinis (mode infini après S)
export const INFINITE_RANKS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];

// Rangs qui déclenchent des combats de boss en mode infini (tous les 3 combats)
export const INFINITE_BOSS_RANKS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];

// Multiplicateurs selon le rang majeur pour le calcul des dégâts cibles
export const RANK_MULTIPLIERS = {
    'F': 1,    // F reste comme maintenant
    'E': 2,    // E multiplié par 2
    'D': 4,    // D par 4
    'C': 8,    // C par 8
    'B': 16,   // B par 16
    'A': 32,   // A par 32
    'S': 64,   // S par 64
    'S1': 128, // S1 par 128
    'S2': 256, // S2 par 256
    'S3': 512, // S3 par 512
    'S4': 1024, // S4 par 1024
    'S5': 2048, // S5 par 2048
    'S6': 4096, // S6 par 4096
    'S7': 8192, // S7 par 8192
    'S8': 16384, // S8 par 16384
    'S9': 32768, // S9 par 32768
    'S10': 65536 // S10 par 65536
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
    },
    'S1': { 
        name: 'Entités Transcendantes', 
        image: 'assets/orcs.jpg',
        names: ['Déité Primordiale', 'Dragon Transcendant', 'Titan Absolu']
    },
    'S2': { 
        name: 'Êtres Cosmiques', 
        image: 'assets/orcs.jpg',
        names: ['Entité Transcendante', 'Dragon Primordial', 'Titan Divin']
    },
    'S3': { 
        name: 'Créateurs de Réalités', 
        image: 'assets/orcs.jpg',
        names: ['Être Transcendant', 'Dragon Cosmique', 'Titan Éternel']
    },
    'S4': { 
        name: 'Maîtres de l\'Infini', 
        image: 'assets/orcs.jpg',
        names: ['Déité Cosmique', 'Dragon Absolu', 'Titan Suprême']
    },
    'S5': { 
        name: 'Entités Éternelles', 
        image: 'assets/orcs.jpg',
        names: ['Entité Éternelle', 'Dragon Transcendant', 'Titan Primordial']
    },
    'S6': { 
        name: 'Seigneurs du Temps', 
        image: 'assets/orcs.jpg',
        names: ['Être Éternel', 'Dragon Cosmique', 'Titan Divin']
    },
    'S7': { 
        name: 'Créateurs de Dimensions', 
        image: 'assets/orcs.jpg',
        names: ['Déité Éternelle', 'Dragon Absolu', 'Titan Éternel']
    },
    'S8': { 
        name: 'Maîtres de l\'Univers', 
        image: 'assets/orcs.jpg',
        names: ['Entité Absolue', 'Dragon Transcendant', 'Titan Suprême']
    },
    'S9': { 
        name: 'Entités Ultimes', 
        image: 'assets/orcs.jpg',
        names: ['Être Absolu', 'Dragon Cosmique', 'Titan Primordial']
    },
    'S10': { 
        name: 'Créateurs de Multivers', 
        image: 'assets/orcs.jpg',
        names: ['Déité Absolue', 'Dragon Éternel', 'Titan Divin']
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

// Fonction pour formater les grands nombres avec des exposants
export function formatLargeNumber(number) {
    if (number >= 1e9) {
        const exponent = Math.floor(Math.log10(number));
        const mantissa = number / Math.pow(10, exponent);
        return `${mantissa.toFixed(1)}e${exponent}`;
    } else if (number >= 1e6) {
        return `${(number / 1e6).toFixed(1)}M`;
    } else if (number >= 1e3) {
        return `${(number / 1e3).toFixed(1)}K`;
    } else {
        return number.toString();
    }
}

// Fonction pour vérifier si un rang est en mode infini
export function isInfiniteRank(rank) {
    return INFINITE_RANKS.includes(rank);
}

// Fonction pour obtenir le prochain rang infini
export function getNextInfiniteRank(currentRank) {
    const currentIndex = INFINITE_RANKS.indexOf(currentRank);
    if (currentIndex === -1 || currentIndex >= INFINITE_RANKS.length - 1) {
        return INFINITE_RANKS[0]; // Retour au début si on atteint la fin
    }
    return INFINITE_RANKS[currentIndex + 1];
} 