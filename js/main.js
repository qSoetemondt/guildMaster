import { GameState } from './modules/GameState.js';

// Instance globale du jeu
let gameState = new GameState();

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

// Fonctions utilitaires
function getRandomUnit() {
    const units = [
        { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, icon: '⚔️' },
        { name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3, icon: '🏹' },
        { name: 'Magicien Rouge', type: ['Distance', 'Magique'], damage: 6, multiplier: 2, icon: '🔴' },
        { name: 'Magicien Bleu', type: ['Distance', 'Magique'], damage: 3, multiplier: 4, icon: '🔵' },
        { name: 'Lancier', type: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, icon: '🔱' },
        { name: 'Barbare', type: ['Corps à corps', 'Physique'], damage: 7, multiplier: 1, icon: '🪓' },
        { name: 'Viking', type: ['Corps à corps', 'Physique'], damage: 6, multiplier: 2, icon: '🛡️' },
        { name: 'Fronde', type: ['Distance', 'Physique'], damage: 2, multiplier: 5, icon: '🪨' }
    ];
    
    return units[Math.floor(Math.random() * units.length)];
}

// Initialisation du recrutement
function initRecruitment() {
    const container = document.getElementById('recruit-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Générer 3 options de recrutement
    for (let i = 0; i < 3; i++) {
        const unit = getRandomUnit();
        const option = document.createElement('div');
        option.className = 'recruit-option';
        
        option.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">${unit.icon}</div>
            <div style="font-weight: 600; margin-bottom: 5px;">${unit.name}</div>
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">${unit.type}</div>
            <div style="font-size: 0.8rem; margin-bottom: 10px;">${unit.damage} dmg ×${unit.multiplier}</div>
        `;
        
        option.addEventListener('click', () => {
            document.querySelectorAll('.recruit-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            option.classList.add('selected');
            
            setTimeout(() => {
                gameState.addTroop(unit);
                hideModal('recruit-modal');
                gameState.showNotification(`${unit.name} recruté !`, 'success');
            }, 500);
        });
        
        container.appendChild(option);
    }
}

// Le système de combat a été déplacé dans GameState.js
// Cette fonction n'est plus utilisée



// Initialisation du tutoriel
function initTutorial() {
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

// Initialisation du jeu
function initGame() {
    console.log('Initialisation du jeu...');
    
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
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            console.log('Nouvelle partie cliquée');
            gameState.newGame();
            showScreen('game-screen');
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
                gameState.showNotification('Combat commencé ! Sélectionnez des troupes et cliquez sur "Attaquer".', 'info');
                return;
            }
            
            // Si combat en cours, exécuter un tour
            if (gameState.selectedTroops.length === 0) {
                gameState.showNotification('Sélectionnez des troupes pour attaquer !', 'error');
                return;
            }
            
            const result = gameState.executeCombatTurn();
            
            if (result.success) {
                gameState.showNotification(`Tour ${gameState.currentCombat.round}: ${result.damage} dégâts infligés !`, 'success');
                
                // Afficher les résultats dans une notification temporaire
                setTimeout(() => {
                    if (gameState.currentCombat.isActive) {
                        gameState.showNotification(`Progression: ${result.total}/${gameState.currentCombat.targetDamage} dégâts. Sélectionnez de nouvelles troupes pour le prochain tour.`, 'info');
                    }
                }, 1000);
            } else {
                gameState.showNotification(result.message, 'error');
            }
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

    // Vérifier s'il y a une sauvegarde au démarrage
    if (localStorage.getItem('guildMasterSave') && loadGameBtn) {
        loadGameBtn.textContent = 'Charger Partie ✓';
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