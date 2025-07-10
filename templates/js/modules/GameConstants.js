// Constantes générales du jeu
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