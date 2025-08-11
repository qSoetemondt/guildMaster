import { GameState } from './modules/GameState.js';
import { getMusicManager } from './modules/MusicManager.js';
import { ModalManager } from './modules/ModalManager.js';

// Instance globale du jeu
let gameState = new GameState();

// Rendre le gameState accessible globalement pour les notifications
window.gameState = gameState;

// Initialisation du jeu
function initGame() {
    // Initialiser le gestionnaire de musique
    const musicManager = getMusicManager();
    
    // Initialiser les managers
    gameState.eventManager.initGameEvents();
    gameState.eventManager.initElectronEvents();
    gameState.debugManager.initDebugMode();
    
    // Charger le contenu de la modal beta test
    gameState.eventManager.loadBetaTestContent();
    
    // Afficher la modal beta test au chargement (seulement si pas déjà vue)
    if (!localStorage.getItem('betaTestSeen')) {
        setTimeout(() => {
            ModalManager.showModal('beta-test-modal');
        }, 500);
    }
    
    // Initialiser l'interface de base
    gameState.eventManager.initBaseUI();
}

// Styles CSS pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialiser le jeu quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
        initGame();
}); 

// Exposer les fonctions globales pour Electron
window.initGame = initGame; 