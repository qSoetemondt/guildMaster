// Service de pricing centralisé pour GuildMaster
// Ce service gère tous les calculs de prix des items du magasin

import { RARITY_BASE_PRICES, RARITY_LEVELS } from './constants/game/RarityUtils.js';
import { calculateBonusPrice } from './constants/shop/BonusConstants.js';

export class PricingService {
    constructor() {
        // Configuration des prix
        this.unitPriceMultiplier = 1.75; // Prix augmentés de 75% pour équilibrer l'économie
        this.consumableBasePrice = 15; // Prix de base des consommables
    }

    /**
     * Calculer le prix d'une unité
     * @param {Object} unit - L'unité à évaluer
     * @returns {number} - Le prix calculé
     */
    calculateUnitPrice(unit) {
        // Prix de base selon la rareté
        let basePrice = RARITY_BASE_PRICES[unit.rarity] || RARITY_BASE_PRICES[RARITY_LEVELS.COMMON];
        
        // Ajuster selon les stats (dégâts + multiplicateur)
        const statBonus = Math.floor((unit.damage + unit.multiplier) / 2);
        basePrice += statBonus;
        
        // Appliquer le multiplicateur d'équilibrage
        return Math.ceil(basePrice * this.unitPriceMultiplier);
    }

    /**
     * Calculer le prix d'un bonus
     * @param {string} bonusId - L'ID du bonus
     * @returns {number} - Le prix calculé
     */
    calculateBonusPrice(bonusId) {
        return calculateBonusPrice(bonusId);
    }

    /**
     * Calculer le prix d'un consommable
     * @param {string} consumableType - Le type de consommable
     * @param {Object} consumable - L'objet consommable (optionnel)
     * @returns {number} - Le prix calculé
     */
    calculateConsumablePrice(consumableType, consumable = null) {
        // Prix de base
        let price = this.consumableBasePrice;
        
        // Ajuster selon le type de consommable si spécifié
        if (consumable && consumable.rarity) {
            const rarityMultiplier = this.getRarityMultiplier(consumable.rarity);
            price = Math.ceil(price * rarityMultiplier);
        }
        
        return price;
    }

    /**
     * Obtenir le multiplicateur de prix selon la rareté
     * @param {string} rarity - La rareté
     * @returns {number} - Le multiplicateur
     */
    getRarityMultiplier(rarity) {
        const multipliers = {
            'common': 1.0,
            'uncommon': 1.5,
            'rare': 2.0,
            'epic': 3.0,
            'legendary': 5.0
        };
        return multipliers[rarity] || 1.0;
    }

    /**
     * Calculer le prix de vente d'un item (généralement 50% du prix d'achat)
     * @param {Object} item - L'item à vendre
     * @returns {number} - Le prix de vente
     */
    calculateSellPrice(item) {
        let buyPrice = 0;
        
        switch (item.type) {
            case 'unit':
                buyPrice = this.calculateUnitPrice(item);
                break;
            case 'bonus':
                buyPrice = this.calculateBonusPrice(item.bonusId);
                break;
            case 'consumable':
                buyPrice = this.calculateConsumablePrice(item.consumableType, item);
                break;
            default:
                buyPrice = item.price || 0;
        }
        
        // Prix de vente = 50% du prix d'achat
        return Math.floor(buyPrice * 0.5);
    }

    /**
     * Vérifier si un joueur peut se permettre un item
     * @param {number} playerGold - L'or du joueur
     * @param {Object} item - L'item à vérifier
     * @returns {boolean} - True si le joueur peut se l'offrir
     */
    canAfford(playerGold, item) {
        let itemPrice = 0;
        
        switch (item.type) {
            case 'unit':
                itemPrice = this.calculateUnitPrice(item);
                break;
            case 'bonus':
                itemPrice = this.calculateBonusPrice(item.bonusId);
                break;
            case 'consumable':
                itemPrice = this.calculateConsumablePrice(item.consumableType, item);
                break;
            default:
                itemPrice = item.price || 0;
        }
        
        return playerGold >= itemPrice;
    }

    /**
     * Obtenir le prix d'affichage d'un item
     * @param {Object} item - L'item
     * @returns {number} - Le prix à afficher
     */
    getDisplayPrice(item) {
        switch (item.type) {
            case 'unit':
                return this.calculateUnitPrice(item);
            case 'bonus':
                return this.calculateBonusPrice(item.bonusId);
            case 'consumable':
                return this.calculateConsumablePrice(item.consumableType, item);
            default:
                return item.price || 0;
        }
    }
}

// Instance singleton pour utilisation globale
export const pricingService = new PricingService();
