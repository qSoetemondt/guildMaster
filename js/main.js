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

// Commande console pour acheter n'importe quel consommable
window.buyConsumable = function(consumableType) {
    if (!gameState) {
        console.error('❌ gameState non disponible');
        return;
    }
    
    if (!consumableType) {
        console.log('💡 Usage: buyConsumable("type")');
        console.log('📋 Types disponibles:');
        Object.keys(gameState.consumableManager.CONSUMABLES_TYPES).forEach(type => {
            const consumable = gameState.consumableManager.CONSUMABLES_TYPES[type];
            console.log(`  - ${type}: ${consumable.icon} ${consumable.name} (${consumable.price}💰)`);
        });
        return;
    }
    
    const consumableInfo = gameState.consumableManager.CONSUMABLES_TYPES[consumableType];
    if (!consumableInfo) {
        console.error(`❌ Type de consommable inconnu: ${consumableType}`);
        console.log('💡 Utilisez buyConsumable() sans paramètre pour voir la liste des types disponibles');
        return;
    }
    
    // Vérifier si l'inventaire est plein
    if (gameState.consumableManager.isInventoryFull()) {
        console.error('❌ Inventaire de consommables plein (3 max) !');
        return;
    }
    
    // Vérifier si on a assez d'or
    if (gameState.gold < consumableInfo.price) {
        console.error(`❌ Or insuffisant ! Nécessaire: ${consumableInfo.price}💰, Disponible: ${gameState.gold}💰`);
        return;
    }
    
    // Acheter le consommable
    if (gameState.consumableManager.addConsumable(consumableType, gameState)) {
        // Dépenser l'or
        gameState.gold -= consumableInfo.price;
        
        console.log(`✅ ${consumableInfo.icon} ${consumableInfo.name} acheté pour ${consumableInfo.price}💰 !`);
        console.log(`💰 Or restant: ${gameState.gold}💰`);
        console.log(`📦 Consommables dans l'inventaire: ${gameState.consumableManager.getConsumableCount()}/3`);
        
        // Mettre à jour l'interface
        gameState.updateUI();
    } else {
        console.error('❌ Erreur lors de l\'achat du consommable');
    }
};

// Commande console pour voir l'inventaire des consommables
window.showConsumables = function() {
    if (!gameState) {
        console.error('❌ gameState non disponible');
        return;
    }
    
    console.log('=== 📦 INVENTAIRE DES CONSOMMABLES ===');
    
    const inventory = gameState.consumableManager.consumables;
    if (inventory.length === 0) {
        console.log('❌ Inventaire vide');
    } else {
        // Grouper par type
        const groupedConsumables = {};
        inventory.forEach(consumable => {
            if (!groupedConsumables[consumable.type]) {
                groupedConsumables[consumable.type] = 0;
            }
            groupedConsumables[consumable.type]++;
        });
        
        Object.entries(groupedConsumables).forEach(([type, count]) => {
            const consumableInfo = gameState.consumableManager.CONSUMABLES_TYPES[type];
            if (consumableInfo) {
                console.log(`  ${consumableInfo.icon} ${consumableInfo.name} (${count}) - ${consumableInfo.description}`);
            }
        });
        
        console.log(`\n📊 Total: ${inventory.length}/3 consommable(s)`);
    }
    
    console.log('\n💰 Or disponible:', gameState.gold);
    console.log('========================');
}; 