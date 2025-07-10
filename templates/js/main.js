import { GameState } from './modules/GameState.js';
import { tutorialSystem, initTutorialSystem } from './tutorial.js';
import { getRarityIcon, getRarityColor, getRarityDisplayName } from './modules/RarityUtils.js';
import { SimulationEngine } from './modules/SimulationEngine.js';
import { SimulationUI } from './modules/SimulationUI.js';
import { testSimulation, testSingleGame } from './modules/SimulationTest.js';

// Instance globale du jeu
let gameState = new GameState();

// Instance du simulateur d'équilibrage
let simulationEngine = new SimulationEngine();
let simulationUI = new SimulationUI(simulationEngine);

// Rendre le gameState accessible globalement pour les notifications
window.gameState = gameState;

// Rendre les tests de simulation accessibles globalement
window.testSimulation = testSimulation;
window.testSingleGame = testSingleGame;

// ===== FONCTIONS DE DEBUG =====
// Fonction pour ajouter de l'or facilement
window.addGold = function(amount = 100) {
    if (gameState) {
        gameState.addGold(amount);
        console.log(`💰 ${amount} or ajouté ! Nouveau solde : ${gameState.gold} or`);
        gameState.showNotification(`+${amount} or ajouté !`, 'success');
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour définir l'or directement
window.setGold = function(amount) {
    if (gameState) {
        gameState.gold = amount;
        gameState.updateUI();
        console.log(`💰 Or défini à ${amount} !`);
        gameState.showNotification(`Or défini à ${amount} !`, 'success');
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour afficher les informations de debug
window.debugInfo = function() {
    if (gameState) {
        console.log('=== DEBUG INFO ===');
        console.log(`Or actuel : ${gameState.gold}`);
        console.log(`Rang actuel : ${gameState.rank}`);
        console.log(`Troupes disponibles : ${gameState.availableTroops.length}`);
        console.log(`Troupes sélectionnées : ${gameState.selectedTroops.length}`);
        console.log(`Bonus débloqués : ${gameState.unlockedBonuses.length}`);
        console.log(`Consommables : ${gameState.consumableManager.consumables.length}`);
        console.log('==================');
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour rafraîchir le magasin gratuitement
window.refreshShop = function() {
    if (gameState && gameState.shopManager) {
        gameState.shopManager.currentShopItems = null;
        gameState.shopManager.currentShopPurchasedBonuses = [];
        gameState.shopManager.currentShopPurchasedUnits = [];
        gameState.shopManager.currentShopPurchasedConsumables = [];
        gameState.shopManager.shopRefreshCount = 0;
        gameState.shopManager.shopRefreshCost = 10;
        gameState.shopManager.updatePreCombatShop(gameState);
        console.log('🔄 Magasin rafraîchi gratuitement !');
        gameState.showNotification('Magasin rafraîchi !', 'success');
    } else {
        console.error('gameState ou shopManager non disponible');
    }
};

// Fonction pour débloquer tous les bonus
window.unlockAllBonuses = function() {
    if (gameState) {
        const bonusDescriptions = gameState.getBonusDescriptions();
        Object.keys(bonusDescriptions).forEach(bonusId => {
            if (!gameState.unlockedBonuses.includes(bonusId)) {
                gameState.unlockBonus(bonusId);
            }
        });
        console.log('🎁 Tous les bonus débloqués !');
        gameState.showNotification('Tous les bonus débloqués !', 'success');
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour afficher toutes les unités disponibles
window.showUnits = function() {
    if (gameState) {
        console.log('=== UNITÉS DISPONIBLES ===');
        
        // Unités de base
        console.log('\n🏰 UNITÉS DE BASE:');
        gameState.getBaseUnits().forEach(unit => {
            const ownedCount = gameState.ownedUnits[unit.name] || 0;
            const rarityIcon = unit.rarity ? getRarityIcon(unit.rarity) : '';
            const rarityName = unit.rarity ? getRarityDisplayName(unit.rarity) : '';
            console.log(`  ${unit.icon} ${unit.name} (${ownedCount} possédés) - ${unit.damage}×${unit.multiplier} - ${unit.type.join(', ')} ${rarityIcon} ${rarityName}`);
        });
        
        // Unités du magasin
        console.log('\n🛒 UNITÉS DU MAGASIN:');
        gameState.getShopUnits().forEach(unit => {
            const rarityIcon = unit.rarity ? getRarityIcon(unit.rarity) : '';
            const rarityName = unit.rarity ? getRarityDisplayName(unit.rarity) : '';
            console.log(`  ${unit.icon} ${unit.name} - ${unit.damage}×${unit.multiplier} - ${unit.type.join(', ')} ${rarityIcon} ${rarityName}`);
        });
        
        // Toutes les unités
        console.log('\n📋 TOUTES LES UNITÉS:');
        gameState.getAllAvailableTroops().forEach(unit => {
            const rarityIcon = unit.rarity ? getRarityIcon(unit.rarity) : '';
            const rarityName = unit.rarity ? getRarityDisplayName(unit.rarity) : '';
            console.log(`  ${unit.icon} ${unit.name} - ${unit.damage}×${unit.multiplier} - ${unit.type.join(', ')} ${rarityIcon} ${rarityName}`);
        });
        
        console.log('========================');
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour afficher les unités possédées
window.showOwnedUnits = function() {
    if (gameState) {
        console.log('=== UNITÉS POSSÉDÉES ===');
        
        const ownedUnits = gameState.ownedUnits;
        const unitEntries = Object.entries(ownedUnits);
        
        if (unitEntries.length === 0) {
            console.log('❌ Aucune unité possédée');
        } else {
            unitEntries.forEach(([unitName, quantity]) => {
                if (quantity > 0) {
                    // Trouver les détails de l'unité
                    const unit = gameState.getAllAvailableTroops().find(u => u.name === unitName);
                    if (unit) {
                        const rarityIcon = unit.rarity ? getRarityIcon(unit.rarity) : '';
                        const rarityName = unit.rarity ? getRarityDisplayName(unit.rarity) : '';
                        console.log(`  ${unit.icon} ${unitName} (${quantity}) - ${unit.damage}×${unit.multiplier} - ${unit.type.join(', ')} ${rarityIcon} ${rarityName}`);
                    } else {
                        console.log(`  ❓ ${unitName} (${quantity}) - Unité non trouvée`);
                    }
                }
            });
        }
        
        console.log('========================');
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour afficher tous les consommables disponibles
window.showConsumables = function() {
    if (gameState) {
        console.log('=== CONSOMMABLES DISPONIBLES ===');
        
        // Obtenir les types de consommables depuis ConsumableManager
        const consumableTypes = gameState.consumableManager.CONSUMABLES_TYPES;
        
        console.log('\n💊 TYPES DE CONSOMMABLES:');
        Object.entries(consumableTypes).forEach(([type, consumable]) => {
            console.log(`  ${consumable.icon} ${consumable.name} - ${consumable.description} (${consumable.price}💰)`);
        });
        
        console.log('\n📦 CONSOMMABLES DANS L\'INVENTAIRE:');
        const inventory = gameState.consumableManager.consumables;
        
        if (inventory.length === 0) {
            console.log('  ❌ Inventaire vide');
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
                const consumableInfo = consumableTypes[type];
                if (consumableInfo) {
                    console.log(`  ${consumableInfo.icon} ${consumableInfo.name} (${count}) - ${consumableInfo.description}`);
                } else {
                    console.log(`  ❓ ${type} (${count}) - Type inconnu`);
                }
            });
        }
        
        console.log('\n🛒 CONSOMMABLES DANS LE MAGASIN:');
        const shopConsumable = gameState.shopManager.currentShopItems?.find(item => item.type === 'consumable');
        if (shopConsumable) {
            const consumableInfo = consumableTypes[shopConsumable.consumableType];
            if (consumableInfo) {
                console.log(`  ${consumableInfo.icon} ${consumableInfo.name} - ${consumableInfo.description} (${shopConsumable.price}💰)`);
            } else {
                console.log(`  ❓ ${shopConsumable.consumableType} - Type inconnu (${shopConsumable.price}💰)`);
            }
        } else {
            console.log('  ❌ Aucun consommable dans le magasin');
        }
        
        console.log('========================');
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour afficher les consommables possédés
window.showOwnedConsumables = function() {
    if (gameState) {
        console.log('=== CONSOMMABLES POSSÉDÉS ===');
        
        const inventory = gameState.consumableManager.consumables;
        const consumableTypes = gameState.consumableManager.CONSUMABLES_TYPES;
        
        if (inventory.length === 0) {
            console.log('❌ Aucun consommable possédé');
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
                const consumableInfo = consumableTypes[type];
                if (consumableInfo) {
                    console.log(`  ${consumableInfo.icon} ${consumableInfo.name} (${count}) - ${consumableInfo.description}`);
                } else {
                    console.log(`  ❓ ${type} (${count}) - Type inconnu`);
                }
            });
            
            console.log(`\n📊 Total: ${inventory.length} consommable(s)`);
        }
        
        console.log('========================');
    } else {
        console.error('gameState non disponible');
    }
};

// Afficher l'aide des commandes de debug
window.debugHelp = function() {
    console.log(`
=== COMMANDES DE DEBUG ===
addGold(amount)     - Ajouter de l'or (défaut: 100)
setGold(amount)     - Définir l'or directement
debugInfo()         - Afficher les infos de debug
refreshShop()       - Rafraîchir le magasin gratuitement
unlockAllBonuses()  - Débloquer tous les bonus
showUnits()         - Afficher la liste des unités disponibles
showOwnedUnits()    - Afficher les unités possédées
showConsumables()   - Afficher les consommables disponibles
showOwnedConsumables() - Afficher les consommables possédés
debugHelp()         - Afficher cette aide
=======================
    `);
};

// Afficher l'aide au chargement
console.log('🔧 Fonctions de debug disponibles ! Tapez debugHelp() pour voir les commandes.');

// Gestion des écrans
function showScreen(screenId) {
    console.log(`Changement d'écran vers: ${screenId}`);
    
    // Cacher tous les écrans
    const screens = document.querySelectorAll('.screen');
    console.log(`Nombre d'écrans trouvés: ${screens.length}`);
    
    screens.forEach(screen => {
        screen.classList.remove('active');
        console.log(`Écran ${screen.id} - active: ${screen.classList.contains('active')}`);
    });
    
    // Afficher l'écran demandé
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        console.log(`Écran ${screenId} activé avec succès`);
    } else {
        console.error(`Écran ${screenId} non trouvé !`);
    }
}

// Gestion des modals
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) {
        modal.classList.add('active');
    }
    if (overlay) {
        overlay.style.display = 'block';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) {
        modal.classList.remove('active');
    }
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Rendre les fonctions de modal accessibles globalement
window.showModal = showModal;
window.hideModal = hideModal;







// Initialisation du tutoriel
function initTutorial() {
    console.log('Initialisation du tutoriel...');
    console.log('tutorialSystem disponible:', !!tutorialSystem);
    
    // Utiliser le système de tutoriel complet depuis tutorial.js
    if (tutorialSystem) {
        console.log('Utilisation du système de tutoriel complet');
        initTutorialSystem(hideModal);
    } else {
        // Fallback si le système de tutoriel n'est pas chargé
        const content = document.getElementById('tutorial-content');
        if (!content) return;
        
        content.innerHTML = `
            <h4 style="color: #2d3436; margin-bottom: 15px;">Bienvenue dans le Gestionnaire de Guilde !</h4>
            <p>Vous êtes le gestionnaire d'une guilde d'aventuriers dans un univers médiéval. 
            Votre objectif est de recruter des troupes, les envoyer au combat, et faire progresser 
            votre guilde jusqu'au rang S.</p>
            
            <p><strong>Objectifs :</strong></p>
            <ul>
                <li>Recruter des unités variées (corps à corps, distance, magique)</li>
                <li>Former des équipes avec des synergies</li>
                <li>Combattre des ennemis pour gagner de l'or et de la réputation</li>
                <li>Améliorer votre guilde via le magasin</li>
                <li>Atteindre le rang S en affrontant des boss</li>
            </ul>
        `;
        
        // Navigation du tutoriel
        document.getElementById('tutorial-next').addEventListener('click', () => {
            hideModal('tutorial-modal');
            gameState.showNotification('Tutoriel terminé ! Bonne chance !', 'success');
        });
        
        document.getElementById('tutorial-prev').addEventListener('click', () => {
            hideModal('tutorial-modal');
        });
    }
}

// Charger le contenu de la modal beta test
async function loadBetaTestContent() {
    try {
        const response = await fetch('betatest.txt');
        const content = await response.text();
        const betaContent = document.getElementById('beta-test-content');
        if (betaContent) {
            betaContent.innerHTML = content;
        }
    } catch (error) {
        console.error('Erreur lors du chargement du contenu beta test:', error);
        // Fallback si le fichier n'est pas trouvé
        const betaContent = document.getElementById('beta-test-content');
        if (betaContent) {
            betaContent.innerHTML = `
🎮 BETA TEST - GuildMaster

Bonjour à tous !

Merci de participer à cette phase de test de GuildMaster ! Votre aide est précieuse pour améliorer le jeu avant sa sortie officielle.

⚠️ IMPORTANT - Phase de test en cours

Le jeu est actuellement en version bêta non équilibrée. Cela signifie que :
- Les mécaniques de combat peuvent être déséquilibrées
- Certaines unités peuvent être trop fortes ou trop faibles
- L'économie du jeu n'est pas encore optimisée
- Des bugs peuvent survenir

💾 Système de sauvegarde

Votre progression est sauvegardée automatiquement dans votre navigateur. IMPORTANT :
- Ne videz pas les données de navigation (cache, cookies, etc.)
- Ne passez pas en navigation privée
- Utilisez le même navigateur pour continuer votre partie
- Le bouton "Sauvegarder" permet de forcer une sauvegarde manuelle

🤐 Confidentialité

Pour préserver l'effet de surprise pour les autres joueurs, merci de ne pas partager l'URL du jeu en dehors de ce groupe de testeurs. Gardons la magie intacte pour le lancement !

💬 Vos retours sont essentiels

Je suis ouvert à tous vos retours :
- Bugs rencontrés
- Suggestions d'amélioration
- Équilibrage des unités/synergies
- Interface utilisateur
- Nouvelles fonctionnalités
- Tout ce qui vous passe par la tête !

N'hésitez pas à me faire part de vos impressions, même les plus détaillées. Chaque retour compte pour faire de GuildMaster le meilleur jeu possible !

🎯 Objectif de cette bêta

Tester en profondeur toutes les mécaniques et identifier les points d'amélioration avant la version finale.

Merci encore pour votre participation ! 

À vos claviers, testeurs ! 🚀
            `;
        }
    }
}

// Initialisation du jeu
function initGame() {
    console.log('Initialisation du jeu...');
    
    // Charger le contenu de la modal beta test
    loadBetaTestContent();
    
    // Afficher la modal beta test au chargement (seulement si pas déjà vue)
    if (!localStorage.getItem('betaTestSeen')) {
        setTimeout(() => {
            showModal('beta-test-modal');
        }, 500);
    }
    
    // S'assurer que l'animation de victoire est masquée au chargement
    const victoryAnimation = document.getElementById('victory-animation');
    if (victoryAnimation) {
        victoryAnimation.style.display = 'none';
        victoryAnimation.style.opacity = '0';
    }
    
    // Événements des boutons principaux
    const newGameBtn = document.getElementById('new-game-btn');
    const loadGameBtn = document.getElementById('load-game-btn');
    const tutorialBtn = document.getElementById('tutorial-btn');
    const simulationBtn = document.getElementById('simulation-btn');
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            console.log('Nouvelle partie cliquée');
            showModal('new-game-modal');
            
            // Focus sur le champ de nom de guilde
            const newGuildNameInput = document.getElementById('new-guild-name');
            if (newGuildNameInput) {
                newGuildNameInput.focus();
                newGuildNameInput.select();
            }
        });
    }
    
    if (loadGameBtn) {
        loadGameBtn.addEventListener('click', () => {
            console.log('Charger partie cliquée');
            if (gameState.load()) {
                showScreen('game-screen');
                gameState.showNotification('Partie chargée !', 'success');
            } else {
                gameState.showNotification('Aucune sauvegarde trouvée', 'error');
            }
        });
    }
    
    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', () => {
            console.log('Tutoriel cliqué');
            showModal('tutorial-modal');
            initTutorial();
        });
    }

    if (simulationBtn) {
        simulationBtn.addEventListener('click', () => {
            console.log('Simulateur d\'équilibrage cliqué');
            simulationUI.show();
        });
    }

    // Événements du jeu
    const startCombatBtn = document.getElementById('start-combat-btn');
    const viewTroopsBtn = document.getElementById('view-troops-btn');
    const saveBtn = document.getElementById('save-btn');
    const menuBtn = document.getElementById('menu-btn');
    
    if (startCombatBtn) {
        startCombatBtn.addEventListener('click', () => {
            console.log('Combat cliqué');
            
            // Si pas de combat en cours, en démarrer un nouveau
            if (!gameState.currentCombat.isActive) {
                gameState.startNewCombat();
                
                return;
            }
            
            // Si combat en cours, exécuter un tour
            if (gameState.selectedTroops.length === 0) {
                gameState.showNotification('Sélectionnez des troupes pour attaquer !', 'error');
                return;
            }
            
            gameState.executeCombatTurn();
            
        });
    }
    
    if (viewTroopsBtn) {
        viewTroopsBtn.addEventListener('click', () => {
            console.log('Voir mes troupes cliqué');
            gameState.showAllTroops();
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('Sauvegarder cliqué');
            gameState.save();
        });
    }
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            console.log('Menu cliqué');
            showScreen('title-screen');
        });
    }

    // Fermeture des modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                hideModal(modal.id);
                // Fermer spécifiquement la modal des troupes
                if (modal.id === 'troops-modal') {
                    modal.style.display = 'none';
                }
            }
        });
    });

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            document.querySelectorAll('.modal.active').forEach(modal => {
                hideModal(modal.id);
            });
        });
    }

    // Événement pour le nom de guilde modifiable
    const guildNameInput = document.getElementById('guild-name-input');
    if (guildNameInput) {
        guildNameInput.addEventListener('blur', () => {
            gameState.updateGuildName(guildNameInput.value);
        });
        
        guildNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                guildNameInput.blur();
            }
        });
    }
    
    // Événements pour la modal nouvelle partie
    const confirmNewGameBtn = document.getElementById('confirm-new-game');
    const cancelNewGameBtn = document.getElementById('cancel-new-game');
    const newGuildNameInput = document.getElementById('new-guild-name');
    
    if (confirmNewGameBtn) {
        confirmNewGameBtn.addEventListener('click', () => {
            const guildName = newGuildNameInput ? newGuildNameInput.value.trim() : 'Guilde d\'Aventuriers';
            if (guildName) {
                gameState.newGame();
                gameState.updateGuildName(guildName);
                hideModal('new-game-modal');
                showScreen('game-screen');
                gameState.showNotification(`Nouvelle partie créée : ${guildName}`, 'success');
            } else {
                gameState.showNotification('Veuillez entrer un nom de guilde', 'error');
            }
        });
    }
    
    if (cancelNewGameBtn) {
        cancelNewGameBtn.addEventListener('click', () => {
            hideModal('new-game-modal');
        });
    }
    
    if (newGuildNameInput) {
        newGuildNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmNewGameBtn.click();
            }
        });
    }
    
    // Vérifier s'il y a une sauvegarde au démarrage
    if (gameState.saveManager.hasSave() && loadGameBtn) {
        loadGameBtn.textContent = 'Charger Partie ✓';
    }
    
    // Événement pour le bouton beta test
    const acceptBetaTestBtn = document.getElementById('accept-beta-test');
    if (acceptBetaTestBtn) {
        acceptBetaTestBtn.addEventListener('click', () => {
            hideModal('beta-test-modal');
            // Marquer que l'utilisateur a vu la modal beta test
            localStorage.setItem('betaTestSeen', 'true');
        });
    }
    
    console.log('Jeu initialisé avec succès');
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

// Initialiser le jeu quand la page est chargée
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation du jeu...');
    try {
        initGame();
        console.log('Jeu initialisé avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }
}); 