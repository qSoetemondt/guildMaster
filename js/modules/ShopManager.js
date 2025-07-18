// Gestionnaire de magasin pour GuildMaster
import { BASE_UNITS } from './constants/units/UnitConstants.js';
import { BONUS_DESCRIPTIONS, calculateBonusPrice, getBonusRarity } from './constants/shop/BonusConstants.js';
import { getRarityIcon, getRarityColor, getRarityDisplayName } from './constants/game/RarityUtils.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { ModalManager } from './ModalManager.js';
import { clearUnitCache } from './UnitManager.js';

export class ShopManager {
    constructor() {
        this.currentShopItems = null;
        this.currentShopPurchasedBonuses = [];
        this.currentShopPurchasedUnits = [];
        this.currentShopPurchasedConsumables = [];
        this.shopRefreshCount = 0; // Nombre de rafraîchissements effectués
        this.shopRefreshCost = 10; // Coût initial du rafraîchissement
    }

    // Extraire la création du bouton de rafraîchissement
    createRefreshButton(gameState) {
        const refreshButton = document.createElement('div');
        refreshButton.className = 'shop-refresh-button';
        refreshButton.innerHTML = `
            <div class="refresh-icon">🔄</div>
            <div class="refresh-text">Rafraîchir</div>
            <div class="refresh-cost">${this.shopRefreshCost}💰</div>
        `;
        
        // Griser le bouton si pas assez d'or
        if (gameState.gold < this.shopRefreshCost) {
            refreshButton.style.opacity = '0.5';
            refreshButton.style.cursor = 'not-allowed';
        } else {
            refreshButton.addEventListener('click', () => {
                this.refreshShop(gameState);
            });
        }
        
        return refreshButton;
    }

    // Extraire la vérification de disponibilité d'un item
    checkItemAvailability(item, gameState) {
        const canAfford = gameState.gold >= item.price;
        const isBonusAlreadyPurchasedInSession = item.type === 'bonus' && this.currentShopPurchasedBonuses.includes(item.bonusId);
        const isUnitAlreadyPurchasedInSession = item.type === 'unit' && this.currentShopPurchasedUnits.includes(item.name);
        const isConsumableAlreadyPurchasedInSession = item.type === 'consumable' && this.currentShopPurchasedConsumables.includes(item.consumableType);
        const isConsumableLimitReached = item.type === 'consumable' && gameState.consumableManager.consumables && gameState.consumableManager.consumables.length >= 3;
        
        return {
            canAfford,
            isBonusAlreadyPurchasedInSession,
            isUnitAlreadyPurchasedInSession,
            isConsumableAlreadyPurchasedInSession,
            isConsumableLimitReached,
            isAvailable: canAfford && !isBonusAlreadyPurchasedInSession && !isUnitAlreadyPurchasedInSession && !isConsumableAlreadyPurchasedInSession && !isConsumableLimitReached
        };
    }

    // Obtenir le tag de type d'item
    getItemTypeTag(itemType) {
        switch (itemType) {
            case 'unit': return '⚔️';
            case 'bonus': return '🎁';
            case 'consumable': return '🧪';
            default: return '❓';
        }
    }

    // Extraire la création d'un élément d'item
    createShopItemElement(item, gameState) {
        return gameState.uiManager.createShopItemElement(item, gameState);
    }

    // Extraire l'attachement de l'événement d'achat
    attachPurchaseEvent(itemElement, item, gameState) {
        gameState.uiManager.attachPurchaseEvent(itemElement, item, gameState);
    }

    updatePreCombatShop(gameState) {
        const shopContainer = document.getElementById('pre-combat-shop');
        if (!shopContainer) return;

        shopContainer.innerHTML = '';

        // Ajouter le bouton de rafraîchissement
        const refreshButton = this.createRefreshButton(gameState);
        shopContainer.appendChild(refreshButton);

        // Générer des items aléatoires pour le magasin (seulement si pas déjà générés)
        if (!this.currentShopItems) {
            this.currentShopItems = this.generateShopItems(gameState);
        }
        const shopItems = this.currentShopItems;
        
        // Créer et ajouter chaque item
        shopItems.forEach(item => {
            const itemElement = this.createShopItemElement(item, gameState);
            shopContainer.appendChild(itemElement);
        });
    }

    // Extraire le calcul du prix des unités
    calculateUnitPrice(unit) {
        let basePrice = 25; // Prix de base
        
        // Ajuster le prix selon la rareté
        switch (unit.rarity) {
            case 'common': basePrice = 25; break;
            case 'uncommon': basePrice = 30; break;
            case 'rare': basePrice = 50; break;
            case 'epic': basePrice = 60; break;
            case 'legendary': basePrice = 100; break;
        }
        
        // Ajuster selon les stats (dégâts + multiplicateur)
        const statBonus = Math.floor((unit.damage + unit.multiplier) / 2);
        basePrice += statBonus;
        
        // Prix augmentés de 75% pour équilibrer l'économie
        return Math.ceil(basePrice * 1.75);
    }

    // Extraire la création des items d'unités
    createUnitItems(gameState) {
        return gameState.getShopUnits().map(unit => ({
            type: 'unit',
            name: unit.name,
            icon: unit.icon,
            unitType: unit.type,
            damage: unit.damage,
            multiplier: unit.multiplier,
            price: this.calculateUnitPrice(unit),
            rarity: unit.rarity
        }));
    }

    // Extraire la création des items de bonus
    createBonusItems(bonusDescriptions) {
        return Object.keys(bonusDescriptions).map(bonusId => {
            const bonus = bonusDescriptions[bonusId];
            const price = calculateBonusPrice(bonusId);
            const rarity = getBonusRarity(bonusId);
            
            return {
                type: 'bonus',
                name: bonus.name,
                icon: bonus.icon,
                description: bonus.description,
                bonusId: bonusId,
                price: price,
                rarity: rarity
            };
        });
    }

    // Extraire la gestion des consommables
    addConsumableItems(gameState, allItems) {
        const consumableItem = gameState.addConsumableToShop();
        if (consumableItem) {
            allItems.push(consumableItem);
        }
        return allItems;
    }

    // Extraire la sélection et mélange des items avec pondération par rareté
    selectAndShuffleItems(allItems) {
        // Garantir qu'un consommable soit inclus s'il a été généré
        const consumableItems = allItems.filter(item => item.type === 'consumable');
        const nonConsumableItems = allItems.filter(item => item.type !== 'consumable');
        
        // Sélectionner les items avec pondération par rareté
        const selectedItems = this.selectItemsByRarity(nonConsumableItems, 8);
        
        // Si on a un consommable, l'inclure et prendre 7 autres items
        if (consumableItems.length > 0) {
            const selectedConsumable = consumableItems[0]; // Prendre le premier consommable
            const selectedNonConsumables = selectedItems.slice(0, 7);
            return [selectedConsumable, ...selectedNonConsumables];
        } else {
            // Sinon, prendre 8 items normaux
            return selectedItems.slice(0, 8);
        }
    }

    // Sélectionner les items avec pondération par rareté
    selectItemsByRarity(items, count) {
        // Définir les pourcentages de chance par rareté
        const rarityChances = {
            'common': 0.40,      // 40%
            'uncommon': 0.25,    // 25%
            'rare': 0.18,        // 18%
            'epic': 0.12,        // 12%
            'legendary': 0.05    // 5%
        };

        const selectedItems = [];
        const itemsByRarity = {};

        // Grouper les items par rareté
        items.forEach(item => {
            const rarity = item.rarity || 'common';
            if (!itemsByRarity[rarity]) {
                itemsByRarity[rarity] = [];
            }
            itemsByRarity[rarity].push(item);
        });

        // Sélectionner les items selon les pourcentages
        for (let i = 0; i < count; i++) {
            const random = Math.random();
            let selectedRarity = 'common'; // Par défaut
            let cumulativeChance = 0;

            // Déterminer la rareté selon les pourcentages
            for (const [rarity, chance] of Object.entries(rarityChances)) {
                cumulativeChance += chance;
                if (random <= cumulativeChance) {
                    selectedRarity = rarity;
                    break;
                }
            }

            // Sélectionner un item de cette rareté
            if (itemsByRarity[selectedRarity] && itemsByRarity[selectedRarity].length > 0) {
                const randomIndex = Math.floor(Math.random() * itemsByRarity[selectedRarity].length);
                const selectedItem = itemsByRarity[selectedRarity][randomIndex];
                selectedItems.push(selectedItem);
                
                // Retirer l'item sélectionné pour éviter les doublons
                itemsByRarity[selectedRarity].splice(randomIndex, 1);
            } else {
                // Si pas d'item de cette rareté, prendre un item commun
                if (itemsByRarity['common'] && itemsByRarity['common'].length > 0) {
                    const randomIndex = Math.floor(Math.random() * itemsByRarity['common'].length);
                    const selectedItem = itemsByRarity['common'][randomIndex];
                    selectedItems.push(selectedItem);
                    itemsByRarity['common'].splice(randomIndex, 1);
                } else {
                    // Fallback : prendre le premier item disponible
                    for (const rarity in itemsByRarity) {
                        if (itemsByRarity[rarity] && itemsByRarity[rarity].length > 0) {
                            const selectedItem = itemsByRarity[rarity][0];
                            selectedItems.push(selectedItem);
                            itemsByRarity[rarity].splice(0, 1);
                            break;
                        }
                    }
                }
            }
        }

        return selectedItems;
    }

    generateShopItems(gameState) {
        const bonusDescriptions = gameState.getBonusDescriptions();
        
        // Créer les items d'unités à partir des unités spéciales (quantity = 0)
        const unitItems = this.createUnitItems(gameState);
        
        // Créer tous les items disponibles
        const allItems = [
            ...unitItems,
            // Bonus - générés dynamiquement à partir des définitions centralisées
            ...this.createBonusItems(bonusDescriptions)
        ];
        
        // Ajouter un consommable potentiellement
        this.addConsumableItems(gameState, allItems);
        
        // Sélectionner et mélanger les items finaux
        return this.selectAndShuffleItems(allItems);
    }

    // Réinitialiser le magasin
    resetShop() {
        this.currentShopItems = null;
        this.currentShopPurchasedBonuses = [];
        this.currentShopPurchasedUnits = [];
        this.currentShopPurchasedConsumables = [];
    }

    // Rafraîchir le magasin
    refreshShop(gameState) {
        const cost = this.shopRefreshCost;
        
        if (this.spendGold(gameState, cost)) {
            // Réinitialiser le magasin
            this.currentShopItems = null;
            this.currentShopPurchasedBonuses = [];
            this.currentShopPurchasedUnits = [];
            this.currentShopPurchasedConsumables = [];
            
            // Augmenter le coût pour le prochain rafraîchissement
            this.shopRefreshCount++;
            this.shopRefreshCost = 10 + (this.shopRefreshCount * 5);
            
            // Mettre à jour l'affichage
            this.updatePreCombatShop(gameState);
            gameState.updateUI();
            
            // Notification de succès
            //gameState.showNotification(`Magasin rafraîchi pour ${cost}💰 !`, 'success');
        } else {
            gameState.notificationManager.showInsufficientGold(cost);
        }
    }

    // Dépenser de l'or (centralisé ici)
    spendGold(gameState, amount) {
        if (gameState.gold >= amount) {
            gameState.gold -= amount;
            gameState.gameStats.goldSpent += amount;
            gameState.updateUI();
            return true;
        }
        return false;
    }

    // Acheter une unité (déplacé depuis GameState)
    purchaseUnit(unitName, gameState) {
        // Chercher l'unité dans toutes les unités disponibles
        let unit = gameState.getAllAvailableTroops().find(u => u.name === unitName);
        
        if (unit) {
            // Ajouter l'unité au pool global via ownedUnits
            gameState.ownedUnits[unitName] = (gameState.ownedUnits[unitName] || 0) + 1;
            
            // Nettoyer le cache des unités car les quantités ont changé
            clearUnitCache();
            
            gameState.notificationManager.showUnitAdded(unitName);
            return true;
        }
        
        gameState.notificationManager.showUnitError(`Erreur: Unité ${unitName} non trouvée !`);
        return false;
    }

    openSellBonusesModal(gameState) {
        gameState.uiManager.openSellBonusesModal(gameState);
    }
    
    // Mettre à jour le résumé de vente
    updateSellBonusesSummary(gameState) {
        gameState.uiManager.updateSellBonusesSummary();
    }
    
    // Ajouter les boutons d'action à la modal
    addSellBonusesActions(modal, gameState) {
        gameState.uiManager.addSellBonusesActions(modal, gameState);
    }
    
    // Exécuter la vente des bonus sélectionnés
    executeSellBonuses(gameState) {
        const quantityInputs = document.querySelectorAll('.sell-quantity-input');
        let totalGain = 0;
        let soldCount = 0;
        let soldItems = [];
        
        quantityInputs.forEach(input => {
            const bonusId = input.dataset.bonusId;
            const quantity = parseInt(input.value) || 0;
            const price = parseInt(input.dataset.price);
            
            if (quantity > 0) {
                // Vendre chaque unité du bonus
                for (let i = 0; i < quantity; i++) {
                    if (this.sellBonus(bonusId, gameState)) {
                        totalGain += price;
                        soldCount++;
                    }
                }
                
                // Ajouter à la liste des items vendus pour la notification
                const bonusDescriptions = getBonusDescriptions();
                const bonus = bonusDescriptions[bonusId];
                if (bonus) {
                    soldItems.push(`${quantity}× ${bonus.name}`);
                }
            }
        });
        
        if (soldCount > 0) {
            const message = soldItems.length > 0 ? soldItems.join(', ') : `${soldCount} bonus vendus`;
            gameState.notificationManager.showBonusSold(message, totalGain);
            // Fermer la modal
            ModalManager.hideModal('sell-bonuses-modal');
        }
    }
    
    // Confirmer la vente d'un bonus (ancienne méthode - gardée pour compatibilité)
    confirmSellBonus(bonusId, gameState) {
        const bonusDescriptions = getBonusDescriptions();
        const bonus = bonusDescriptions[bonusId];
        
        if (!bonus || !gameState.unlockedBonuses.includes(bonusId)) {
            return false;
        }
        
        const buyPrice = calculateBonusPrice(bonusId);
        const sellPrice = Math.floor(buyPrice / 2);
        
        // Créer le contenu de la modal
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Confirmer la vente</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Voulez-vous vendre le bonus <strong>${bonus.name}</strong> ?</p>
                    <div class="sell-confirmation-details">
                        <div class="sell-price-info">
                            <span class="sell-price-label">Prix de vente:</span>
                            <span class="sell-price-value">${sellPrice}💰</span>
                        </div>
                        <div class="sell-description">
                            <small>${bonus.description}</small>
                        </div>
                    </div>
                    <div class="sell-confirmation-actions">
                        <button class="btn secondary" id="cancel-sell">Annuler</button>
                        <button class="btn primary" id="confirm-sell">Vendre</button>
                    </div>
                </div>
            </div>
        `;

        // Créer la modal si elle n'existe pas
        let modal = document.getElementById('sell-confirmation-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sell-confirmation-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = modalContent;
        
        // Ajouter les gestionnaires d'événements
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('#cancel-sell');
        const confirmBtn = modal.querySelector('#confirm-sell');
        
        closeBtn.addEventListener('click', () => ModalManager.hideModal('sell-confirmation-modal'));
        cancelBtn.addEventListener('click', () => ModalManager.hideModal('sell-confirmation-modal'));
        
        confirmBtn.addEventListener('click', () => {
            if (this.sellBonus(bonusId, gameState)) {
                ModalManager.hideModal('sell-confirmation-modal');
            }
        });
        
        // Afficher la modal via ModalManager
        ModalManager.showModal('sell-confirmation-modal');
    }

    // Vendre un bonus (prix d'achat / 2)
    sellBonus(bonusId, gameState) {
        // Trouver le bonus dans les descriptions (accès par clé)
        const bonusDescriptions = getBonusDescriptions();
        const bonus = bonusDescriptions[bonusId];
        
        if (bonus && gameState.unlockedBonuses.includes(bonusId)) {
            // Calculer le prix de vente (prix d'achat / 2)
            const buyPrice = calculateBonusPrice(bonusId);
            const sellPrice = Math.floor(buyPrice / 2);
            
            // Retirer le bonus des bonus débloqués
            const bonusIndex = gameState.unlockedBonuses.indexOf(bonusId);
            if (bonusIndex !== -1) {
                gameState.unlockedBonuses.splice(bonusIndex, 1);
                
                // Ajouter l'or
                gameState.addGold(sellPrice);
                
                // Marquer qu'un bonus a été vendu (pour le boss Quilegan)
                if (gameState.currentCombat && gameState.currentCombat.isBossFight && 
                    gameState.currentCombat.bossName === 'Quilegan') {
                    gameState.bossManager.markBonusSold();
                }
                
                gameState.notificationManager.showBonusSold(bonus.name, sellPrice);
                gameState.updateUI();
                gameState.updateActiveBonuses();
                gameState.updateUI(); // Mettre à jour l'affichage de la mécanique
                
                // Mettre à jour directement l'indicateur de Quilegan dans le conteneur de progression
                if (gameState.currentCombat && gameState.currentCombat.isBossFight && 
                    gameState.currentCombat.bossName === 'Quilegan') {
                    gameState.uiManager.updateExistingCombatProgress();
                }
                
                return true;
            }
        }
        return false;
    }
}

// Définitions centralisées des bonus
export function getBonusDescriptions() {
    return BONUS_DESCRIPTIONS;
}

// Débloquer un bonus
export function unlockBonus(bonusId, gameState) {
    // Vérifier que le bonus existe dans les descriptions
    const bonusDescriptions = gameState.getBonusDescriptions();
    if (!bonusDescriptions[bonusId]) {
        console.error(`Tentative de débloquer un bonus invalide: ${bonusId}`);
        return false;
    }
    
    // Liste des bonus dynamiques qui ne peuvent avoir qu'un seul exemplaire
    const dynamicBonuses = ['cac_cest_la_vie', 'economie_dune_vie'];
    
    // Vérifier si c'est un bonus dynamique
    if (dynamicBonuses.includes(bonusId)) {
        // Vérifier si le bonus existe déjà
        const existingIndex = gameState.unlockedBonuses.indexOf(bonusId);
        if (existingIndex !== -1) {
            // Le bonus existe déjà, augmenter sa valeur au lieu d'ajouter un exemplaire
            // Initialiser les états dynamiques si nécessaire
            if (!gameState.dynamicBonusStates) {
                gameState.dynamicBonusStates = {};
            }
            if (!gameState.dynamicBonusStates[bonusId]) {
                gameState.dynamicBonusStates[bonusId] = {};
            }
            
            // Augmenter le compteur approprié selon le type de bonus
            if (bonusId === 'cac_cest_la_vie') {
                // Pour le CAC, augmenter le compteur de base
                if (!gameState.dynamicBonusStates[bonusId]['base']) {
                    gameState.dynamicBonusStates[bonusId]['base'] = 0;
                }
                gameState.dynamicBonusStates[bonusId]['base'] += 1;
            } else if (bonusId === 'economie_dune_vie') {
                // Pour l'économie, augmenter le compteur de combats terminés
                if (!gameState.dynamicBonusStates[bonusId]['end_of_combat']) {
                    gameState.dynamicBonusStates[bonusId]['end_of_combat'] = 0;
                }
                gameState.dynamicBonusStates[bonusId]['end_of_combat'] += 1;
            }
            
            // Mettre à jour immédiatement l'affichage du bonus dynamique
            gameState.updateActiveBonuses();
            
            gameState.showNotification('Bonus dynamique amélioré !', 'success');
        } else {
            // Premier exemplaire du bonus dynamique
            gameState.unlockedBonuses.push(bonusId);
            
            // Initialiser les états dynamiques
            if (!gameState.dynamicBonusStates) {
                gameState.dynamicBonusStates = {};
            }
            if (!gameState.dynamicBonusStates[bonusId]) {
                gameState.dynamicBonusStates[bonusId] = {};
            }
            gameState.dynamicBonusStates[bonusId]['base'] = 0;
            
            gameState.showNotification('Bonus dynamique débloqué !', 'success');
        }
    } else {
        // Bonus normal, permettre l'empilement
        gameState.unlockedBonuses.push(bonusId);
        gameState.showNotification('Bonus débloqué !', 'success');
    }
        
    // Mettre à jour l'interface immédiatement pour afficher le nouveau bonus
    gameState.updateActiveBonuses();
    return true;
} 

// Nettoyer les bonus invalides
export function cleanInvalidBonuses(gameState) {
    const bonusDescriptions = gameState.getBonusDescriptions();
    const validBonuses = Object.keys(bonusDescriptions);
    
    // Filtrer les bonus invalides
    const invalidBonuses = gameState.unlockedBonuses.filter(bonusId => !validBonuses.includes(bonusId));
    
    if (invalidBonuses.length > 0) {
        console.warn('Bonus invalides détectés et supprimés:', invalidBonuses);
        gameState.unlockedBonuses = gameState.unlockedBonuses.filter(bonusId => validBonuses.includes(bonusId));
    }
} 

// Mettre à jour les bonus actifs
export function updateActiveBonuses(gameState, shopManager = null) {
    const bonusesContainer = document.getElementById('active-bonuses');
    if (!bonusesContainer) {
        console.warn('Container active-bonuses non trouvé');
        return;
    }

    bonusesContainer.innerHTML = '';

    if (gameState.unlockedBonuses.length === 0) {
        bonusesContainer.innerHTML = '<span style="color: #666; font-style: italic;">Aucun bonus</span>';
        return;
    }

    const bonusDescriptions = gameState.getBonusDescriptions();

    // Compter les occurrences de chaque bonus
    const bonusCounts = {};
    gameState.unlockedBonuses.forEach(bonusId => {
        bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
    });

    // Liste des bonus dynamiques
    const dynamicBonuses = ['cac_cest_la_vie', 'economie_dune_vie'];
    
    // Afficher chaque bonus avec son nombre
    Object.keys(bonusCounts).forEach(bonusId => {
        const bonus = bonusDescriptions[bonusId];
        if (bonus) {
            const bonusElement = document.createElement('div');
            
            // Déterminer la rareté du bonus
            const rarity = getBonusRarity(bonusId);
            
            // Ajouter la classe de rareté
            bonusElement.className = `bonus-item rarity-${rarity}`;
            
            const count = bonusCounts[bonusId];
            
            // Affichage spécial pour les bonus dynamiques
            let displayText = '';
            if (dynamicBonuses.includes(bonusId)) {
                if (bonusId === 'cac_cest_la_vie') {
                    // Pour le CAC, calculer la puissance totale du bonus
                    let totalPower = 0;
                    
                    // Récupérer la description du bonus pour calculer sa puissance
                    const bonusDesc = bonusDescriptions[bonusId];
                    if (bonusDesc && bonusDesc.effects) {
                        bonusDesc.effects.forEach(effect => {
                            if (effect.condition === 'base') {
                                // Valeur de base + améliorations d'achat
                                let baseValue = effect.value;
                                if (gameState.dynamicBonusStates && 
                                    gameState.dynamicBonusStates[bonusId] && 
                                    gameState.dynamicBonusStates[bonusId]['base']) {
                                    baseValue += gameState.dynamicBonusStates[bonusId]['base'];
                                }
                                totalPower += baseValue;
                            }
                            else if (effect.condition === 'synergy_trigger') {
                                // Bonus des synergies
                                let triggerCount = 0;
                                if (gameState.dynamicBonusStates && 
                                    gameState.dynamicBonusStates[bonusId] && 
                                    gameState.dynamicBonusStates[bonusId][effect.triggerSynergy]) {
                                    triggerCount = gameState.dynamicBonusStates[bonusId][effect.triggerSynergy];
                                }
                                totalPower += effect.value * triggerCount;
                            }
                        });
                    }
                    
                    const powerText = totalPower > 0 ? ` <span class="bonus-count">+${totalPower}</span>` : '';
                    displayText = `${bonus.icon} ${bonus.name}${powerText}`;
                } else if (bonusId === 'economie_dune_vie') {
                    // Pour l'économie, afficher le nombre de combats terminés
                    let combatCount = 0;
                    if (gameState.dynamicBonusStates && 
                        gameState.dynamicBonusStates[bonusId] && 
                        gameState.dynamicBonusStates[bonusId]['end_of_combat']) {
                        combatCount = gameState.dynamicBonusStates[bonusId]['end_of_combat'];
                    }
                    
                    // Toujours afficher le compteur, même s'il est à 0 (pour montrer qu'il existe)
                    const combatText = ` <span class="bonus-count">+${combatCount}</span>`;
                    displayText = `${bonus.icon} ${bonus.name}${combatText}`;
                }
            } else {
                // Pour les bonus normaux, afficher le nombre d'exemplaires
                const countText = count > 1 ? ` <span class="bonus-count">×${count}</span>` : '';
                displayText = `${bonus.icon} ${bonus.name}${countText}`;
            }
            
            bonusElement.innerHTML = displayText;
            
            // Ajouter un événement de clic pour ouvrir la modal
            bonusElement.addEventListener('click', () => {
                showBonusModal(bonusId, bonus, count, gameState);
            });
            
            // Ajouter un curseur pointer pour indiquer que c'est cliquable
            bonusElement.style.cursor = 'pointer';
            
            bonusesContainer.appendChild(bonusElement);
        } else {
            // Si le bonus n'est pas trouvé, afficher un message d'erreur temporaire
            console.warn(`Bonus non trouvé: ${bonusId}`);
            const bonusElement = document.createElement('div');
            bonusElement.className = 'bonus-item';
            bonusElement.style.color = '#ff6b6b';
            const count = bonusCounts[bonusId];
            const countText = count > 1 ? ` <span class="bonus-count">×${count}</span>` : '';
            bonusElement.innerHTML = `
                ❓ Bonus Inconnu${countText}
                <div class="bonus-tooltip">Bonus non défini: ${bonusId}</div>
            `;
            bonusesContainer.appendChild(bonusElement);
        }
    });
}

// Afficher la modal de détail d'un bonus
function showBonusModal(bonusId, bonus, count, gameState) {
    // Calculer le prix de vente
    const buyPrice = calculateBonusPrice(bonusId);
    const sellPrice = Math.floor(buyPrice / 2);
    
    // Déterminer la rareté
    const rarity = getBonusRarity(bonusId);
    const rarityIcon = getRarityIcon(rarity);
    const rarityName = getRarityDisplayName(rarity);
    
    // Calculer la description dynamique pour les bonus dynamiques
    let dynamicDescription = bonus.description;
    if (bonusId === 'cac_cest_la_vie' && bonus.effects) {
        let totalValue = 0;
        let triggerCount = 0;
        let baseValue = 0;
        
        bonus.effects.forEach(effect => {
            if (effect.condition === 'base') {
                // Valeur de base + améliorations d'achat
                baseValue = effect.value;
                if (gameState.dynamicBonusStates && 
                    gameState.dynamicBonusStates[bonusId] && 
                    gameState.dynamicBonusStates[bonusId]['base']) {
                    baseValue += gameState.dynamicBonusStates[bonusId]['base'];
                }
                totalValue += baseValue;
            }
            else if (effect.condition === 'synergy_trigger') {
                // Récupérer le compteur depuis les états sauvegardés
                if (gameState.dynamicBonusStates && 
                    gameState.dynamicBonusStates[bonusId] && 
                    gameState.dynamicBonusStates[bonusId][effect.triggerSynergy]) {
                    triggerCount = gameState.dynamicBonusStates[bonusId][effect.triggerSynergy];
                } else {
                    triggerCount = effect.triggerCount || 0;
                }
                totalValue += effect.value * triggerCount;
            }
        });
        
        dynamicDescription = `Augmente les multiplicateurs de +${totalValue} des unités de corps à corps. +1 bonus supplémentaire à chaque activation de Formation Corps à Corps. (Actuellement : +${triggerCount} activations)`;
    }
    else if (bonusId === 'economie_dune_vie' && bonus.effects) {
        let totalValue = 0;
        let combatCount = 0;
        let baseValue = 0;
        
        bonus.effects.forEach(effect => {
            if (effect.condition === 'base') {
                // Valeur de base + améliorations d'achat
                baseValue = effect.value;
                if (gameState.dynamicBonusStates && 
                    gameState.dynamicBonusStates[bonusId] && 
                    gameState.dynamicBonusStates[bonusId]['base']) {
                    baseValue += gameState.dynamicBonusStates[bonusId]['base'];
                }
                totalValue += baseValue;
            }
            else if (effect.condition === 'end_of_combat') {
                // Récupérer le compteur depuis les états sauvegardés
                if (gameState.dynamicBonusStates && 
                    gameState.dynamicBonusStates[bonusId] && 
                    gameState.dynamicBonusStates[bonusId]['end_of_combat']) {
                    combatCount = gameState.dynamicBonusStates[bonusId]['end_of_combat'];
                } else {
                    combatCount = effect.triggerCount || 0;
                }
                totalValue += effect.value * combatCount;
            }
        });
        
        dynamicDescription = `Ce bonus donne +${totalValue} d'or par combat. Il augmente de +2 d'or par combat terminé. (Actuellement : +${combatCount} combats terminés)`;
    }
    
    // Créer le contenu de la modal
    const modalContent = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>${rarityIcon} ${bonus.icon} ${bonus.name}</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="bonus-detail-info">
                    <div class="bonus-rarity">
                        <strong>Rareté :</strong> ${rarityIcon} ${rarityName}
                    </div>
                    <div class="bonus-description">
                        <strong>Description :</strong><br>
                        ${dynamicDescription}
                    </div>
                    <div class="bonus-quantity">
                        <strong>Quantité possédée :</strong> ${count}
                    </div>
                    <div class="bonus-price">
                        <strong>Prix de vente :</strong> ${sellPrice}💰 (50% du prix d'achat)
                    </div>
                </div>
                <div class="bonus-actions">
                                            <button class="btn secondary close-modal-btn">Fermer</button>
                        <button class="btn danger sell-bonus-btn" ${count === 0 ? 'disabled' : ''}>
                        Vendre 1 exemplaire (${sellPrice}💰)
                    </button>
                </div>
            </div>
        </div>
    `;

    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('bonus-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bonus-detail-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = modalContent;
    
    // Gérer la fermeture
    const closeBtn = modal.querySelector('.close-btn');
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    const sellBtn = modal.querySelector('.sell-bonus-btn');
    
    closeBtn.addEventListener('click', () => ModalManager.hideModal('bonus-detail-modal'));
    closeModalBtn.addEventListener('click', () => ModalManager.hideModal('bonus-detail-modal'));
    
    // Gérer la vente - utiliser la méthode sellBonus pour s'assurer que Quilegan est géré
    sellBtn.addEventListener('click', () => {
        if (count > 0) {
            // Utiliser la méthode sellBonus pour s'assurer que Quilegan est géré correctement
            const shopManager = gameState.shopManager;
            if (shopManager && shopManager.sellBonus(bonusId, gameState)) {
                // Fermer la modal
                ModalManager.hideModal('bonus-detail-modal');
            }
        }
    });
    
    // Afficher la modal via ModalManager
    ModalManager.showModal('bonus-detail-modal');
}