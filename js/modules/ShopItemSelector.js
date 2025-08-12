// Service de sélection d'items pour le magasin GuildMaster
// Ce service gère la sélection et la pondération des items selon la rareté et le type

import { RARITY_CHANCES, RARITY_LEVELS } from './constants/game/RarityUtils.js';

export class ShopItemSelector {
    constructor() {
        // Configuration
        this.maxShopItems = 5;
        this.typeWeights = {
            'unit': 1.0,
            'bonus': 1.0,
            'consumable': 4.0 // Quadrupler le poids des consommables
        };
    }

    /**
     * Sélectionner et mélanger les items avec équilibre entre types
     * @param {Array} allItems - Tous les items disponibles
     * @returns {Array} - Liste des items sélectionnés pour le magasin
     */
    selectAndShuffleItems(allItems) {
        // Séparer les items par type
        const unitItems = allItems.filter(item => item.type === 'unit');
        const bonusItems = allItems.filter(item => item.type === 'bonus');
        const consumableItems = allItems.filter(item => item.type === 'consumable');
        
        const selectedItems = [];
        
        // Créer un pool d'items disponibles avec pondération par type
        const availableItems = [];
        
        // Ajouter tous les items avec leur poids
        unitItems.forEach(item => availableItems.push({ item, weight: this.typeWeights.unit }));
        bonusItems.forEach(item => availableItems.push({ item, weight: this.typeWeights.bonus }));
        consumableItems.forEach(item => availableItems.push({ item, weight: this.typeWeights.consumable }));
        
        // Sélectionner 5 items avec pondération par type
        for (let i = 0; i < this.maxShopItems; i++) {
            if (availableItems.length === 0) break;
            
            // Calculer le poids total
            const totalWeight = availableItems.reduce((sum, { weight }) => sum + weight, 0);
            
            // Sélectionner un item selon le poids
            let random = Math.random() * totalWeight;
            let selectedIndex = 0;
            
            for (let j = 0; j < availableItems.length; j++) {
                random -= availableItems[j].weight;
                if (random <= 0) {
                    selectedIndex = j;
                    break;
                }
            }
            
            // Ajouter l'item sélectionné
            const selected = availableItems[selectedIndex].item;
            selectedItems.push(selected);
            
            // LOG DEBUG : afficher le type et la rareté de l'item sélectionné
            console.log(`[SHOP] Slot ${i+1} : type=${selected.type}, rareté=${selected.rarity}, nom=${selected.name||selected.bonusId||selected.consumableType}`);
            
            // Retirer l'item sélectionné et ajuster les poids
            availableItems.splice(selectedIndex, 1);
            
            // Réduire les poids pour éviter de sur-représenter un type
            const selectedType = selectedItems[selectedItems.length - 1].type;
            availableItems.forEach(({ item }) => {
                if (item.type === selectedType) {
                    item.weight = Math.max(1, item.weight * 0.7); // Réduire le poids de 30%
                }
            });
        }
        
        // Compléter jusqu'à 5 items si nécessaire
        this.fillRemainingSlots(selectedItems, allItems);
        
        // S'assurer qu'on a exactement 5 items
        return selectedItems.slice(0, this.maxShopItems);
    }

    /**
     * Compléter les slots restants avec des items d'autres catégories
     * @param {Array} selectedItems - Les items déjà sélectionnés
     * @param {Array} allItems - Tous les items disponibles
     */
    fillRemainingSlots(selectedItems, allItems) {
        const remaining = this.maxShopItems - selectedItems.length;
        if (remaining <= 0) return;
        
        // Créer un pool d'items disponibles non encore sélectionnés
        const availableItems = allItems.filter(item => 
            !selectedItems.some(selected => 
                selected.type === item.type && 
                (selected.name === item.name || 
                 selected.bonusId === item.bonusId || 
                 selected.consumableType === item.consumableType)
            )
        );
        
        const additionalItems = this.selectItemsByRarity(availableItems, remaining);
        selectedItems.push(...additionalItems);
    }

    /**
     * Sélectionner les items avec pondération par rareté
     * @param {Array} items - Les items à analyser
     * @param {number} count - Le nombre d'items à sélectionner
     * @returns {Array} - Liste des items sélectionnés
     */
    selectItemsByRarity(items, count) {
        // Utiliser les pourcentages de chance par rareté depuis les constantes
        const rarityChances = RARITY_CHANCES;

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
            
            // LOG DEBUG : afficher la rareté tirée
            console.log(`[SHOP] Slot ${i+1} : random=${random.toFixed(4)} => rareté tirée = ${selectedRarity}`);

            // Sélectionner un item de cette rareté
            if (itemsByRarity[selectedRarity] && itemsByRarity[selectedRarity].length > 0) {
                const randomIndex = Math.floor(Math.random() * itemsByRarity[selectedRarity].length);
                const selectedItem = itemsByRarity[selectedRarity][randomIndex];
                selectedItems.push(selectedItem);
            } else {
                // Si pas d'item de cette rareté, prendre un item commun
                if (itemsByRarity[RARITY_LEVELS.COMMON] && itemsByRarity[RARITY_LEVELS.COMMON].length > 0) {
                    const randomIndex = Math.floor(Math.random() * itemsByRarity[RARITY_LEVELS.COMMON].length);
                    const selectedItem = itemsByRarity[RARITY_LEVELS.COMMON][randomIndex];
                    selectedItems.push(selectedItem);
                } else {
                    // Fallback : prendre le premier item disponible
                    for (const rarity in itemsByRarity) {
                        if (itemsByRarity[rarity] && itemsByRarity[rarity].length > 0) {
                            const selectedItem = itemsByRarity[rarity][0];
                            selectedItems.push(selectedItem);
                            break;
                        }
                    }
                }
            }
        }

        return selectedItems;
    }

    /**
     * Générer des items de magasin avec sélection par rareté
     * @param {Array} allItems - Tous les items disponibles
     * @returns {Array} - Liste des items sélectionnés pour le magasin
     */
    generateShopItemsByRarity(allItems) {
        // Grouper tous les items par rareté
        const itemsByRarity = {};
        allItems.forEach(item => {
            const rarity = item.rarity || 'common';
            if (!itemsByRarity[rarity]) itemsByRarity[rarity] = [];
            itemsByRarity[rarity].push(item);
        });
        
        // Générer 5 slots indépendants
        const shopItems = [];
        for (let i = 0; i < this.maxShopItems; i++) {
            // Tirer la rareté selon RARITY_CHANCES
            const random = Math.random();
            let selectedRarity = 'common';
            let cumulativeChance = 0;
            
            for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
                cumulativeChance += chance;
                if (random <= cumulativeChance) {
                    selectedRarity = rarity;
                    break;
                }
            }
            
            // Prendre un item au hasard de cette rareté
            const pool = itemsByRarity[selectedRarity] || itemsByRarity['common'];
            if (pool && pool.length > 0) {
                const idx = Math.floor(Math.random() * pool.length);
                const item = pool[idx];
                shopItems.push(item);
                
                // LOG DEBUG
                console.log(`[SHOP] Slot ${i+1} : rareté=${selectedRarity}, nom=${item.name||item.bonusId||item.consumableType}`);
            } else {
                // Fallback : prendre n'importe quel item
                const all = Object.values(itemsByRarity).flat();
                if (all.length > 0) {
                    const idx = Math.floor(Math.random() * all.length);
                    shopItems.push(all[idx]);
                }
            }
        }
        
        return shopItems;
    }

    /**
     * Équilibrer la distribution des types d'items
     * @param {Array} items - Les items à équilibrer
     * @returns {Array} - Liste des items équilibrés
     */
    balanceItemTypes(items) {
        const typeCounts = {
            'unit': 0,
            'bonus': 0,
            'consumable': 0
        };
        
        // Compter les types actuels
        items.forEach(item => {
            if (typeCounts[item.type] !== undefined) {
                typeCounts[item.type]++;
            }
        });
        
        // Ajuster si nécessaire (garantir au moins 1 de chaque type si possible)
        const balancedItems = [...items];
        
        // Si pas d'unités, essayer d'en ajouter
        if (typeCounts.unit === 0 && balancedItems.length < this.maxShopItems) {
            const unitItems = items.filter(item => item.type === 'unit');
            if (unitItems.length > 0) {
                balancedItems.push(unitItems[0]);
            }
        }
        
        // Si pas de bonus, essayer d'en ajouter
        if (typeCounts.bonus === 0 && balancedItems.length < this.maxShopItems) {
            const bonusItems = items.filter(item => item.type === 'bonus');
            if (bonusItems.length > 0) {
                balancedItems.push(bonusItems[0]);
            }
        }
        
        // Si pas de consommables, essayer d'en ajouter
        if (typeCounts.consumable === 0 && balancedItems.length < this.maxShopItems) {
            const consumableItems = items.filter(item => item.type === 'consumable');
            if (consumableItems.length > 0) {
                balancedItems.push(consumableItems[0]);
            }
        }
        
        return balancedItems.slice(0, this.maxShopItems);
    }
}

// Instance singleton pour utilisation globale
export const shopItemSelector = new ShopItemSelector();
