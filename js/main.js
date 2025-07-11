import { GameState } from './modules/GameState.js';
import { tutorialSystem, initTutorialSystem } from './tutorial.js';
import { getRarityIcon, getRarityColor, getRarityDisplayName } from './modules/RarityUtils.js';
import { getMusicManager } from './modules/MusicManager.js';



// Instance globale du jeu
let gameState = new GameState();



// Rendre le gameState accessible globalement pour les notifications
window.gameState = gameState;




// ===== FONCTIONS DE DEBUG =====
// Fonction pour ajouter de l'or facilement
window.addGold = function(amount = 100) {
    if (gameState) {
        gameState.addGold(amount);
        gameState.notificationManager.showGoldAdded(amount);
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour définir l'or directement
window.setGold = function(amount) {
    if (gameState) {
        gameState.gold = amount;
        gameState.updateUI();
        gameState.notificationManager.showGoldSet(amount);
    } else {
        console.error('gameState non disponible');
    }
};

// Fonction pour afficher les informations de debug
window.debugInfo = function() {
    if (gameState) {
        // Fonction de debug silencieuse
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
        gameState.notificationManager.showShopRefreshed();
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
        gameState.notificationManager.showAllBonusesUnlocked();
    } else {
        console.error('gameState non disponible');
    }
};



// Gestion des écrans
function showScreen(screenId) {
    // Cacher tous les écrans
    const screens = document.querySelectorAll('.screen');
    
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Afficher l'écran demandé
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
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
    
    // Ne jamais fermer la modal de combat
    if (modalId === 'combat-modal') {
        console.log('Tentative de fermeture de la modal de combat bloquée');
        return;
    }
    
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
            gameState.notificationManager.showTutorialCompleted();
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
    // Initialiser le gestionnaire de musique
    const musicManager = getMusicManager();
    
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
            if (gameState.load()) {
                showScreen('game-screen');
                gameState.notificationManager.showGameLoaded();
            } else {
                gameState.notificationManager.showNoSaveFound();
            }
        });
    }
    
    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', () => {
            showModal('tutorial-modal');
            initTutorial();
        });
    }



    if (simulationBtn) {
        simulationBtn.addEventListener('click', () => {
            simulationUI.show();
        });
    }

    // Événements du jeu
    const startCombatBtn = document.getElementById('start-combat-btn');
    const sellBonusesBtn = document.getElementById('sell-bonuses-btn');
    const viewTroopsBtn = document.getElementById('view-troops-btn');
    const saveBtn = document.getElementById('save-btn');
    const menuBtn = document.getElementById('menu-btn');
    
    if (startCombatBtn) {
        startCombatBtn.addEventListener('click', () => {
            // Si pas de combat en cours, en démarrer un nouveau
            if (!gameState.currentCombat.isActive) {
                gameState.startNewCombat();
                
                return;
            }
            
            // Si combat en cours, exécuter un tour
            if (gameState.selectedTroops.length === 0) {
                gameState.notificationManager.showActionRequired('Sélectionnez des troupes pour attaquer !');
                return;
            }
            
            gameState.executeCombatTurn();
            
        });
    }
    
    if (viewTroopsBtn) {
        viewTroopsBtn.addEventListener('click', () => {
            gameState.showAllTroops();
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            gameState.save();
        });
    }
    
    if (sellBonusesBtn) {
        sellBonusesBtn.addEventListener('click', () => {
            if (gameState && gameState.shopManager) {
                gameState.shopManager.openSellBonusesModal(gameState);
            } else {
                console.error('gameState ou shopManager non disponible');
            }
        });
    }
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            showScreen('title-screen');
        });
    }

    // Fermeture des modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                // Ne jamais fermer la modal de combat
                if (modal.id === 'combat-modal') {
                    return;
                }
                
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
                // Ne jamais fermer la modal de combat avec l'overlay
                if (modal.id === 'combat-modal') {
                    return;
                }
                hideModal(modal.id);
            });
        });
    }

    // Écouteur d'événement pour le tri des unités
    window.addEventListener('troopsSortChanged', () => {
        if (gameState && gameState.unitSorter) {
            gameState.updateTroopsUI();
        }
    });

    // Fermeture des modals avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Vérifier si un combat est en cours
            const isCombatActive = gameState && gameState.currentCombat && gameState.currentCombat.isActive;
            
            // Fermer toutes les modals actives (statiques et dynamiques) sauf la modal de combat
            document.querySelectorAll('.modal.active, .modal[style*="display: block"]').forEach(modal => {
                // Ne jamais fermer la modal de combat avec Échap
                if (modal.id === 'combat-modal') {
                    return;
                }
                
                hideModal(modal.id);
                // Fermer spécifiquement la modal des troupes
                if (modal.id === 'troops-modal') {
                    modal.style.display = 'none';
                }
                // Fermer les modals dynamiques
                if (modal.id === 'synergy-upgrade-modal' || modal.id === 'transform-confirmation-modal' || modal.id === 'game-summary-modal') {
                    modal.remove();
                }
            });
            
            // Fermer l'animation de combat seulement si elle n'est pas en cours d'animation
            const combatAnimation = document.getElementById('combat-animation-container');
            if (combatAnimation && combatAnimation.style.display === 'flex') {
                // Ne jamais fermer l'animation de combat si un combat est en cours
                if (isCombatActive) {
                    return;
                }
                
                // Vérifier si l'animation est en cours en regardant si le bouton de fermeture est visible
                const closeButton = combatAnimation.querySelector('#close-combat-animation');
                if (closeButton && closeButton.style.display !== 'none' && closeButton.style.visibility !== 'hidden' && !isCombatActive) {
                    // L'animation peut être fermée (bouton visible = animation terminée ET pas de combat actif)
                    combatAnimation.style.display = 'none';
                }
                // Si le bouton n'est pas visible ou si un combat est actif, l'animation ne doit pas être fermée
            }
            
            // Fermer l'animation de victoire si elle est active
            const victoryAnimation = document.getElementById('victory-animation');
            if (victoryAnimation && victoryAnimation.style.display === 'block') {
                victoryAnimation.style.display = 'none';
            }
            
            // Fermer l'overlay de transformation s'il est actif
            const transformOverlay = document.getElementById('transform-overlay');
            if (transformOverlay) {
                transformOverlay.remove();
            }
            
            // Fermer la notification de transformation si elle est active
            const transformNotification = document.getElementById('transform-notification');
            if (transformNotification) {
                transformNotification.remove();
            }
            
            // Réinitialiser le mode transformation si actif
            if (gameState && gameState.consumableManager) {
                gameState.consumableManager.deactivateTransformMode();
            }
        }
    });

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
                gameState.notificationManager.showNewGameCreated(guildName);
            } else {
                gameState.notificationManager.showInputError('Veuillez entrer un nom de guilde');
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
    
    // Gestionnaires d'événements pour les contrôles de vitesse d'animation
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseInt(btn.getAttribute('data-speed'));
            gameState.animationManager.setAnimationSpeed(speed);
        });
    });
    
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