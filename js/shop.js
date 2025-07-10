// Système de magasin
class ShopSystem {
    constructor() {
        this.currentItems = [];
        this.currentPack = [];
        this.bonuses = this.defineBonuses();
    }

    // Définir les bonus disponibles
    defineBonuses() {
        return [
            {
                name: 'Épée Aiguisée',
                type: 'bonus',
                effect: { damage: 2, target: 'Corps à corps' },
                icon: '⚔️',
                price: 75,
                description: '+2 dégâts pour les unités corps à corps',
                rarity: 'common'
            },
            {
                name: 'Arc Renforcé',
                type: 'bonus',
                effect: { damage: 2, target: 'Distance' },
                icon: '🏹',
                price: 75,
                description: '+2 dégâts pour les unités distance',
                rarity: 'common'
            },
            {
                name: 'Grimoire Magique',
                type: 'bonus',
                effect: { damage: 2, target: 'Magique' },
                icon: '📚',
                price: 75,
                description: '+2 dégâts pour les unités magiques',
                rarity: 'common'
            },
            {
                name: 'Amulette de Force',
                type: 'bonus',
                effect: { multiplier: 1, target: 'Corps à corps' },
                icon: '💎',
                price: 100,
                description: '+1 multiplicateur pour les unités corps à corps',
                rarity: 'uncommon'
            },
            {
                name: 'Cristal de Précision',
                type: 'bonus',
                effect: { multiplier: 1, target: 'Distance' },
                icon: '💎',
                price: 100,
                description: '+1 multiplicateur pour les unités distance',
                rarity: 'uncommon'
            },
            {
                name: 'Orbe Mystique',
                type: 'bonus',
                effect: { multiplier: 1, target: 'Magique' },
                icon: '🔮',
                price: 100,
                description: '+1 multiplicateur pour les unités magiques',
                rarity: 'uncommon'
            },
            {
                name: 'Armure Légendaire',
                type: 'bonus',
                effect: { damage: 5, multiplier: 2, target: 'Corps à corps' },
                icon: '🛡️',
                price: 200,
                description: '+5 dégâts et +2 multiplicateur pour les unités corps à corps',
                rarity: 'rare'
            },
            {
                name: 'Arc Divin',
                type: 'bonus',
                effect: { damage: 5, multiplier: 2, target: 'Distance' },
                icon: '🏹',
                price: 200,
                description: '+5 dégâts et +2 multiplicateur pour les unités distance',
                rarity: 'rare'
            },
            {
                name: 'Baguette Suprême',
                type: 'bonus',
                effect: { damage: 5, multiplier: 2, target: 'Magique' },
                icon: '🪄',
                price: 200,
                description: '+5 dégâts et +2 multiplicateur pour les unités magiques',
                rarity: 'rare'
            },
            {
                name: 'Potion de Force',
                type: 'bonus',
                effect: { damage: 3, target: 'all' },
                icon: '🧪',
                price: 150,
                description: '+3 dégâts pour toutes les unités',
                rarity: 'uncommon'
            },
            {
                name: 'Élixir de Puissance',
                type: 'bonus',
                effect: { multiplier: 1, target: 'all' },
                icon: '🧪',
                price: 150,
                description: '+1 multiplicateur pour toutes les unités',
                rarity: 'uncommon'
            },
            {
                name: 'Relique Ancienne',
                type: 'bonus',
                effect: { damage: 10, multiplier: 3, target: 'all' },
                icon: '🏛️',
                price: 500,
                description: '+10 dégâts et +3 multiplicateur pour toutes les unités',
                rarity: 'legendary'
            }
        ];
    }

    // Générer le contenu du magasin
    generateShop() {
        this.currentItems = [];
        this.currentPack = [];

        // Générer 6 items aléatoires (unités ou bonus)
        for (let i = 0; i < 6; i++) {
            if (Math.random() < 0.7) {
                // 70% de chance d'avoir une unité
                this.currentItems.push({
                    ...getRandomUnit(gameState.rank),
                    type: 'unit'
                });
            } else {
                // 30% de chance d'avoir un bonus
                const bonus = this.bonuses[Math.floor(Math.random() * this.bonuses.length)];
                this.currentItems.push({
                    ...bonus,
                    type: 'bonus'
                });
            }
        }

        // Générer le pack aléatoire (3 items)
        for (let i = 0; i < 3; i++) {
            if (Math.random() < 0.6) {
                // 60% de chance d'avoir une unité
                this.currentPack.push({
                    ...getRandomUnit(gameState.rank),
                    type: 'unit'
                });
            } else {
                // 40% de chance d'avoir un bonus
                const bonus = this.bonuses[Math.floor(Math.random() * this.bonuses.length)];
                this.currentPack.push({
                    ...bonus,
                    type: 'bonus'
                });
            }
        }
    }

    // Afficher le magasin
    displayShop() {
        const itemsContainer = document.getElementById('shop-items-list');
        const packContainer = document.getElementById('shop-pack-items');

        // Vider les conteneurs
        itemsContainer.innerHTML = '';
        packContainer.innerHTML = '';

        // Afficher les items normaux
        this.currentItems.forEach((item, index) => {
            const itemElement = this.createShopItem(item, index, false);
            itemsContainer.appendChild(itemElement);
        });

        // Afficher le pack
        this.currentPack.forEach((item, index) => {
            const itemElement = this.createShopItem(item, index, true);
            packContainer.appendChild(itemElement);
        });
    }

    // Créer un élément du magasin
    createShopItem(item, index, isPackItem) {
        const itemElement = document.createElement('div');
        
        // Ajouter la classe de rareté
        const rarityClass = item.rarity ? `rarity-${item.rarity}` : '';
        itemElement.className = `shop-item ${rarityClass}`;
        
        const price = item.price || getRecruitCost(item.rarity);
        const canAfford = gameState.gold >= price;
        
        if (!canAfford) {
            itemElement.style.opacity = '0.5';
        }

        if (item.type === 'unit') {
            itemElement.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
                <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">${item.type}</div>
                <div style="font-size: 0.8rem; margin-bottom: 10px;">${item.damage} dmg ×${item.multiplier}</div>
                <div style="font-size: 0.8rem; color: #666; font-style: italic; margin-bottom: 10px;">${item.description}</div>
                <div style="margin-bottom: 10px; font-weight: 600; color: ${getRarityColor(item.rarity)}; font-size: 0.8rem;">
                    ${getRarityIcon(item.rarity)} ${item.rarity.toUpperCase()}
                </div>
                <div class="item-price">${price}💰</div>
            `;
        } else {
            itemElement.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
                <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                <div style="font-size: 0.8rem; color: #666; font-style: italic; margin-bottom: 10px;">${item.description}</div>
                <div style="margin-bottom: 10px; font-weight: 600; color: ${getRarityColor(item.rarity)}; font-size: 0.8rem;">
                    ${getRarityIcon(item.rarity)} ${item.rarity.toUpperCase()}
                </div>
                <div class="item-price">${price}💰</div>
            `;
        }

        if (canAfford) {
            itemElement.addEventListener('click', () => {
                this.purchaseItem(item, index, isPackItem);
            });
        }

        return itemElement;
    }

    // Acheter un item
    purchaseItem(item, index, isPackItem) {
        const price = item.price || getRecruitCost(item.rarity);
        
        if (gameState.spendGold(price)) {
            if (item.type === 'unit') {
                // Ajouter l'unité aux troupes disponibles avec un ID unique
                const unitWithId = {
                    ...item,
                    id: `${item.name}_purchased_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                };
                gameState.addTroop(unitWithId);
                gameState.gameStats.unitsPurchased++;
                gameState.showNotification(`${item.name} acheté !`, 'success');
            } else {
                // Appliquer le bonus à toutes les unités sélectionnées
                this.applyBonus(item);
                gameState.gameStats.bonusesPurchased++;
                gameState.showNotification(`Bonus ${item.name} appliqué !`, 'success');
            }

            // Retirer l'item du magasin
            if (isPackItem) {
                this.currentPack.splice(index, 1);
            } else {
                this.currentItems.splice(index, 1);
            }

            // Mettre à jour l'affichage
            this.displayShop();
        } else {
            gameState.showNotification('Or insuffisant !', 'error');
        }
    }

    // Appliquer un bonus aux unités
    applyBonus(bonus) {
        gameState.selectedTroops.forEach(troop => {
            if (bonus.effect.target === 'all' || bonus.effect.target === troop.type) {
                if (bonus.effect.damage) {
                    troop.damage += bonus.effect.damage;
                }
                if (bonus.effect.multiplier) {
                    troop.multiplier += bonus.effect.multiplier;
                }
            }
        });

        // Mettre à jour l'affichage des troupes
        gameState.updateTroopsUI();
        gameState.updateSynergies();
    }

    // Obtenir un bonus temporaire pour une unité
    getTemporaryBonus(unit, bonuses) {
        let enhancedUnit = { ...unit };
        
        bonuses.forEach(bonus => {
            if (bonus.effect.target === 'all' || bonus.effect.target === unit.type) {
                if (bonus.effect.damage) {
                    enhancedUnit.damage += bonus.effect.damage;
                }
                if (bonus.effect.multiplier) {
                    enhancedUnit.multiplier += bonus.effect.multiplier;
                }
            }
        });
        
        return enhancedUnit;
    }
}

// Instance globale du système de magasin
const shopSystem = new ShopSystem();

// Fonction pour initialiser le magasin (appelée depuis game.js)
function initShop() {
    shopSystem.generateShop();
    shopSystem.displayShop();
}

// Fonction pour obtenir des bonus temporaires pour le combat
function getCombatBonuses() {
    // Retourner les bonus actifs sur les unités sélectionnées
    // Cette fonction sera utilisée dans le système de combat
    return [];
} 