// Module de tri des unités
import { RARITY_ORDER } from './constants/game/RarityUtils.js';

export class UnitSorter {
    constructor() {
        this.currentSort = 'none';
        this.sortDirection = 'descending'; // 'ascending' ou 'descending'
        this.initSortControls();
    }
 
    // Initialiser les contrôles de tri
    initSortControls() {
        const sortDirectionBtn = document.getElementById('sort-direction');
        const sortIconBtns = document.querySelectorAll('.sort-icon-btn');

        // Gérer les icônes de tri
        sortIconBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sortType = e.currentTarget.getAttribute('data-sort');
                
                // Retirer la classe active de tous les boutons
                sortIconBtns.forEach(b => b.classList.remove('active'));
                
                // Ajouter la classe active au bouton cliqué
                e.currentTarget.classList.add('active');
                
                this.currentSort = sortType;
                
                // Déclencher le tri via un événement personnalisé
                window.dispatchEvent(new CustomEvent('troopsSortChanged'));
            });
        });

        if (sortDirectionBtn) {
            sortDirectionBtn.addEventListener('click', () => {
                this.toggleSortDirection();
                // Déclencher le tri via un événement personnalisé
                window.dispatchEvent(new CustomEvent('troopsSortChanged'));
            });
        }

        // Gérer le bouton de reset des filtres
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.resetSort();
                // Déclencher le tri via un événement personnalisé
                window.dispatchEvent(new CustomEvent('troopsSortChanged'));
            });
        }

        // Gérer le bouton de relance des troupes sélectionnées
        const rerollSelectedBtn = document.getElementById('reroll-selected-btn');
        if (rerollSelectedBtn) {
            rerollSelectedBtn.addEventListener('click', () => {
                // Importer la fonction de relance depuis UnitManager
                import('./UnitManager.js').then(module => {
                    module.rerollSelectedTroops(window.gameState);
                });
            });
        }
    }

    // Méthode pour mettre à jour l'affichage du bouton de relance
    updateRerollButton() {
        const rerollSection = document.getElementById('reroll-section');
        const rerollCountElement = document.getElementById('reroll-count');
        const rerollSelectedBtn = document.getElementById('reroll-selected-btn');
        
        if (!window.gameState) return;
        
        const hasSelectedTroops = window.gameState.selectedTroops.length > 0;
        const rerollCount = window.gameState.rerollCount || 0;
        
        // Vérifier si le malus de Quilegan est actif
        const isQuileganActive = window.gameState.currentCombat && 
                                window.gameState.currentCombat.isBossFight && 
                                window.gameState.currentCombat.bossName === 'Quilegan' &&
                                !window.gameState.bossManager.isBossMalusDisabled();
        
        if (rerollSection) {
            rerollSection.style.display = hasSelectedTroops ? 'flex' : 'none';
        }
        
        if (rerollCountElement) {
            rerollCountElement.textContent = rerollCount;
        }
        
        // Désactiver le bouton si Quilegan est actif
        if (rerollSelectedBtn) {
            if (isQuileganActive) {
                rerollSelectedBtn.disabled = true;
                rerollSelectedBtn.style.opacity = '0.5';
                rerollSelectedBtn.style.cursor = 'not-allowed';
                rerollSelectedBtn.title = 'Relance bloquée par Quilegan - Vendez un bonus pour débloquer';
            } else {
                rerollSelectedBtn.disabled = false;
                rerollSelectedBtn.style.opacity = '1';
                rerollSelectedBtn.style.cursor = 'pointer';
                rerollSelectedBtn.title = 'Relancer les troupes sélectionnées';
            }
        }
    }

    // Basculer la direction de tri
    toggleSortDirection() {
        this.sortDirection = this.sortDirection === 'ascending' ? 'descending' : 'ascending';
        this.updateSortDirectionUI();
        // Note: applySort sera appelé par updateTroopsUI du GameState
    }

    // Mettre à jour l'interface de la direction de tri
    updateSortDirectionUI() {
        const sortDirectionBtn = document.getElementById('sort-direction');
        const sortIcon = sortDirectionBtn?.querySelector('.sort-icon');
        
        if (sortDirectionBtn && sortIcon) {
            sortDirectionBtn.classList.toggle('ascending', this.sortDirection === 'ascending');
            sortIcon.textContent = this.sortDirection === 'ascending' ? '↑' : '↓';
        }
    }

    // Appliquer le tri aux unités
    applySort(gameState) {
        if (!gameState) return;

        const allAvailableTroops = [...gameState.combatTroops, ...gameState.availableTroops];
        let sortedTroops = [...allAvailableTroops];

        if (this.currentSort !== 'none') {
            sortedTroops = this.sortTroops(allAvailableTroops);
        }

        // Restaurer l'état visuel des boutons
        this.restoreButtonState();

        // Mettre à jour l'affichage avec les unités triées
        this.updateTroopsDisplay(sortedTroops, gameState);
    }

    // Trier les unités selon le critère sélectionné
    sortTroops(troops) {
        const sorted = [...troops];

        switch (this.currentSort) {
            case 'power':
                sorted.sort((a, b) => {
                    const powerA = a.damage * a.multiplier;
                    const powerB = b.damage * b.multiplier;
                    return this.sortDirection === 'ascending' ? powerA - powerB : powerB - powerA;
                });
                break;

            case 'damage':
                sorted.sort((a, b) => {
                    return this.sortDirection === 'ascending' ? a.damage - b.damage : b.damage - a.damage;
                });
                break;

            case 'multiplier':
                sorted.sort((a, b) => {
                    return this.sortDirection === 'ascending' ? a.multiplier - b.multiplier : b.multiplier - a.multiplier;
                });
                break;

            case 'type-cac':
                sorted.sort((a, b) => {
                    const aHasCAC = this.hasTroopType(a, 'Corps à corps');
                    const bHasCAC = this.hasTroopType(b, 'Corps à corps');
                    if (aHasCAC && !bHasCAC) return -1;
                    if (!aHasCAC && bHasCAC) return 1;
                    return this.sortDirection === 'ascending' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                });
                break;

            case 'type-distance':
                sorted.sort((a, b) => {
                    const aHasDistance = this.hasTroopType(a, 'Distance');
                    const bHasDistance = this.hasTroopType(b, 'Distance');
                    if (aHasDistance && !bHasDistance) return -1;
                    if (!aHasDistance && bHasDistance) return 1;
                    return this.sortDirection === 'ascending' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                });
                break;

            case 'type-magique':
                sorted.sort((a, b) => {
                    const aHasMagique = this.hasTroopType(a, 'Magique');
                    const bHasMagique = this.hasTroopType(b, 'Magique');
                    if (aHasMagique && !bHasMagique) return -1;
                    if (!aHasMagique && bHasMagique) return 1;
                    return this.sortDirection === 'ascending' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                });
                break;

            case 'type-physique':
                sorted.sort((a, b) => {
                    const aHasPhysique = this.hasTroopType(a, 'Physique');
                    const bHasPhysique = this.hasTroopType(b, 'Physique');
                    if (aHasPhysique && !bHasPhysique) return -1;
                    if (!aHasPhysique && bHasPhysique) return 1;
                    return this.sortDirection === 'ascending' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                });
                break;

            case 'type-soigneur':
                sorted.sort((a, b) => {
                    const aHasSoigneur = this.hasTroopType(a, 'Soigneur');
                    const bHasSoigneur = this.hasTroopType(b, 'Soigneur');
                    if (aHasSoigneur && !bHasSoigneur) return -1;
                    if (!aHasSoigneur && bHasSoigneur) return 1;
                    return this.sortDirection === 'ascending' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                });
                break;

            case 'rarity':
                sorted.sort((a, b) => {
                    const aRarity = RARITY_ORDER[a.rarity] || 0;
                    const bRarity = RARITY_ORDER[b.rarity] || 0;
                    return this.sortDirection === 'ascending' ? aRarity - bRarity : bRarity - aRarity;
                });
                break;

            case 'name':
                sorted.sort((a, b) => {
                    return this.sortDirection === 'ascending' ? 
                        a.name.localeCompare(b.name) : 
                        b.name.localeCompare(a.name);
                });
                break;
        }

        return sorted;
    }

    // Vérifier si une unité a un type spécifique
    hasTroopType(troop, targetType) {
        if (!troop.type) return false;
        
        if (Array.isArray(troop.type)) {
            return troop.type.includes(targetType);
        } else {
            return troop.type === targetType;
        }
    }

    // Mettre à jour l'affichage des unités triées
    updateTroopsDisplay(sortedTroops, gameState) {
        const availableContainer = document.getElementById('available-troops');
        if (!availableContainer) return;

        availableContainer.innerHTML = '';

        sortedTroops.forEach((troop, displayIndex) => {
            // Vérifier si cette troupe est sélectionnée
            const isSelected = gameState.selectedTroops.some(selectedTroop => selectedTroop.id === troop.id);
            
            // Utiliser l'ID de la troupe au lieu de l'index pour éviter les problèmes de tri
            const troopCard = gameState.createTroopCard(troop, troop.id, isSelected);
            availableContainer.appendChild(troopCard);
        });
        
        // Mettre à jour l'affichage du bouton de relance
        this.updateRerollButton();
    }

    // Réinitialiser le tri
    resetSort() {
        this.currentSort = 'none';
        this.sortDirection = 'descending';
        
        // Retirer la classe active de tous les boutons
        const sortIconBtns = document.querySelectorAll('.sort-icon-btn');
        sortIconBtns.forEach(btn => btn.classList.remove('active'));
        
        this.updateSortDirectionUI();
    }

    // Obtenir les informations de tri actuelles
    getSortInfo() {
        return {
            sort: this.currentSort,
            direction: this.sortDirection
        };
    }

    // Restaurer l'état visuel des boutons
    restoreButtonState() {
        const sortIconBtns = document.querySelectorAll('.sort-icon-btn');
        sortIconBtns.forEach(btn => {
            const sortType = btn.getAttribute('data-sort');
            if (sortType === this.currentSort) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
} 