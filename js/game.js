// État global du jeu
class GameState {
    constructor() {
        this.rank = 'F-';
        this.rankProgress = 0;
        this.rankTarget = 100;
        this.gold = 100;
        this.availableTroops = [];
        this.selectedTroops = [];
        this.combatHistory = [];
        this.isFirstTime = true;
    }

    // Progression des rangs
    static RANKS = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];

    addProgress(amount) {
        this.rankProgress += amount;
        
        // Vérifier si on peut passer au rang supérieur
        if (this.rankProgress >= this.rankTarget) {
            this.rankProgress = 0;
            this.promoteRank();
        }
        
        this.updateUI();
    }

    promoteRank() {
        const currentIndex = GameState.RANKS.indexOf(this.rank);
        if (currentIndex < GameState.RANKS.length - 1) {
            this.rank = GameState.RANKS[currentIndex + 1];
            this.rankTarget = this.calculateRankTarget();
            
            // Récompense pour la promotion
            this.gold += 50;
            
            // Afficher notification
            this.showNotification(`Promotion ! Nouveau rang: ${this.rank}`, 'success');
        }
    }

    calculateRankTarget() {
        const rankIndex = GameState.RANKS.indexOf(this.rank);
        return 100 + (rankIndex * 25); // Augmentation progressive
    }

    // Gestion des ressources
    addGold(amount) {
        this.gold += amount;
        this.updateUI();
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    // Gestion des troupes
    addTroop(troop) {
        this.availableTroops.push(troop);
        this.updateTroopsUI();
    }

    selectTroop(troopIndex) {
        if (troopIndex >= 0 && troopIndex < this.availableTroops.length) {
            const troop = this.availableTroops.splice(troopIndex, 1)[0];
            this.selectedTroops.push(troop);
            this.updateTroopsUI();
            this.updateSynergies();
        }
    }

    deselectTroop(troopIndex) {
        if (troopIndex >= 0 && troopIndex < this.selectedTroops.length) {
            const troop = this.selectedTroops.splice(troopIndex, 1)[0];
            this.availableTroops.push(troop);
            this.updateTroopsUI();
            this.updateSynergies();
        }
    }

    // Calcul des synergies
    calculateSynergies() {
        const synergies = [];
        const meleeCount = this.selectedTroops.filter(t => t.type === 'Corps à corps').length;
        const rangedCount = this.selectedTroops.filter(t => t.type === 'Distance').length;
        const magicCount = this.selectedTroops.filter(t => t.type === 'Magique').length;

        // Synergie corps à corps
        if (meleeCount >= 2) {
            synergies.push({
                type: 'Corps à corps',
                description: `+1 multiplicateur pour ${meleeCount} unités corps à corps`,
                bonus: { multiplier: 1 }
            });
        }

        // Synergie distance
        if (rangedCount >= 2) {
            synergies.push({
                type: 'Distance',
                description: `+2 multiplicateur pour ${rangedCount} unités distance`,
                bonus: { multiplier: 2 }
            });
        }

        // Synergie mixte
        if (meleeCount >= 2 && rangedCount >= 1) {
            synergies.push({
                type: 'Mixte',
                description: 'Les unités distance gagnent +15 dégâts et +1 multi',
                bonus: { damage: 15, multiplier: 1, target: 'Distance' }
            });
        }

        if (rangedCount >= 2 && meleeCount >= 1) {
            synergies.push({
                type: 'Mixte',
                description: 'Les unités corps à corps gagnent +5 dégâts et +3 multi',
                bonus: { damage: 5, multiplier: 3, target: 'Corps à corps' }
            });
        }

        return synergies;
    }

    // Mise à jour de l'interface
    updateUI() {
        const rankElement = document.getElementById('current-rank');
        const progressElement = document.getElementById('rank-progress');
        const goldElement = document.getElementById('gold-amount');
        
        if (rankElement) rankElement.textContent = this.rank;
        if (progressElement) progressElement.textContent = `${this.rankProgress}/${this.rankTarget}`;
        if (goldElement) goldElement.textContent = this.gold;
        
        // Mettre à jour le bouton de recrutement
        const recruitBtn = document.getElementById('recruit-btn');
        if (recruitBtn) {
            recruitBtn.textContent = `Recruter (50💰)`;
            recruitBtn.disabled = this.gold < 50;
        }
    }

    updateTroopsUI() {
        const availableContainer = document.getElementById('available-troops');
        const selectedContainer = document.getElementById('selected-troops');

        if (!availableContainer || !selectedContainer) return;

        // Vider les conteneurs
        availableContainer.innerHTML = '';
        selectedContainer.innerHTML = '';

        // Afficher les troupes disponibles
        this.availableTroops.forEach((troop, index) => {
            const troopCard = this.createTroopCard(troop, index, false);
            availableContainer.appendChild(troopCard);
        });

        // Afficher les troupes sélectionnées
        this.selectedTroops.forEach((troop, index) => {
            const troopCard = this.createTroopCard(troop, index, true);
            selectedContainer.appendChild(troopCard);
        });
    }

    createTroopCard(troop, index, isSelected) {
        const card = document.createElement('div');
        card.className = `unit-card ${isSelected ? 'selected' : ''}`;
        
        card.innerHTML = `
            <div class="unit-icon">${troop.icon}</div>
            <div class="unit-name">${troop.name}</div>
            <div class="unit-stats">${troop.damage} dmg ×${troop.multiplier}</div>
            <div class="unit-type">${troop.type}</div>
        `;

        card.addEventListener('click', () => {
            if (isSelected) {
                this.deselectTroop(index);
            } else {
                this.selectTroop(index);
            }
        });

        return card;
    }

    updateSynergies() {
        const synergiesContainer = document.getElementById('synergies-display');
        if (!synergiesContainer) return;
        
        const synergies = this.calculateSynergies();
        
        synergiesContainer.innerHTML = '';
        
        if (synergies.length === 0) {
            synergiesContainer.innerHTML = '<p style="color: #666; font-style: italic;">Aucune synergie active</p>';
            return;
        }

        synergies.forEach(synergy => {
            const synergyElement = document.createElement('div');
            synergyElement.className = 'synergy-item';
            synergyElement.textContent = synergy.description;
            synergiesContainer.appendChild(synergyElement);
        });
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Trouver la section de combat pour positionner la notification
        const combatSection = document.getElementById('combat-section');
        const preCombatSection = document.getElementById('pre-combat-section');
        
        let targetSection = null;
        if (combatSection && combatSection.style.display !== 'none') {
            targetSection = combatSection;
        } else if (preCombatSection && preCombatSection.style.display !== 'none') {
            targetSection = preCombatSection;
        }
        
        let topPosition = '20px';
        if (targetSection) {
            const rect = targetSection.getBoundingClientRect();
            topPosition = `${rect.top + 20}px`;
        }
        
        // Styles pour la notification
        notification.style.cssText = `
            position: fixed;
            top: ${topPosition};
            right: 20px;
            background: ${type === 'success' ? '#00b894' : type === 'error' ? '#d63031' : '#74b9ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Sauvegarde et chargement
    save() {
        if (typeof saveSystem !== 'undefined' && saveSystem.saveGame) {
            if (saveSystem.saveGame(this)) {
                this.showNotification('Partie sauvegardée !', 'success');
            } else {
                this.showNotification('Erreur lors de la sauvegarde', 'error');
            }
        } else {
            // Fallback simple
            const saveData = {
                rank: this.rank,
                rankProgress: this.rankProgress,
                rankTarget: this.rankTarget,
                gold: this.gold,
                availableTroops: this.availableTroops,
                selectedTroops: this.selectedTroops,
                combatHistory: this.combatHistory,
                isFirstTime: this.isFirstTime
            };
            
            localStorage.setItem('guildMasterSave', JSON.stringify(saveData));
            this.showNotification('Partie sauvegardée !', 'success');
        }
    }

    load() {
        if (typeof saveSystem !== 'undefined' && saveSystem.loadGame) {
            if (saveSystem.loadGame(this)) {
                this.updateUI();
                this.updateTroopsUI();
                this.updateSynergies();
                return true;
            }
        } else {
            // Fallback simple
            const saveData = localStorage.getItem('guildMasterSave');
            if (saveData) {
                const data = JSON.parse(saveData);
                Object.assign(this, data);
                this.updateUI();
                this.updateTroopsUI();
                this.updateSynergies();
                return true;
            }
        }
        return false;
    }

    // Nouvelle partie
    newGame() {
        this.rank = 'F-';
        this.rankProgress = 0;
        this.rankTarget = 100;
        this.gold = 100;
        this.availableTroops = [];
        this.selectedTroops = [];
        this.combatHistory = [];
        this.isFirstTime = true;
        
        this.updateUI();
        this.updateTroopsUI();
        this.updateSynergies();
        
        // Donner quelques unités de départ
        if (typeof UNITS !== 'undefined') {
            this.addTroop(UNITS.epéiste);
            this.addTroop(UNITS.archer);
        }
    }
}

// Instance globale du jeu
let gameState = new GameState();

// Gestion des écrans
function showScreen(screenId) {
    // Cacher tous les écrans
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Afficher l'écran demandé
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
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

// Initialisation du jeu
function initGame() {
    console.log('Initialisation du jeu...');
    
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
            if (typeof initTutorial === 'function') {
                initTutorial();
            }
        });
    }

    // Événements du jeu
    const recruitBtn = document.getElementById('recruit-btn');
    const startCombatBtn = document.getElementById('start-combat-btn');
    const shopBtn = document.getElementById('shop-btn');
    const saveBtn = document.getElementById('save-btn');
    const menuBtn = document.getElementById('menu-btn');
    
    if (recruitBtn) {
        recruitBtn.addEventListener('click', () => {
            console.log('Recruter cliqué');
            if (gameState.spendGold(50)) {
                showModal('recruit-modal');
                if (typeof initRecruitment === 'function') {
                    initRecruitment();
                }
            } else {
                gameState.showNotification('Or insuffisant !', 'error');
            }
        });
    }
    
    if (startCombatBtn) {
        startCombatBtn.addEventListener('click', () => {
            console.log('Combat cliqué');
            if (gameState.selectedTroops.length === 0) {
                gameState.showNotification('Sélectionnez au moins une unité !', 'error');
                return;
            }
            showModal('combat-modal');
            if (typeof startCombat === 'function') {
                startCombat();
            }
        });
    }
    
    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            console.log('Magasin cliqué');
            showModal('shop-modal');
            if (typeof initShop === 'function') {
                initShop();
            }
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
    if (typeof saveSystem !== 'undefined' && saveSystem.hasSave) {
        if (saveSystem.hasSave()) {
            if (loadGameBtn) {
                loadGameBtn.textContent = 'Charger Partie ✓';
            }
        }
    } else {
        // Fallback simple
        if (localStorage.getItem('guildMasterSave') && loadGameBtn) {
            loadGameBtn.textContent = 'Charger Partie ✓';
        }
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