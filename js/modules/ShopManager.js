// Gestionnaire de magasin pour GuildMaster
import { BASE_UNITS } from './UnitConstants.js';
import { BONUS_DESCRIPTIONS, calculateBonusPrice, getBonusRarity } from './BonusConstants.js';
import { getRarityIcon, getRarityColor, getRarityDisplayName } from './RarityUtils.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';

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

    // Extraire la détermination du tag de type
    getItemTypeTag(itemType) {
        switch (itemType) {
            case 'unit': return 'Unité';
            case 'consumable': return 'Cons.';
            case 'bonus': return 'Bonus';
            default: return '';
        }
    }

    // Extraire la création du HTML pour un item d'unité
    createUnitItemHTML(item) {
        const typeDisplay = getTypeDisplayString(item.unitType);
        const rarityHTML = item.rarity ? 
            `<div style="margin-bottom: 10px; font-weight: 600; color: ${getRarityColor(item.rarity)}; font-size: 0.8rem;">
                ${getRarityIcon(item.rarity)} ${getRarityDisplayName(item.rarity)}
            </div>` : '';
        
        return `
            <div class="item-type-tag" data-type="${item.type}">${this.getItemTypeTag(item.type)}</div>
            <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
            <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">${typeDisplay}</div>
            <div style="font-size: 0.8rem; margin-bottom: 10px;"><span class="shop-damage">${item.damage}</span> × <span class="shop-multiplier">${item.multiplier}</span></div>
            ${rarityHTML}
            <div class="item-price">${item.price}💰</div>
        `;
    }

    // Extraire la création du HTML pour un item de bonus/consommable
    createBonusConsumableItemHTML(item) {
        const rarityHTML = item.rarity ? 
            `<div style="margin-bottom: 10px; font-weight: 600; color: ${getRarityColor(item.rarity)}; font-size: 0.8rem;">
                ${getRarityIcon(item.rarity)} ${getRarityDisplayName(item.rarity)}
            </div>` : '';
        
        return `
            <div class="item-type-tag" data-type="${item.type}">${this.getItemTypeTag(item.type)}</div>
            <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
            <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">${item.description}</div>
            ${rarityHTML}
            <div class="item-price">${item.price}💰</div>
        `;
    }

    // Extraire la création d'un élément d'item
    createShopItemElement(item, gameState) {
        const itemElement = document.createElement('div');
        
        // Ajouter la classe de rareté
        const rarityClass = item.rarity ? `rarity-${item.rarity}` : '';
        itemElement.className = `shop-item ${rarityClass}`;
        
        // Vérifier la disponibilité
        const availability = this.checkItemAvailability(item, gameState);
        
        // Griser si pas disponible
        if (!availability.isAvailable) {
            itemElement.style.opacity = '0.5';
        }
        
        // Créer le HTML selon le type d'item
        if (item.type === 'unit') {
            itemElement.innerHTML = this.createUnitItemHTML(item);
        } else {
            itemElement.innerHTML = this.createBonusConsumableItemHTML(item);
        }
        
        // Ajouter l'événement d'achat si disponible
        if (availability.isAvailable) {
            this.attachPurchaseEvent(itemElement, item, gameState);
        }
        
        return itemElement;
    }

    // Extraire l'attachement de l'événement d'achat
    attachPurchaseEvent(itemElement, item, gameState) {
        itemElement.addEventListener('click', () => {
            if (this.spendGold(gameState, item.price)) {
                if (item.type === 'unit') {
                    // Utiliser la nouvelle méthode pour acheter l'unité
                    const success = this.purchaseUnit(item.name, gameState);
                    if (success) {
                        // Ajouter à la liste des unités achetées dans cette session
                        this.currentShopPurchasedUnits.push(item.name);
                    }
                } else if (item.type === 'consumable') {
                    // Ajouter le consommable à l'inventaire
                    gameState.addConsumable(item.consumableType);
                    // Ajouter à la liste des consomables achetés dans cette session
                    this.currentShopPurchasedConsumables.push(item.consumableType);
                } else {
                    gameState.unlockBonus(item.bonusId);
                    // Ajouter le bonus à la liste des bonus achetés dans cette session
                    this.currentShopPurchasedBonuses.push(item.bonusId);
                }
                gameState.updateUI();
                gameState.updateActiveBonuses(); // Forcer la mise à jour des bonus actifs
            }
        });
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

    // Extraire la sélection et mélange des items
    selectAndShuffleItems(allItems) {
        // Garantir qu'un consommable soit inclus s'il a été généré
        const consumableItems = allItems.filter(item => item.type === 'consumable');
        const nonConsumableItems = allItems.filter(item => item.type !== 'consumable');
        
        // Mélanger les items non-consommables
        const shuffledNonConsumables = nonConsumableItems.sort(() => Math.random() - 0.5);
        
        // Si on a un consommable, l'inclure et prendre 7 autres items
        if (consumableItems.length > 0) {
            const selectedConsumable = consumableItems[0]; // Prendre le premier consommable
            const selectedNonConsumables = shuffledNonConsumables.slice(0, 7);
            return [selectedConsumable, ...selectedNonConsumables];
        } else {
            // Sinon, prendre 8 items normaux
            return shuffledNonConsumables.slice(0, 8);
        }
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
        // Chercher d'abord dans les unités de base
        let unit = gameState.getBaseUnits().find(u => u.name === unitName);
        
        if (unit) {
            // Si c'est une unité de base, augmenter sa quantité dans ownedUnits seulement
            gameState.ownedUnits[unitName] = (gameState.ownedUnits[unitName] || 0) + 1;
            gameState.notificationManager.showUnitAdded(unitName);
            return true;
        } else {
            // Si c'est une unité spéciale, l'ajouter à ownedUnits
            unit = gameState.getShopUnits().find(u => u.name === unitName);
            if (unit) {
                // Mettre à jour ownedUnits seulement (pas de modification de BASE_UNITS)
                gameState.ownedUnits[unitName] = (gameState.ownedUnits[unitName] || 0) + 1;
                gameState.notificationManager.showUnitAdded(unitName);
                return true;
            }
        }
        
        gameState.notificationManager.showUnitError(`Erreur: Unité ${unitName} non trouvée !`);
        return false;
    }

    // Ouvrir la modal de vente de bonus
    openSellBonusesModal(gameState) {
        const modal = document.getElementById('sell-bonuses-modal');
        const bonusesList = document.getElementById('sell-bonuses-list');
        const totalGoldGain = document.getElementById('total-gold-gain');
        
        if (!modal || !bonusesList) {
            console.error('Modal de vente de bonus non trouvée');
            return;
        }
        
        // Vider la liste
        bonusesList.innerHTML = '';
        
        // Compter les occurrences de chaque bonus
        const bonusCounts = {};
        gameState.unlockedBonuses.forEach(bonusId => {
            bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
        });
        
        const bonusDescriptions = getBonusDescriptions();
        let totalGain = 0;
        
        // Créer les éléments pour chaque bonus
        Object.keys(bonusCounts).forEach(bonusId => {
            const bonus = bonusDescriptions[bonusId];
            if (bonus) {
                const count = bonusCounts[bonusId];
                const buyPrice = calculateBonusPrice(bonusId);
                const sellPrice = Math.floor(buyPrice / 2);
                const totalPrice = sellPrice * count;
                totalGain += totalPrice;
                
                const bonusElement = document.createElement('div');
                bonusElement.className = 'sell-bonus-item';
                bonusElement.innerHTML = `
                    <div class="sell-bonus-info">
                        <div class="sell-bonus-name">
                            ${bonus.icon} ${bonus.name}
                        </div>
                        <div class="sell-bonus-description">${bonus.description}</div>
                        <div class="sell-bonus-count">Quantité disponible : ${count}</div>
                    </div>
                    <div class="sell-bonus-controls">
                        <div class="sell-quantity-controls">
                            <button class="quantity-btn minus" data-bonus-id="${bonusId}" title="Diminuer">-</button>
                            <input type="number" class="sell-quantity-input" value="0" min="0" max="${count}" data-bonus-id="${bonusId}" data-price="${sellPrice}">
                            <button class="quantity-btn plus" data-bonus-id="${bonusId}" title="Augmenter">+</button>
                        </div>
                        <div class="sell-bonus-price">
                            <div class="sell-bonus-price-value">${sellPrice}💰 par unité</div>
                            <div class="sell-bonus-price-total">Total : <span class="total-price">0💰</span></div>
                        </div>
                    </div>
                `;
                
                // Ajouter les événements pour les contrôles de quantité
                const minusBtn = bonusElement.querySelector('.quantity-btn.minus');
                const plusBtn = bonusElement.querySelector('.quantity-btn.plus');
                const quantityInput = bonusElement.querySelector('.sell-quantity-input');
                const totalPriceSpan = bonusElement.querySelector('.total-price');
                
                // Fonction pour mettre à jour le prix total
                const updateTotalPrice = () => {
                    const quantity = parseInt(quantityInput.value) || 0;
                    const totalPrice = quantity * sellPrice;
                    totalPriceSpan.textContent = `${totalPrice}💰`;
                    
                    // Mettre à jour l'apparence de l'élément
                    bonusElement.classList.toggle('has-quantity', quantity > 0);
                    
                    // Mettre à jour l'état des boutons
                    minusBtn.disabled = quantity <= 0;
                    plusBtn.disabled = quantity >= count;
                    
                    this.updateSellBonusesSummary();
                };
                
                // Événements pour les boutons + et -
                minusBtn.addEventListener('click', () => {
                    const currentValue = parseInt(quantityInput.value) || 0;
                    if (currentValue > 0) {
                        quantityInput.value = currentValue - 1;
                        updateTotalPrice();
                    }
                });
                
                plusBtn.addEventListener('click', () => {
                    const currentValue = parseInt(quantityInput.value) || 0;
                    if (currentValue < count) {
                        quantityInput.value = currentValue + 1;
                        updateTotalPrice();
                    }
                });
                
                // Événement pour l'input direct
                quantityInput.addEventListener('input', updateTotalPrice);
                
                bonusesList.appendChild(bonusElement);
            }
        });
        
        // Mettre à jour le total initial
        totalGoldGain.textContent = '0💰';
        
        // Ajouter les boutons d'action
        this.addSellBonusesActions(modal, gameState);
        
        // Afficher la modal
        modal.style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
        
        // Gérer la fermeture
        const closeModal = () => {
            modal.style.display = 'none';
            document.getElementById('modal-overlay').style.display = 'none';
        };
        
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        document.getElementById('modal-overlay').addEventListener('click', closeModal);
    }
    
    // Mettre à jour le résumé de vente
    updateSellBonusesSummary() {
        const quantityInputs = document.querySelectorAll('.sell-quantity-input');
        const totalGoldGain = document.getElementById('total-gold-gain');
        
        let totalGain = 0;
        quantityInputs.forEach(input => {
            const quantity = parseInt(input.value) || 0;
            const price = parseInt(input.dataset.price);
            totalGain += price * quantity;
        });
        
        totalGoldGain.textContent = `${totalGain}💰`;
    }
    
    // Ajouter les boutons d'action à la modal
    addSellBonusesActions(modal, gameState) {
        // Supprimer les anciens boutons s'ils existent
        const existingActions = modal.querySelector('.sell-bonuses-actions');
        if (existingActions) {
            existingActions.remove();
        }
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'sell-bonuses-actions';
        actionsDiv.innerHTML = `
            <button class="btn secondary" id="cancel-sell-all">Annuler</button>
            <button class="btn primary" id="confirm-sell-all">Vendre Sélectionnés</button>
        `;
        
        modal.querySelector('.modal-body').appendChild(actionsDiv);
        
        // Gérer les événements
        actionsDiv.querySelector('#cancel-sell-all').addEventListener('click', () => {
            modal.style.display = 'none';
            document.getElementById('modal-overlay').style.display = 'none';
        });
        
        actionsDiv.querySelector('#confirm-sell-all').addEventListener('click', () => {
            this.executeSellBonuses(gameState);
        });
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
            document.getElementById('sell-bonuses-modal').style.display = 'none';
            document.getElementById('modal-overlay').style.display = 'none';
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
        
        // Créer une modal de confirmation
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
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
        
        // Ajouter la modal au DOM
        document.body.appendChild(modal);
        document.getElementById('modal-overlay').style.display = 'block';
        
        // Gérer la fermeture
        const closeModal = () => {
            document.body.removeChild(modal);
            document.getElementById('modal-overlay').style.display = 'none';
        };
        
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('#cancel-sell').addEventListener('click', closeModal);
        
        // Gérer la confirmation
        modal.querySelector('#confirm-sell').addEventListener('click', () => {
            if (this.sellBonus(bonusId, gameState)) {
                closeModal();
            }
        });
        
        // Fermer en cliquant sur l'overlay
        document.getElementById('modal-overlay').addEventListener('click', closeModal);
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
                    console.log('🐛 Quilegan: Bonus vendu, malus désactivé');
                }
                
                gameState.notificationManager.showBonusSold(bonus.name, sellPrice);
                gameState.updateUI();
                gameState.updateActiveBonuses();
                gameState.updateCombatInfo(); // Mettre à jour l'affichage de la mécanique
                
                // Mettre à jour directement l'indicateur de Quilegan dans le conteneur de progression
                if (gameState.currentCombat && gameState.currentCombat.isBossFight && 
                    gameState.currentCombat.bossName === 'Quilegan') {
                    gameState.updateExistingCombatProgress();
                }
                
                // Mettre à jour l'affichage du malus de boss si il existe
                gameState.updateBossMalusDisplay();
                
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
    
    // Ajouter le bonus (permet l'empilement)
    gameState.unlockedBonuses.push(bonusId);
    // gameState.showNotification('Bonus débloqué !', 'success');
        
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
            const countText = count > 1 ? ` <span class="bonus-count">×${count}</span>` : '';
            
            bonusElement.innerHTML = `
                ${bonus.icon} ${bonus.name}${countText}
                <div class="bonus-tooltip">${bonus.description}${count > 1 ? ` - ${count} fois` : ''}</div>
            `;
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