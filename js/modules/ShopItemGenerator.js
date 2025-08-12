// Service de génération d'items pour le magasin GuildMaster
// Ce service crée les différents types d'items (unités, bonus, consommables)

import { BASE_UNITS } from './constants/units/UnitConstants.js';
import { BONUS_DESCRIPTIONS, getBonusRarity } from './constants/shop/BonusConstants.js';
import { getRandomElement } from './constants/units/UnitConstants.js';
import { pricingService } from './PricingService.js';

export class ShopItemGenerator {
    constructor() {
        // Configuration
        this.maxConsumablesPerShop = 3;
        this.minConsumablesPerShop = 2;
    }

    /**
     * Créer les items d'unités pour le magasin
     * @param {Object} gameState - L'état du jeu
     * @returns {Array} - Liste des items d'unités
     */
    createUnitItems(gameState) {
        return gameState.getShopUnits().map(unit => ({
            type: 'unit',
            icon: unit.icon,
            unitType: unit.type,
            damage: unit.damage,
            multiplier: unit.multiplier,
            price: pricingService.calculateUnitPrice(unit),
            rarity: unit.rarity,
            name: unit.name,
            element: getRandomElement()
        }));
    }

    /**
     * Créer les items de bonus pour le magasin
     * @param {Object} bonusDescriptions - Les descriptions des bonus
     * @returns {Array} - Liste des items de bonus
     */
    createBonusItems(bonusDescriptions) {
        console.log('[DEBUG] Création des items de bonus, bonusDescriptions:', Object.keys(bonusDescriptions));
        
        const bonusItems = Object.keys(bonusDescriptions).map(bonusId => {
            const bonus = bonusDescriptions[bonusId];
            const price = pricingService.calculateBonusPrice(bonusId);
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
        
        console.log('[DEBUG] Items de bonus créés:', bonusItems.length, 'items');
        return bonusItems;
    }

    /**
     * Créer les items de consommables pour le magasin
     * @param {Object} gameState - L'état du jeu
     * @returns {Array} - Liste des items de consommables
     */
    createConsumableItems(gameState) {
        const consumableItems = [];
        
        // Garantir qu'il y ait toujours au moins 2-3 consommables disponibles
        const consumableCount = Math.floor(Math.random() * (this.maxConsumablesPerShop - this.minConsumablesPerShop + 1)) + this.minConsumablesPerShop;
        
        for (let i = 0; i < consumableCount; i++) {
            const consumableItem = gameState.addConsumableToShop();
            if (consumableItem) {
                // Ajouter le prix calculé par le service de pricing
                consumableItem.price = pricingService.calculateConsumablePrice(consumableItem.consumableType, consumableItem);
                consumableItems.push(consumableItem);
            }
        }
        
        return consumableItems;
    }

    /**
     * Générer tous les items disponibles pour le magasin
     * @param {Object} gameState - L'état du jeu
     * @returns {Array} - Liste de tous les items disponibles
     */
    generateAllAvailableItems(gameState) {
        const bonusDescriptions = gameState.getBonusDescriptions();
        const unitItems = this.createUnitItems(gameState);
        const bonusItems = this.createBonusItems(bonusDescriptions);
        const consumableItems = this.createConsumableItems(gameState);
        
        return [
            ...unitItems,
            ...bonusItems,
            ...consumableItems
        ];
    }

    /**
     * Créer un item d'unité avec des propriétés spécifiques
     * @param {Object} unit - L'unité de base
     * @param {string} element - L'élément à assigner
     * @returns {Object} - L'item d'unité créé
     */
    createUnitItemWithElement(unit, element = null) {
        return {
            type: 'unit',
            icon: unit.icon,
            unitType: unit.type,
            damage: unit.damage,
            multiplier: unit.multiplier,
            price: pricingService.calculateUnitPrice(unit),
            rarity: unit.rarity,
            name: unit.name,
            element: element || getRandomElement()
        };
    }

    /**
     * Créer un item de bonus avec des propriétés spécifiques
     * @param {string} bonusId - L'ID du bonus
     * @param {Object} bonus - Les données du bonus
     * @returns {Object} - L'item de bonus créé
     */
    createBonusItemWithId(bonusId, bonus) {
        return {
            type: 'bonus',
            name: bonus.name,
            icon: bonus.icon,
            description: bonus.description,
            bonusId: bonusId,
            price: pricingService.calculateBonusPrice(bonusId),
            rarity: getBonusRarity(bonusId)
        };
    }

    /**
     * Créer un item de consommable avec des propriétés spécifiques
     * @param {Object} consumable - Les données du consommable
     * @returns {Object} - L'item de consommable créé
     */
    createConsumableItem(consumable) {
        return {
            type: 'consumable',
            name: consumable.name,
            icon: consumable.icon,
            description: consumable.description,
            consumableType: consumable.consumableType,
            price: pricingService.calculateConsumablePrice(consumable.consumableType, consumable),
            rarity: consumable.rarity || 'common'
        };
    }

    /**
     * Valider qu'un item est correctement formé
     * @param {Object} item - L'item à valider
     * @returns {boolean} - True si l'item est valide
     */
    validateItem(item) {
        if (!item || !item.type) return false;
        
        switch (item.type) {
            case 'unit':
                return item.name && item.damage !== undefined && item.multiplier !== undefined && item.price;
            case 'bonus':
                return item.name && item.bonusId && item.price;
            case 'consumable':
                return item.name && item.consumableType && item.price;
            default:
                return false;
        }
    }

    /**
     * Filtrer les items par type
     * @param {Array} items - La liste d'items
     * @param {string} type - Le type à filtrer
     * @returns {Array} - Liste des items du type spécifié
     */
    filterItemsByType(items, type) {
        return items.filter(item => item.type === type);
    }

    /**
     * Filtrer les items par rareté
     * @param {Array} items - La liste d'items
     * @param {string} rarity - La rareté à filtrer
     * @returns {Array} - Liste des items de la rareté spécifiée
     */
    filterItemsByRarity(items, rarity) {
        return items.filter(item => item.rarity === rarity);
    }
}

// Instance singleton pour utilisation globale
export const shopItemGenerator = new ShopItemGenerator();
