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
    
    // Liste des bonus dynamiques qui ne peuvent avoir qu'un seul exemplaire
    const dynamicBonuses = ['cac_cest_la_vie'];
    
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
            const rarityIcon = getRarityIcon(rarity);
            
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
                    displayText = `${rarityIcon} ${bonus.icon} ${bonus.name}${powerText}`;
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
                    displayText = `${rarityIcon} ${bonus.icon} ${bonus.name}${combatText}`;
                }
            } else {
                // Pour les bonus normaux, afficher le nombre d'exemplaires
                const countText = count > 1 ? ` <span class="bonus-count">×${count}</span>` : '';
                displayText = `${rarityIcon} ${bonus.icon} ${bonus.name}${countText}`;
            }
            
            bonusElement.innerHTML = displayText;
            
            // Ajouter un événement de clic pour ouvrir la modal
            bonusElement.addEventListener('click', () => {
                showBonusModal(bonusId, bonus, count, gameState);
            });
            
            // Ajouter un curseur pointer pour indiquer que c'est cliquable
            bonusElement.style.cursor = 'pointer';
            
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

// Afficher la modal de détail d'un bonus
function showBonusModal(bonusId, bonus, count, gameState) {
    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'bonus-detail-modal';
    
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
    
    modal.innerHTML = `
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
    
    // Ajouter la modal au DOM
    document.body.appendChild(modal);
    
    // Gérer la fermeture
    const closeBtn = modal.querySelector('.close-btn');
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    const sellBtn = modal.querySelector('.sell-bonus-btn');
    
    const closeModal = () => {
        modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Gérer la vente
    sellBtn.addEventListener('click', () => {
        if (count > 0) {
            // Retirer un exemplaire du bonus
            const bonusIndex = gameState.unlockedBonuses.indexOf(bonusId);
            if (bonusIndex !== -1) {
                gameState.unlockedBonuses.splice(bonusIndex, 1);
                
                // Ajouter l'or
                gameState.addGold(sellPrice);
                
                // Mettre à jour l'affichage
                updateActiveBonuses(gameState);
                
                // Fermer la modal
                closeModal();
                
                // Notification
                gameState.showNotification(`Bonus vendu ! +${sellPrice} or`, 'success');
            }
        }
    });
    
    // Fermer avec Échap
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Fermer en cliquant sur l'overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
} 