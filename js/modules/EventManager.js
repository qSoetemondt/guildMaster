// Gestionnaire d'événements pour GuildMaster
import { ModalManager } from './ModalManager.js';

export class EventManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.eventListeners = new Map();
    }

    // Initialiser tous les événements du jeu
    initGameEvents() {
        this.initMainMenuEvents();
        this.initGameEventsInternal();
        this.initModalEvents();
        this.initAnimationEvents();
        this.initGlobalEvents();
    }

    // Événements du menu principal
    initMainMenuEvents() {
        const newGameBtn = document.getElementById('new-game-btn');
        const loadGameBtn = document.getElementById('load-game-btn');
        const tutorialBtn = document.getElementById('tutorial-btn');
        const simulationBtn = document.getElementById('simulation-btn');

        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                ModalManager.showModal('new-game-modal');
                
                // Focus sur le champ de nom de guilde
                const newGuildNameInput = document.getElementById('new-guild-name');
                if (newGuildNameInput) {
                    newGuildNameInput.focus();
                    newGuildNameInput.select();
                }
            });
        } else {
            console.error('❌ EventManager: Bouton new-game-btn non trouvé');
        }

        if (loadGameBtn) {
            loadGameBtn.addEventListener('click', () => {
                if (this.gameState.load()) {
                    this.showScreen('game-screen');
                    this.gameState.notificationManager.showGameLoaded();
                } else {
                    this.gameState.notificationManager.showNoSaveFound();
                }
            });
        }

        if (tutorialBtn) {
            tutorialBtn.addEventListener('click', () => {
                ModalManager.showModal('tutorial-modal');
                this.initTutorial();
            });
        }

        if (simulationBtn) {
            simulationBtn.addEventListener('click', () => {
                if (window.simulationUI) {
                    window.simulationUI.show();
                }
            });
        }
    }

    // Événements du jeu principal
    initGameEventsInternal() {
        const startCombatBtn = document.getElementById('start-combat-btn');
        const sellBonusesBtn = document.getElementById('sell-bonuses-btn');
        const viewTroopsBtn = document.getElementById('view-troops-btn');
        const saveBtn = document.getElementById('save-btn');
        const menuBtn = document.getElementById('menu-btn');

        if (startCombatBtn) {
            startCombatBtn.addEventListener('click', () => {
                // Si pas de combat en cours, en démarrer un nouveau
                if (!this.gameState.currentCombat.isActive) {
                    this.gameState.startNewCombat();
                    return;
                }
                
                // Si combat en cours, exécuter un tour
                if (this.gameState.selectedTroops.length === 0) {
                    this.gameState.notificationManager.showActionRequired('Sélectionnez des troupes pour attaquer !');
                    return;
                }
                
                this.gameState.executeCombatTurn();
            });
        }

        if (viewTroopsBtn) {
            viewTroopsBtn.addEventListener('click', () => {
                this.gameState.uiManager.showAllTroopsWithTransformations();
            });
        }

        const viewSynergiesBtn = document.getElementById('view-synergies-btn');
        if (viewSynergiesBtn) {
            viewSynergiesBtn.addEventListener('click', () => {
                this.gameState.uiManager.showSynergiesModal();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.gameState.save();
            });
        }

        if (sellBonusesBtn) {
            sellBonusesBtn.addEventListener('click', () => {
                if (this.gameState && this.gameState.shopManager) {
                    this.gameState.shopManager.openSellBonusesModal(this.gameState);
                } else {
                    console.error('gameState ou shopManager non disponible');
                }
            });
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.showScreen('title-screen');
            });
        }
    }

    // Événements des modals
    initModalEvents() {
        // Événements pour la modal nouvelle partie
        const confirmNewGameBtn = document.getElementById('confirm-new-game');
        const cancelNewGameBtn = document.getElementById('cancel-new-game');
        const newGuildNameInput = document.getElementById('new-guild-name');

        if (confirmNewGameBtn) {
            confirmNewGameBtn.addEventListener('click', () => {
                const guildName = newGuildNameInput ? newGuildNameInput.value.trim() : 'Guilde d\'Aventuriers';
                if (guildName) {
                    this.gameState.newGame();
                    this.gameState.updateGuildName(guildName);
                    ModalManager.hideModal('new-game-modal');
                    this.showScreen('game-screen');
                    this.gameState.notificationManager.showNewGameCreated(guildName);
                } else {
                    this.gameState.notificationManager.showInputError('Veuillez entrer un nom de guilde');
                }
            });
        }

        if (cancelNewGameBtn) {
            cancelNewGameBtn.addEventListener('click', () => {
                ModalManager.hideModal('new-game-modal');
            });
        }

        if (newGuildNameInput) {
            newGuildNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmNewGameBtn.click();
                }
            });
        }

        // Événement pour le bouton beta test
        const acceptBetaTestBtn = document.getElementById('accept-beta-test');
        if (acceptBetaTestBtn) {
            acceptBetaTestBtn.addEventListener('click', () => {
                ModalManager.hideModal('beta-test-modal');
                // Marquer que l'utilisateur a vu la modal beta test
                localStorage.setItem('betaTestSeen', 'true');
            });
        }
    }

    // Événements d'animation
    initAnimationEvents() {
        // Gestionnaires d'événements pour les contrôles de vitesse d'animation
        const speedButtons = document.querySelectorAll('.speed-btn');
        speedButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.getAttribute('data-speed'));
                this.gameState.animationManager.setAnimationSpeed(speed);
            });
        });
    }

    // Événements globaux
    initGlobalEvents() {
        // Écouteur d'événement pour le tri des unités
        window.addEventListener('troopsSortChanged', () => {
            if (this.gameState && this.gameState.unitSorter) {
                this.gameState.updateTroopsUI();
            }
        });

        // Événement pour le nom de guilde modifiable
        const guildNameInput = document.getElementById('guild-name-input');
        if (guildNameInput) {
            guildNameInput.addEventListener('blur', () => {
                this.gameState.updateGuildName(guildNameInput.value);
            });
            
            guildNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    guildNameInput.blur();
                }
            });
        }
    }

    // Initialiser les événements Electron
    initElectronEvents() {
        if (window.electronAPI) {
            // Écouter les événements du menu Electron
            window.electronAPI.onNewGame(() => {
                if (this.gameState) {
                    this.gameState.saveManager.newGame(this.gameState);
                    this.gameState.notificationManager.showNewGameStarted();
                }
            });
            
            window.electronAPI.onSaveGame(() => {
                if (this.gameState) {
                    this.gameState.saveManager.save(this.gameState);
                }
            });
            
            window.electronAPI.onLoadGame(() => {
                if (this.gameState) {
                    this.gameState.saveManager.load(this.gameState);
                }
            });
            

        }
    }

    // Gestion des écrans
    showScreen(screenId) {
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

    // Initialisation du tutoriel
    initTutorial() {
        // Utiliser le système de tutoriel complet depuis tutorial.js
        if (window.tutorialSystem) {
            window.initTutorialSystem(this.gameState.modalManager.hideModal);
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
                ModalManager.hideModal('tutorial-modal');
                this.gameState.notificationManager.showTutorialCompleted();
            });
            
            document.getElementById('tutorial-prev').addEventListener('click', () => {
                ModalManager.hideModal('tutorial-modal');
            });
        }
    }

    // Charger le contenu de la modal beta test
    async loadBetaTestContent() {
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

    // Initialiser l'interface de base
    initBaseUI() {
        // S'assurer que l'animation de victoire est masquée au chargement
        const victoryAnimation = document.getElementById('victory-animation');
        if (victoryAnimation) {
            victoryAnimation.style.display = 'none';
            victoryAnimation.style.opacity = '0';
        }

        // Vérifier s'il y a une sauvegarde au démarrage
        const loadGameBtn = document.getElementById('load-game-btn');
        if (this.gameState.saveManager.hasSave() && loadGameBtn) {
            loadGameBtn.textContent = 'Charger Partie ✓';
        }
    }
} 