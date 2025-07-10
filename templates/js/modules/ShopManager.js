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

    // Mettre à jour le magasin avant combat
    updatePreCombatShop(gameState) {
        const shopContainer = document.getElementById('pre-combat-shop');
        if (!shopContainer) return;

        shopContainer.innerHTML = '';

        // Ajouter le bouton de rafraîchissement
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
        
        shopContainer.appendChild(refreshButton);

        // Générer des items aléatoires pour le magasin (seulement si pas déjà générés)
        if (!this.currentShopItems) {
            this.currentShopItems = this.generateShopItems(gameState);
        }
        const shopItems = this.currentShopItems;
        
        shopItems.forEach(item => {
            const itemElement = document.createElement('div');
            
            // Ajouter la classe de rareté
            const rarityClass = item.rarity ? `rarity-${item.rarity}` : '';
            itemElement.className = `shop-item ${rarityClass}`;
            
            const canAfford = gameState.gold >= item.price;
            const isBonusAlreadyPurchasedInSession = item.type === 'bonus' && this.currentShopPurchasedBonuses.includes(item.bonusId);
            const isUnitAlreadyPurchasedInSession = item.type === 'unit' && this.currentShopPurchasedUnits.includes(item.name);
            const isConsumableAlreadyPurchasedInSession = item.type === 'consumable' && this.currentShopPurchasedConsumables.includes(item.consumableType);
            // Limite de consommables atteinte ?
            const isConsumableLimitReached = item.type === 'consumable' && gameState.consumableManager.consumables && gameState.consumableManager.consumables.length >= 3;
            
            // Griser si pas assez d'or OU si déjà acheté dans cette session OU limite consommable atteinte
            if (!canAfford || isBonusAlreadyPurchasedInSession || isUnitAlreadyPurchasedInSession || isConsumableAlreadyPurchasedInSession || isConsumableLimitReached) {
                itemElement.style.opacity = '0.5';
            }
            
            // Déterminer le tag de type
            let typeTag = '';
            switch (item.type) {
                case 'unit':
                    typeTag = 'Unité';
                    break;
                case 'consumable':
                    typeTag = 'Cons.';
                    break;
                case 'bonus':
                    typeTag = 'Bonus';
                    break;
            }
            
            if (item.type === 'unit') {
                // Afficher les types (gère les types multiples)
                const typeDisplay = getTypeDisplayString(item.unitType);
                
                itemElement.innerHTML = `
                    <div class="item-type-tag" data-type="${item.type}">${typeTag}</div>
                    <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">${typeDisplay}</div>
                    <div style="font-size: 0.8rem; margin-bottom: 10px;"><span class="shop-damage">${item.damage}</span> × <span class="shop-multiplier">${item.multiplier}</span></div>
                    ${item.rarity ? `<div style="margin-bottom: 10px; font-weight: 600; color: ${getRarityColor(item.rarity)}; font-size: 0.8rem;">
                        ${getRarityIcon(item.rarity)} ${getRarityDisplayName(item.rarity)}
                    </div>` : ''}
                    <div class="item-price">${item.price}💰</div>
                `;
            } else {
                itemElement.innerHTML = `
                    <div class="item-type-tag" data-type="${item.type}">${typeTag}</div>
                    <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">${item.description}</div>
                    ${item.rarity ? `<div style="margin-bottom: 10px; font-weight: 600; color: ${getRarityColor(item.rarity)}; font-size: 0.8rem;">
                        ${getRarityIcon(item.rarity)} ${getRarityDisplayName(item.rarity)}
                    </div>` : ''}
                    <div class="item-price">${item.price}💰</div>
                `;
            }
            
            // Permettre l'achat seulement si on peut se le permettre ET que le bonus n'est pas déjà acheté dans cette session ET limite consommable non atteinte
            if (canAfford && !isBonusAlreadyPurchasedInSession && !isUnitAlreadyPurchasedInSession && !isConsumableAlreadyPurchasedInSession && !isConsumableLimitReached) {
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
            
            shopContainer.appendChild(itemElement);
        });
    }

    // Générer des items pour le magasin
    generateShopItems(gameState) {
        const bonusDescriptions = gameState.getBonusDescriptions();
        
        // Fonction pour calculer le prix d'une unité
        const calculateUnitPrice = (unit) => {
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
        };
        
        // Créer les items d'unités à partir des unités spéciales (quantity = 0)
        const unitItems = gameState.getShopUnits().map(unit => ({
            type: 'unit',
            name: unit.name,
            icon: unit.icon,
            unitType: unit.type,
            damage: unit.damage,
            multiplier: unit.multiplier,
            price: calculateUnitPrice(unit),
            rarity: unit.rarity
        }));
        
        const allItems = [
            ...unitItems,
            // Bonus - générés dynamiquement à partir des définitions centralisées
            ...Object.keys(bonusDescriptions).map(bonusId => {
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
            })
        ];
        
        // Ajouter un consommable potentiellement
        const consumableItem = gameState.addConsumableToShop();
        if (consumableItem) {
            allItems.push(consumableItem);
        }
        
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
            gameState.showNotification(`Or insuffisant ! Coût : ${cost}💰`, 'error');
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
            gameState.showNotification(`+1 ${unitName} ajouté à votre collection !`, 'success');
            return true;
        } else {
            // Si c'est une unité spéciale, l'ajouter à ownedUnits
            unit = gameState.getShopUnits().find(u => u.name === unitName);
            if (unit) {
                // Mettre à jour ownedUnits seulement (pas de modification de BASE_UNITS)
                gameState.ownedUnits[unitName] = (gameState.ownedUnits[unitName] || 0) + 1;
                gameState.showNotification(`+1 ${unitName} ajouté à votre collection !`, 'success');
                return true;
            }
        }
        
        gameState.showNotification(`Erreur: Unité ${unitName} non trouvée !`, 'error');
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
export function updateActiveBonuses(gameState) {
    const bonusesContainer = document.getElementById('active-bonuses');
    if (!bonusesContainer) {
        console.warn('Container active-bonuses non trouvé');
        return;
    }

    console.log('Mise à jour des bonus actifs. Bonus débloqués:', gameState.unlockedBonuses);

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

    console.log('Comptage des bonus:', bonusCounts);

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
            const rarityIcon = getRarityIcon(rarity);
            
            bonusElement.innerHTML = `
                ${rarityIcon} ${bonus.icon} ${bonus.name}${countText}
                <div class="bonus-tooltip">${bonus.description}${count > 1 ? ` - ${count} fois` : ''}</div>
            `;
            bonusesContainer.appendChild(bonusElement);
            console.log(`Bonus affiché: ${bonus.name} (count: ${count}, rarity: ${rarity})`);
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