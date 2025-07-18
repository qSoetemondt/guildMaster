// Gestionnaire de consommables pour GuildMaster
import { ModalManager } from './ModalManager.js';
import { RARITY_LEVELS } from './constants/game/RarityUtils.js';
import { createGlobalUnitPool, clearUnitCache } from './UnitManager.js';


// Fonction pour obtenir le nom traduit d'un consommable
export function getConsumableDisplayName(consumableType) {
    const consumableNames = {
        'refreshShop': 'consumable.refreshShop',
        'transformSword': 'consumable.sword',
        'transformArcher': 'consumable.bow',
        'transformLancier': 'consumable.spear',
        'transformPaysan': 'consumable.pitchfork',
        'transformMagicienBleu': 'consumable.blueBook',
        'transformMagicienRouge': 'consumable.redBook',
        'transformBarbare': 'consumable.axe',
        'transformSorcier': 'consumable.orb',
        'transformFronde': 'consumable.sling',
        'upgradeSynergy': 'consumable.synergyCrystal'
    };
    
    const translationKey = consumableNames[consumableType];
    return consumableType;
}

// Fonction pour obtenir la description traduite d'un consommable
export function getConsumableDescription(consumableType) {
    const consumableDescriptions = {
        'refreshShop': 'consumable.refreshShopDesc',
        'transformSword': 'consumable.swordDesc',
        'transformArcher': 'consumable.bowDesc',
        'transformLancier': 'consumable.spearDesc',
        'transformPaysan': 'consumable.pitchforkDesc',
        'transformMagicienBleu': 'consumable.blueBookDesc',
        'transformMagicienRouge': 'consumable.redBookDesc',
        'transformBarbare': 'consumable.axeDesc',
        'transformSorcier': 'consumable.orbDesc',
        'transformFronde': 'consumable.slingDesc',
        'upgradeSynergy': 'consumable.synergyCrystalDesc'
    };
    
    const translationKey = consumableDescriptions[consumableType];
    return consumableDescriptions[consumableType] || '';
}

export class ConsumableManager {
    constructor() {
        this.consumables = []; // Inventaire des consommables
        this.currentSynergyCrystal = null; // Référence au cristal de synergie actuellement utilisé
        this.activeTransformConsumable = null; // Référence au consommable de transformation actuellement utilisé
        this.CONSUMABLES_TYPES = {
            refreshShop: {
                name: 'Relance Boutique',
                description: 'Relance le magasin gratuitement',
                icon: '🔄',
                price: Math.ceil(10 * 1.75), // 18
                effect: 'refreshShop',
                rarity: RARITY_LEVELS.COMMON
            },
            transformSword: {
                name: 'Épée',
                description: 'Transforme une unité en Épéiste',
                icon: '⚔️',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Épéiste',
                rarity: RARITY_LEVELS.COMMON
            },
            transformArcher: {
                name: 'Arc',
                description: 'Transforme une unité en Archer',
                icon: '🏹',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Archer',
                rarity: RARITY_LEVELS.COMMON
            },
            transformLancier: {
                name: 'Lance',
                description: 'Transforme une unité en Lancier',
                icon: '🔱',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Lancier',
                rarity: RARITY_LEVELS.COMMON
            },
            transformPaysan: {
                name: 'Fourche',
                description: 'Transforme une unité en Paysan',
                icon: '👨‍🌾',
                price: Math.ceil(5 * 1.75), // 9
                effect: 'transformUnit',
                targetUnit: 'Paysan',
                rarity: RARITY_LEVELS.COMMON
            },
            transformMagicienBleu: {
                name: 'Livre bleu',
                description: 'Transforme une unité en Magicien Bleu',
                icon: '📘',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Magicien Bleu',
                rarity: RARITY_LEVELS.UNCOMMON
            },
            transformMagicienRouge: {
                name: 'Livre rouge',
                description: 'Transforme une unité en Magicien Rouge',
                icon: '🔴',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Magicien Rouge',
                rarity: RARITY_LEVELS.UNCOMMON
            },
            transformBarbare: {
                name: 'Hache',
                description: 'Transforme une unité en Barbare',
                icon: '👨‍🚒',
                price: Math.ceil(25 * 1.75), // 44
                effect: 'transformUnit',
                targetUnit: 'Barbare',
                rarity: RARITY_LEVELS.RARE
            },
            transformSorcier: {
                name: 'Orbe',
                description: 'Transforme une unité en Sorcier',
                icon: '🔮',
                price: Math.ceil(50 * 1.75), // 88
                effect: 'transformUnit',
                targetUnit: 'Sorcier',
                rarity: RARITY_LEVELS.EPIC
            },
            transformFronde: {
                name: 'Fronde',
                description: 'Transforme une unité en Fronde',
                icon: '🪨',
                price: Math.ceil(50 * 1.75), // 88
                effect: 'transformUnit',
                targetUnit: 'Frondeur',
                rarity: RARITY_LEVELS.EPIC
            },
            upgradeSynergy: {
                name: 'Cristal de Synergie',
                description: 'Améliore le niveau d\'une synergie d\'équipe de +1',
                icon: '💎',
                price: Math.ceil(30 * 1.75), // 53
                effect: 'upgradeSynergy',
                rarity: RARITY_LEVELS.RARE
            },
            duplicateUnit: {
                name: 'Miroir de Duplication',
                description: 'Duplique une unité de votre choix',
                icon: '🪞',
                price: Math.ceil(80 * 1.27), // 102
                effect: 'duplicateUnit',
                rarity: RARITY_LEVELS.LEGENDARY
            }
        };
    }

    // Ajouter un consommable à l'inventaire
    addConsumable(consumableType, gameState) {
        // Limite de 3 consommables
        if (this.consumables.length >= 3) {
            gameState.notificationManager.showConsumableError('Inventaire de consommables plein (3 max) !');
            return;
        }
        const consumableTemplate = this.CONSUMABLES_TYPES[consumableType];
        if (!consumableTemplate) {
            console.error(`Type de consommable inconnu: ${consumableType}`);
            return;
        }

        const consumable = {
            id: `${consumableType}_${Date.now()}_${Math.random()}`,
            type: consumableType,
            name: consumableTemplate.name,
            description: consumableTemplate.description,
            icon: consumableTemplate.icon,
            effect: consumableTemplate.effect,
            targetUnit: consumableTemplate.targetUnit,
            rarity: consumableTemplate.rarity || RARITY_LEVELS.COMMON
        };

        this.consumables.push(consumable);
        //gameState.showNotification(`${consumable.name} ajouté à l'inventaire !`, 'success');
        this.updateConsumablesDisplay(gameState);
    }

    // Utiliser un consommable
    useConsumable(consumableId, gameState) {
        const consumableIndex = this.consumables.findIndex(c => c.id === consumableId);
        if (consumableIndex === -1) {
            console.error(`Consommable non trouvé: ${consumableId}`);
            return false;
        }

        const consumable = this.consumables[consumableIndex];
        
        // Exécuter l'effet du consommable
        const success = this.executeConsumableEffect(consumable, gameState);
        
        if (success) {
            // Pour les consommables qui ne nécessitent pas d'action supplémentaire, les supprimer immédiatement
            if (consumable.effect !== 'transformUnit' && consumable.effect !== 'upgradeSynergy' && consumable.effect !== 'duplicateUnit') {
                this.consumables.splice(consumableIndex, 1);
                this.updateConsumablesDisplay(gameState);
            }
            // Pour l'épée de transformation, le consommable sera supprimé après la transformation effective
            // Pour le cristal de synergie, le consommable sera supprimé après la sélection de la synergie
            // Pour la duplication, le consommable sera supprimé après la duplication effective
           // gameState.showNotification(`${consumable.name} utilisé !`, 'success');
            return true;
        } else {
            gameState.notificationManager.showConsumableError('Impossible d\'utiliser ce consommable !');
            return false;
        }
    }

    // Exécuter l'effet d'un consommable
    executeConsumableEffect(consumable, gameState) {
        switch (consumable.effect) {
            case 'refreshShop':
                // Relancer le magasin gratuitement
                gameState.shopManager.shopRefreshCount = 0; // Réinitialiser le compteur
                gameState.shopManager.shopRefreshCost = 10; // Réinitialiser le coût
                gameState.shopManager.resetShop();
                gameState.shopManager.generateShopItems(gameState);
                gameState.shopManager.updatePreCombatShop(gameState);
                return true;
            
            case 'transformUnit':
                // Activer le mode transformation avec curseur personnalisé
                this.activateTransformMode(consumable, gameState);
                return true;
            
            case 'upgradeSynergy':
                // Garder une trace du cristal utilisé pour l'amélioration de synergie
                this.currentSynergyCrystal = consumable;
                // Ouvrir une modal pour sélectionner quelle synergie améliorer
                this.showSynergyUpgradeModal(gameState);
                return true;
            
            case 'duplicateUnit':
                // Activer le mode duplication avec curseur personnalisé
                this.activateDuplicateMode(consumable, gameState);
                return true;
            
            default:
                console.error(`Effet de consommable inconnu: ${consumable.effect}`);
                return false;
        }
    }

    // Afficher les consommables dans l'interface
    updateConsumablesDisplay(gameState) {
        gameState.uiManager.updateConsumablesDisplay();
    }

    // Ajouter un consommable au magasin
    addConsumableToShop() {
        const consumableTypes = Object.keys(this.CONSUMABLES_TYPES);
        
        // 25% de chance d'avoir spécifiquement le consommable d'amélioration de synergie
        if (Math.random() < 0.25) {
            const consumableTemplate = this.CONSUMABLES_TYPES['upgradeSynergy'];
            return {
                type: 'consumable',
                id: `consumable_upgradeSynergy`,
                name: consumableTemplate.name,
                description: consumableTemplate.description,
                icon: consumableTemplate.icon,
                price: consumableTemplate.price,
                consumableType: 'upgradeSynergy',
                rarity: consumableTemplate.rarity
            };
        } else {
            // Sinon, sélectionner aléatoirement parmi tous les autres consommables
            const otherTypes = consumableTypes.filter(type => type !== 'upgradeSynergy');
            const randomType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
            const consumableTemplate = this.CONSUMABLES_TYPES[randomType];
            
            return {
                type: 'consumable',
                id: `consumable_${randomType}`,
                name: consumableTemplate.name,
                description: consumableTemplate.description,
                icon: consumableTemplate.icon,
                price: consumableTemplate.price,
                consumableType: randomType,
                rarity: consumableTemplate.rarity
            };
        }
    }

    // Vérifier si le joueur a un consommable d'un type spécifique
    hasConsumableType(consumableType) {
        return this.consumables.some(c => c.type === consumableType);
    }

    // Supprimer un consommable par type
    removeConsumableByType(consumableType, gameState) {
        const index = this.consumables.findIndex(c => c.type === consumableType);
        if (index !== -1) {
            this.consumables.splice(index, 1);
            this.updateConsumablesDisplay(gameState);
            return true;
        }
        return false;
    }

    // Obtenir le nombre de consommables
    getConsumableCount() {
        return this.consumables.length;
    }

    // Vérifier si l'inventaire est plein
    isInventoryFull() {
        return this.consumables.length >= 3;
    }

    // Réinitialiser l'inventaire
    resetInventory() {
        this.consumables = [];
    }

    // ===== GESTION DES SYNERGIES =====

    // Afficher la modal d'amélioration de synergie
    showSynergyUpgradeModal(gameState) {
        gameState.uiManager.showSynergyUpgradeModal();
    }
    
    // Mettre à jour la liste des synergies pour l'amélioration
    updateSynergyUpgradeList(gameState) {
        gameState.uiManager.updateSynergyUpgradeList();
    }
    
    // Améliorer une synergie
    upgradeSynergy(synergyName, gameState) {
        if (!gameState.synergyLevels[synergyName]) {
            gameState.synergyLevels[synergyName] = 1;
        }
        
        gameState.synergyLevels[synergyName]++;
        
        // Consommer le cristal spécifique qui a été utilisé
        if (this.currentSynergyCrystal) {
            const consumableIndex = this.consumables.findIndex(c => c.id === this.currentSynergyCrystal.id);
            if (consumableIndex !== -1) {
                this.consumables.splice(consumableIndex, 1);
            }
            // Réinitialiser la référence
            this.currentSynergyCrystal = null;
        } else {
            // Fallback : supprimer le premier cristal trouvé (ancien comportement)
            const consumableIndex = this.consumables.findIndex(c => c.type === 'upgradeSynergy');
            if (consumableIndex !== -1) {
                this.consumables.splice(consumableIndex, 1);
            }
        }
        
        // Fermer la modal
        ModalManager.hideModal('synergy-upgrade-modal');
        
        // Mettre à jour l'affichage
        gameState.updateUI();
        this.updateConsumablesDisplay(gameState);
        
        // Notification de succès
        gameState.notificationManager.showSynergyUpgraded(synergyName, gameState.synergyLevels[synergyName]);
    }

    // ===== GESTION DES TRANSFORMATIONS D'UNITÉS =====

    // Transformer une unité depuis la modal des troupes
    transformUnitFromModal(fromUnitName, toUnitName, gameState) {
        // Vérifier si l'utilisateur a un consommable de transformation approprié
        const transformConsumables = this.consumables.filter(c => 
            c.type === 'transformSword' || 
            c.type === 'transformArcher' || 
            c.type === 'transformLancier' ||
            c.type === 'transformPaysan' ||
            c.type === 'transformMagicienBleu' ||
            c.type === 'transformMagicienRouge' ||
            c.type === 'transformBarbare' ||
            c.type === 'transformSorcier' ||
            c.type === 'transformFronde'
        );
        
        if (transformConsumables.length === 0) {
            gameState.notificationManager.showConsumableError('Vous devez posséder un consommable de transformation pour transformer des unités !');
            return;
        }

        // Vérifier si l'unité source existe dans le pool global
        const globalPool = createGlobalUnitPool(gameState);
        const sourceUnits = globalPool.filter(unit => unit.name === fromUnitName);
        
        if (sourceUnits.length === 0) {
            gameState.notificationManager.showConsumableError(`Aucune unité "${fromUnitName}" trouvée !`);
            return;
        }

        // Trouver l'unité cible dans toutes les unités disponibles
        const targetUnit = gameState.getAllAvailableTroops().find(unit => unit.name === toUnitName);
        if (!targetUnit) {
            gameState.notificationManager.showConsumableError(`Unité cible "${toUnitName}" non trouvée !`);
            return;
        }

        // Retirer une unité source du pool global
        gameState.ownedUnits[fromUnitName] = Math.max(0, (gameState.ownedUnits[fromUnitName] || 0) - 1);

        // Ajouter l'unité cible au pool global
        gameState.ownedUnits[toUnitName] = (gameState.ownedUnits[toUnitName] || 0) + 1;
        
        // Nettoyer le cache des unités car les quantités ont changé
        clearUnitCache();

        // Consommer le consommable de transformation spécifique qui a été utilisé
        if (this.activeTransformConsumable) {
            const consumableIndex = this.consumables.findIndex(c => c.id === this.activeTransformConsumable.id);
            if (consumableIndex !== -1) {
                this.consumables.splice(consumableIndex, 1);
            }
            // Réinitialiser la référence
            this.activeTransformConsumable = null;
        } else {
            // Fallback : supprimer le premier consommable de transformation trouvé (ancien comportement)
            const consumableIndex = this.consumables.findIndex(c => 
                c.type === 'transformSword' || 
                c.type === 'transformArcher' || 
                c.type === 'transformLancier' ||
                c.type === 'transformPaysan' ||
                c.type === 'transformMagicienBleu' ||
                c.type === 'transformMagicienRouge' ||
                c.type === 'transformBarbare' ||
                c.type === 'transformSorcier' ||
                c.type === 'transformFronde'
            );
            if (consumableIndex !== -1) {
                this.consumables.splice(consumableIndex, 1);
            }
        }

        // Jouer l'animation de transformation
        gameState.animationManager.playTransformAnimation(fromUnitName, toUnitName, gameState);

        // Mettre à jour l'affichage
        gameState.updateUI();
        this.updateConsumablesDisplay(gameState);

        // Fermer la modal des troupes
        ModalManager.hideModal('troops-modal');
    }

    // ===== GESTION DU MODE TRANSFORMATION =====
    
    // Activer le mode transformation avec curseur personnalisé
    activateTransformMode(consumable, gameState) {
        // Stocker le consommable de transformation actif
        this.activeTransformConsumable = consumable;
        
        // Changer le curseur avec l'icône du consommable
        gameState.uiManager.setTransformCursor(consumable);
        
        // Ajouter les événements de clic sur les troupes du header
        gameState.uiManager.addTransformClickListeners(gameState);
        
        // Afficher une notification
        const targetUnitName = consumable.targetUnit || 'Épéiste';
        //gameState.showNotification(`Cliquez sur une unité dans le header pour la transformer en ${targetUnitName}`, 'info');
    }

    // Récupérer l'icône d'un consommable
    getConsumableIcon(consumableType) {
        const consumableData = this.CONSUMABLES_TYPES[consumableType];
        return consumableData ? consumableData.icon : '❓';
    }

    // ===== GESTION DU MODE DUPLICATION =====
    
    // Activer le mode duplication avec curseur personnalisé
    activateDuplicateMode(consumable, gameState) {
        // Stocker le consommable de duplication actif
        this.activeDuplicateConsumable = consumable;
        
        // Changer le curseur avec l'icône du consommable
        gameState.uiManager.setDuplicateCursor(consumable);
        
        // Ajouter les événements de clic sur les troupes du header
        gameState.uiManager.addDuplicateClickListeners(gameState);
        
        // Afficher une notification
        gameState.notificationManager.showNotification('Cliquez sur une unité dans le header pour la dupliquer', 'info');
    }

    // Dupliquer une unité depuis la modal des troupes
    duplicateUnitFromModal(unitName, gameState) {
        // Vérifier si l'utilisateur a un consommable de duplication
        const duplicateConsumables = this.consumables.filter(c => c.type === 'duplicateUnit');
        
        if (duplicateConsumables.length === 0) {
            gameState.notificationManager.showConsumableError('Vous devez posséder un Miroir de Duplication pour dupliquer des unités !');
            return;
        }

        // Vérifier si l'unité existe dans le pool global
        const globalPool = createGlobalUnitPool(gameState);
        const sourceUnits = globalPool.filter(unit => unit.name === unitName);
        
        if (sourceUnits.length === 0) {
            gameState.notificationManager.showConsumableError(`Aucune unité "${unitName}" trouvée !`);
            return;
        }

        // Ajouter une copie de l'unité au pool global
        gameState.ownedUnits[unitName] = (gameState.ownedUnits[unitName] || 0) + 1;
        
        // Nettoyer le cache des unités car les quantités ont changé
        clearUnitCache();

        // Consommer le consommable de duplication
        if (this.activeDuplicateConsumable) {
            const consumableIndex = this.consumables.findIndex(c => c.id === this.activeDuplicateConsumable.id);
            if (consumableIndex !== -1) {
                this.consumables.splice(consumableIndex, 1);
            }
            // Réinitialiser la référence
            this.activeDuplicateConsumable = null;
        } else {
            // Fallback : supprimer le premier consommable de duplication trouvé
            const consumableIndex = this.consumables.findIndex(c => c.type === 'duplicateUnit');
            if (consumableIndex !== -1) {
                this.consumables.splice(consumableIndex, 1);
            }
        }

        // Jouer une animation de duplication
        gameState.animationManager.playDuplicateAnimation(unitName, gameState);

        // Mettre à jour l'affichage
        gameState.updateUI();
        this.updateConsumablesDisplay(gameState);

        // Fermer la modal des troupes
        ModalManager.hideModal('troops-modal');

        // Notification de succès
        gameState.notificationManager.showUnitAdded(unitName);
    }

    // Annuler le mode duplication
    cancelDuplicateMode(gameState) {
        // Réinitialiser le consommable de duplication actif
        this.activeDuplicateConsumable = null;
        
        // Restaurer l'interface utilisateur
        if (gameState && gameState.uiManager) {
            gameState.uiManager.cancelDuplicateMode(gameState);
        }
    }
} 