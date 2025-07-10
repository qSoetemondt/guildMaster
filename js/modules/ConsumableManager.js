// Gestionnaire de consommables pour GuildMaster
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { getRarityIcon, getRarityColor } from './RarityUtils.js';

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
                effect: 'refreshShop'
            },
            transformSword: {
                name: 'Épée',
                description: 'Transforme une unité en Épéiste',
                icon: '⚔️',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Épéiste'
            },
            transformArcher: {
                name: 'Arc',
                description: 'Transforme une unité en Archer',
                icon: '🏹',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Archer'
            },
            transformLancier: {
                name: 'Lance',
                description: 'Transforme une unité en Lancier',
                icon: '🔱',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Lancier'
            },
            transformPaysan: {
                name: 'Fourche',
                description: 'Transforme une unité en Paysan',
                icon: '👨‍🌾',
                price: Math.ceil(5 * 1.75), // 9
                effect: 'transformUnit',
                targetUnit: 'Paysan'
            },
            transformMagicienBleu: {
                name: 'Livre bleu',
                description: 'Transforme une unité en Magicien Bleu',
                icon: '📘',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Magicien Bleu'
            },
            transformMagicienRouge: {
                name: 'Livre rouge',
                description: 'Transforme une unité en Magicien Rouge',
                icon: '🔴',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Magicien Rouge'
            },
            transformBarbare: {
                name: 'Hache',
                description: 'Transforme une unité en Barbare',
                icon: '👨‍🚒',
                price: Math.ceil(25 * 1.75), // 44
                effect: 'transformUnit',
                targetUnit: 'Barbare'
            },
            transformSorcier: {
                name: 'Orbe',
                description: 'Transforme une unité en Sorcier',
                icon: '🔮',
                price: Math.ceil(50 * 1.75), // 88
                effect: 'transformUnit',
                targetUnit: 'Sorcier'
            },
            transformFronde: {
                name: 'Fronde',
                description: 'Transforme une unité en Fronde',
                icon: '🪨',
                price: Math.ceil(50 * 1.75), // 88
                effect: 'transformUnit',
                targetUnit: 'Frondeur'
            },
            upgradeSynergy: {
                name: 'Cristal de Synergie',
                description: 'Améliore le niveau d\'une synergie d\'équipe de +1',
                icon: '💎',
                price: Math.ceil(30 * 1.75), // 53
                effect: 'upgradeSynergy'
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
            targetUnit: consumableTemplate.targetUnit
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
            if (consumable.effect !== 'transformUnit' && consumable.effect !== 'upgradeSynergy') {
                this.consumables.splice(consumableIndex, 1);
                this.updateConsumablesDisplay(gameState);
            }
            // Pour l'épée de transformation, le consommable sera supprimé après la transformation effective
            // Pour le cristal de synergie, le consommable sera supprimé après la sélection de la synergie
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
            
            default:
                console.error(`Effet de consommable inconnu: ${consumable.effect}`);
                return false;
        }
    }

    // Afficher les consomables dans l'interface
    updateConsumablesDisplay(gameState) {
        const consumablesContainer = document.getElementById('consumables-display');
        if (!consumablesContainer) {
            return;
        }

        consumablesContainer.innerHTML = '';

        if (this.consumables.length === 0) {
            return;
        }

        // Grouper les consommables par type
        const consumableCounts = {};
        this.consumables.forEach(consumable => {
            if (!consumableCounts[consumable.type]) {
                consumableCounts[consumable.type] = {
                    count: 0,
                    template: consumable
                };
            }
            consumableCounts[consumable.type].count++;
        });

        // Créer les éléments pour chaque type de consommable (icônes seulement)
        Object.keys(consumableCounts).forEach(consumableType => {
            const { count, template } = consumableCounts[consumableType];
            
            const consumableElement = document.createElement('div');
            consumableElement.className = 'consumable-icon-header';
            consumableElement.textContent = template.icon;
            consumableElement.setAttribute('data-count', count);
            consumableElement.title = `${template.name} (${count}) - ${template.description}`;
            
            // Ajouter l'événement de clic pour utiliser le consommable
            consumableElement.addEventListener('click', () => {
                this.useConsumable(template.id, gameState);
            });
            
            consumablesContainer.appendChild(consumableElement);
        });
    }

    // Ajouter un consommable au magasin
    addConsumableToShop() {
        // 80% de chance d'avoir un consommable dans le magasin (augmenté pour plus de visibilité)
        if (Math.random() < 0.8) {
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
                    consumableType: 'upgradeSynergy'
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
                    consumableType: randomType
                };
            }
        }
        return null;
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
        const modal = document.createElement('div');
        modal.id = 'synergy-upgrade-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💎 Améliorer une Synergie</h3>
                    <span class="close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Sélectionnez une synergie à améliorer :</p>
                    <div id="synergy-upgrade-list"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Afficher la liste des synergies disponibles
        this.updateSynergyUpgradeList(gameState);
        
        // Afficher la modal
        modal.style.display = 'block';
        
        // Ajouter un gestionnaire d'événements pour fermer avec Échap
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Nettoyer l'événement quand la modal est fermée
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            const originalOnClick = closeBtn.onclick;
            closeBtn.onclick = (e) => {
                document.removeEventListener('keydown', handleEscape);
                if (originalOnClick) originalOnClick.call(this, e);
            };
        }
    }
    
    // Mettre à jour la liste des synergies pour l'amélioration
    updateSynergyUpgradeList(gameState) {
        const container = document.getElementById('synergy-upgrade-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const synergyNames = Object.keys(gameState.synergyLevels);
        
        synergyNames.forEach(synergyName => {
            const currentLevel = gameState.synergyLevels[synergyName];
            const nextLevel = currentLevel + 1;
            
            const synergyElement = document.createElement('div');
            synergyElement.className = 'synergy-upgrade-item';
            synergyElement.innerHTML = `
                <div class="synergy-info">
                    <div class="synergy-name">${synergyName}</div>
                    <div class="synergy-level">Niveau actuel: ${currentLevel}</div>
                    <div class="synergy-next">Niveau suivant: ${nextLevel}</div>
                </div>
                <button class="upgrade-synergy-btn" data-synergy="${synergyName}">
                    Améliorer
                </button>
            `;
            
            // Ajouter l'événement click
            const upgradeBtn = synergyElement.querySelector('.upgrade-synergy-btn');
            upgradeBtn.addEventListener('click', () => {
                this.upgradeSynergy(synergyName, gameState);
            });
            
            container.appendChild(synergyElement);
        });
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
        const modal = document.getElementById('synergy-upgrade-modal');
        if (modal) {
            modal.remove();
        }
        
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

        // Vérifier si l'unité source existe
        const sourceTroops = gameState.availableTroops.filter(troop => troop.name === fromUnitName);
        const baseUnit = gameState.getBaseUnits().find(unit => unit.name === fromUnitName);
        
        // Si c'est une unité de base
        if (baseUnit) {
            // Initialiser le compteur si nécessaire
            if (!gameState.transformedBaseUnits[fromUnitName]) {
                gameState.transformedBaseUnits[fromUnitName] = 0;
            }
            
            // Vérifier qu'on n'a pas déjà transformé toutes les unités de base
            const maxTransformations = baseUnit.quantity || 5; // Utiliser la quantité configurable
            if (gameState.transformedBaseUnits[fromUnitName] >= maxTransformations) {
                gameState.notificationManager.showConsumableError(`Vous avez déjà transformé toutes vos unités ${fromUnitName} !`);
                return;
            }
            
            // Incrémenter le compteur de transformation
            gameState.transformedBaseUnits[fromUnitName]++;
        } else if (sourceTroops.length === 0) {
            gameState.notificationManager.showConsumableError(`Aucune unité "${fromUnitName}" trouvée !`);
            return;
        }

        // Trouver l'unité cible dans toutes les unités disponibles
        const allAvailableUnits = [...gameState.getBaseUnits(), ...gameState.getAllAvailableTroops()];
        const targetUnit = allAvailableUnits.find(unit => unit.name === toUnitName);
        if (!targetUnit) {
            gameState.notificationManager.showConsumableError(`Unité cible "${toUnitName}" non trouvée !`);
            return;
        }

        // Supprimer une unité source si c'est une unité achetée
        if (!baseUnit) {
            const sourceTroopIndex = gameState.availableTroops.findIndex(troop => troop.name === fromUnitName);
            if (sourceTroopIndex !== -1) {
                gameState.availableTroops.splice(sourceTroopIndex, 1);
            } else {
                gameState.notificationManager.showConsumableError(`Impossible de transformer cette unité !`);
                return;
            }
        }

        // Ajouter l'unité cible à ownedUnits comme un achat normal (pas automatiquement disponible dans les combats)
        gameState.ownedUnits[toUnitName] = (gameState.ownedUnits[toUnitName] || 0) + 1;

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
        this.playTransformAnimation(fromUnitName, toUnitName, gameState);

        // Mettre à jour l'affichage
        gameState.updateUI();
        this.updateConsumablesDisplay(gameState);

        // Fermer la modal des troupes
        const troopsModal = document.getElementById('troops-modal');
        if (troopsModal) {
            troopsModal.style.display = 'none';
        }
    }

    // Obtenir l'icône d'une unité par son nom
    getUnitIcon(unitName, gameState) {
        const allUnits = [...gameState.getBaseUnits(), ...gameState.getAllAvailableTroops()];
        const unit = allUnits.find(u => u.name === unitName);
        return unit ? unit.icon : '❓';
    }

    // Animation de transformation
    playTransformAnimation(fromUnitName, toUnitName, gameState) {
        // Créer l'élément d'animation
        const animationElement = document.createElement('div');
        animationElement.className = 'transform-animation';
        animationElement.innerHTML = `
            <div class="transform-content">
                <div class="transform-from">${this.getUnitIcon(fromUnitName, gameState)} ${fromUnitName}</div>
                <div class="transform-arrow">➜</div>
                <div class="transform-to">${this.getUnitIcon(toUnitName, gameState)} ${toUnitName}</div>
            </div>
        `;
        
        document.body.appendChild(animationElement);
        
        // Animation CSS
        setTimeout(() => {
            animationElement.classList.add('show');
        }, 100);
        
        // Supprimer après l'animation
        setTimeout(() => {
            animationElement.remove();
        }, 2000);
    }

    // ===== GESTION DE L'AFFICHAGE DES TROUPES AVEC TRANSFORMATIONS =====

    // Afficher toutes les troupes dans une modal avec les options de transformation
    showAllTroopsWithTransformations(gameState) {
        const troopsList = document.getElementById('all-troops-list');
        const troopsModal = document.getElementById('troops-modal');
        
        if (!troopsList || !troopsModal) return;

        troopsList.innerHTML = '';

        // Créer un pool complet de toutes les troupes disponibles (quantité configurable)
        const fullTroopPool = [];
        gameState.getBaseUnits().forEach(unit => {
            const quantity = unit.quantity || 5; // Valeur par défaut si non définie
            for (let i = 0; i < quantity; i++) {
                fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
            }
        });

        // Ajouter seulement les troupes achetées dans le magasin (pas les troupes de base)
        const allTroops = [
            ...fullTroopPool,
            ...gameState.availableTroops
        ];

        // Grouper les troupes par nom
        const troopsByType = {};
        allTroops.forEach(troop => {
            if (!troopsByType[troop.name]) {
                troopsByType[troop.name] = {
                    count: 0,
                    damage: troop.damage,
                    multiplier: troop.multiplier,
                    type: troop.unitType || troop.type, // Gérer les deux formats possibles
                    icon: troop.icon,
                    rarity: troop.rarity
                };
            }
            troopsByType[troop.name].count++;
        });

        // Ajuster les compteurs pour les unités de base transformées
        Object.keys(gameState.transformedBaseUnits).forEach(unitName => {
            if (troopsByType[unitName]) {
                troopsByType[unitName].count = Math.max(0, troopsByType[unitName].count - gameState.transformedBaseUnits[unitName]);
            }
        });

        // Créer les éléments pour chaque type de troupe
        Object.keys(troopsByType).forEach(troopName => {
            const troopData = troopsByType[troopName];
            const rarityClass = troopData.rarity ? `rarity-${troopData.rarity}` : '';
            const classes = ['troop-list-item'];
            if (rarityClass) classes.push(rarityClass);
            const troopElement = document.createElement('div');
            troopElement.className = classes.join(' ');

            const typeDisplay = getTypeDisplayString(troopData.type);

            // Vérifier si l'unité peut être transformée
            const baseUnit = gameState.getBaseUnits().find(unit => unit.name === troopName);
            const transformedCount = gameState.transformedBaseUnits[troopName] || 0;
            const baseQuantity = baseUnit ? (baseUnit.quantity || 5) : 0;
            const availableCount = baseUnit ? (baseQuantity - transformedCount) : troopData.count;
            
            // Générer le bouton de transformation approprié
            const transformButton = this.generateTransformButton(troopName, availableCount, gameState);

            troopElement.innerHTML = `
                <div class="troop-list-name">
                    ${troopData.icon} ${troopName}
                </div>
                <div class="troop-list-stats">
                    <span>💥 ${troopData.damage}</span>
                    <span>⚡ ${troopData.multiplier}</span>
                    <span>🏷️ ${typeDisplay}</span>
                    ${troopData.rarity ? `<span style="color: ${this.getRarityColor(troopData.rarity)}; font-weight: 600;">
                        ${this.getRarityIcon(troopData.rarity)} ${troopData.rarity.toUpperCase()}
                    </span>` : ''}
                </div>
                <div class="troop-list-count">
                    x${troopData.count}
                </div>
                <div class="troop-list-actions">
                    ${transformButton}
                </div>
            `;

            // Appliquer le style de rareté directement
            if (troopData.rarity) {
                const rarityColors = {
                    'common': 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(102, 102, 102, 0.05) 100%)',
                    'uncommon': 'linear-gradient(135deg, rgba(0, 184, 148, 0.1) 0%, rgba(0, 184, 148, 0.05) 100%)',
                    'rare': 'linear-gradient(135deg, rgba(116, 185, 255, 0.1) 0%, rgba(116, 185, 255, 0.05) 100%)',
                    'epic': 'linear-gradient(135deg, rgba(162, 155, 254, 0.1) 0%, rgba(162, 155, 254, 0.05) 100%)',
                    'legendary': 'linear-gradient(135deg, rgba(253, 203, 110, 0.1) 0%, rgba(253, 203, 110, 0.05) 100%)'
                };
                troopElement.style.background = rarityColors[troopData.rarity];
                troopElement.style.borderLeftColor = this.getRarityColor(troopData.rarity);
            }

            troopsList.appendChild(troopElement);
        });

        // Ajouter les gestionnaires d'événements pour les boutons de transformation
        setTimeout(() => {
            const transformButtons = troopsList.querySelectorAll('.transform-btn');
            transformButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const unitName = e.target.getAttribute('data-unit-name');
                    const targetUnit = e.target.getAttribute('data-target-unit');
                    if (unitName && targetUnit) {
                        this.transformUnitFromModal(unitName, targetUnit, gameState);
                    }
                });
            });
        }, 100);

        // Afficher la modal
        troopsModal.style.display = 'block';
    }

    // Générer le bouton de transformation approprié
    generateTransformButton(troopName, availableCount, gameState) {
        if (availableCount <= 0) return '';

        // Vérifier quel type de consommable de transformation est disponible
        const transformTypes = {
            'transformSword': { target: 'Épéiste', icon: '⚔️' },
            'transformArcher': { target: 'Archer', icon: '🏹' },
            'transformLancier': { target: 'Lancier', icon: '🔱' },
            'transformPaysan': { target: 'Paysan', icon: '👨‍🌾' },
            'transformMagicienBleu': { target: 'Magicien Bleu', icon: '🔵' },
            'transformMagicienRouge': { target: 'Magicien Rouge', icon: '🔴' },
            'transformBarbare': { target: 'Barbare', icon: '👨‍🚒' },
            'transformSorcier': { target: 'Sorcier', icon: '🔮' },
            'transformFronde': { target: 'Frondeeur', icon: '🪨' }
        };

        // Trouver le premier consommable de transformation disponible
        for (const [consumableType, transformInfo] of Object.entries(transformTypes)) {
            const hasTransform = this.consumables.some(c => c.type === consumableType);
            if (hasTransform && troopName !== transformInfo.target) {
                return `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="${transformInfo.target}" title="Transformer en ${transformInfo.target}">
                    ${transformInfo.icon} Transformer
                </button>`;
            }
        }

        return '';
    }



    // ===== GESTION DU MODE TRANSFORMATION =====
    
    // Activer le mode transformation avec curseur personnalisé
    activateTransformMode(consumable, gameState) {
        // Stocker le consommable de transformation actif
        this.activeTransformConsumable = consumable;
        
        // Changer le curseur avec l'icône du consommable
        this.setTransformCursor(consumable);
        
        // Ajouter les événements de clic sur les troupes du header
        this.addTransformClickListeners(gameState);
        
        // Afficher une notification
        const targetUnitName = consumable.targetUnit || 'Épéiste';
        //gameState.showNotification(`Cliquez sur une unité dans le header pour la transformer en ${targetUnitName}`, 'info');
    }
    
    // Changer le curseur avec l'icône du consommable
    setTransformCursor(consumable) {
        // Utiliser un curseur en forme de cible/sélecteur très visible
        document.body.style.cursor = `16 16, crosshair`;
        
        // Ajouter une classe pour le style du curseur
        document.body.classList.add('transform-mode');
        
        // Ajouter des effets visuels pour indiquer le mode transformation
        this.addTransformModeVisuals(consumable);
    }
    
    // Ajouter des effets visuels pour le mode transformation
    addTransformModeVisuals(consumable) {
        // Trouver l'élément consommable cliqué
        const consumableElements = document.querySelectorAll('.consumable-icon-header');
        let clickedElement = null;
        
        // Chercher l'élément qui correspond au consommable cliqué
        consumableElements.forEach(element => {
            if (element.textContent === consumable.icon) {
                clickedElement = element;
            }
        });
        
        // Créer une notification visible
        const notification = document.createElement('div');
        notification.id = 'transform-notification';
        
        // Positionner la notification à gauche du consommable cliqué
        if (clickedElement) {
            const rect = clickedElement.getBoundingClientRect();
            notification.style.position = 'fixed';
            notification.style.left = `${rect.left - 350}px`; // 350px à gauche du consommable
            notification.style.top = `${rect.top}px`;
            notification.style.zIndex = '10000';
        }
        
        notification.innerHTML = `
            <div class="transform-notification-content">
                <div class="transform-icon">${consumable.icon}</div>
                <div class="transform-text">
                    <div class="transform-title">Mode Transformation</div>
                    <div class="transform-description">Cliquez sur une unité pour la transformer</div>
                </div>
                <button class="transform-cancel" onclick="gameState.consumableManager.cancelTransformMode()">✕</button>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Ajouter un gestionnaire d'événements pour fermer avec Échap
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.cancelTransformMode();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Nettoyer l'événement quand la notification est fermée via le bouton
        const cancelBtn = notification.querySelector('.transform-cancel');
        if (cancelBtn) {
            const originalOnClick = cancelBtn.onclick;
            cancelBtn.onclick = (e) => {
                document.removeEventListener('keydown', handleEscape);
                if (originalOnClick) originalOnClick.call(this, e);
            };
        }
        
        // Ajouter un effet de pulsation sur les troupes
        const troopIcons = document.querySelectorAll('.troop-icon');
        troopIcons.forEach(icon => {
            icon.classList.add('transform-target');
        });
        
        // Ajouter un overlay semi-transparent sur toute la page
        const overlay = document.createElement('div');
        overlay.id = 'transform-overlay';
        document.body.appendChild(overlay);
    }
    
    // Annuler le mode transformation
    cancelTransformMode() {
        // Restaurer le curseur normal
        document.body.style.cursor = 'default';
        document.body.classList.remove('transform-mode');
        
        // Supprimer la notification
        const notification = document.getElementById('transform-notification');
        if (notification) {
            notification.remove();
        }
        
        // Supprimer l'overlay
        const overlay = document.getElementById('transform-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Retirer les effets sur les troupes
        const troopIcons = document.querySelectorAll('.troop-icon');
        troopIcons.forEach(icon => {
            icon.classList.remove('transform-target');
        });
        
        // Retirer les effets sur les troupes du header
        const headerTroopIcons = document.querySelectorAll('.troop-icon-header');
        headerTroopIcons.forEach(icon => {
            icon.classList.remove('transform-target');
        });
        
        // Réinitialiser le mode transformation
        this.activeTransformConsumable = null;
    }
    
    // Ajouter les événements de clic sur les troupes du header
    addTransformClickListeners(gameState) {
        const troopsContainer = document.getElementById('troops-display');
        if (!troopsContainer) return;
        
        // Supprimer les anciens listeners
        this.removeTransformClickListeners();
        
        // Ajouter les nouveaux listeners
        const troopIcons = troopsContainer.querySelectorAll('.troop-icon-header');
        troopIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleTroopTransformClick(icon, gameState);
            });
        });
    }
    
    // Supprimer les événements de clic de transformation
    removeTransformClickListeners() {
        const troopsContainer = document.getElementById('troops-display');
        if (!troopsContainer) return;
        
        const troopIcons = troopsContainer.querySelectorAll('.troop-icon-header');
        troopIcons.forEach(icon => {
            icon.removeEventListener('click', this.handleTroopTransformClick);
        });
    }
    
    // Gérer le clic sur une troupe pour la transformation
    handleTroopTransformClick(troopIcon, gameState) {
        if (!this.activeTransformConsumable) return;
        
        const troopName = troopIcon.getAttribute('data-troop-name');
        const targetUnitName = this.activeTransformConsumable.targetUnit || 'Épéiste';
        
        // Vérifier si l'unité peut être transformée
        if (!this.canTransformUnit(troopName, gameState)) {
            gameState.notificationManager.showConsumableError(`Impossible de transformer cette unité !`);
            return;
        }
        
        // Afficher la modal de confirmation
        this.showTransformConfirmationModal(troopName, targetUnitName, gameState);
        
        // Annuler le mode transformation après avoir affiché la modal
        this.cancelTransformMode();
    }
    
    // Vérifier si une unité peut être transformée
    canTransformUnit(troopName, gameState) {
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
            return false;
        }
        
        // Vérifier si c'est une unité de base
        const baseUnits = gameState.getBaseUnits();
        const baseUnit = baseUnits.find(unit => unit.name === troopName);
        
        if (!baseUnit) {
            return false;
        }
        
        // Vérifier qu'on n'a pas déjà transformé toutes les unités de base
        if (!gameState.transformedBaseUnits[troopName]) {
            gameState.transformedBaseUnits[troopName] = 0;
        }
        
        const maxTransformations = baseUnit.quantity || 5;
        if (gameState.transformedBaseUnits[troopName] >= maxTransformations) {
            return false;
        }
        
        return true;
    }
    
    // Afficher la modal de confirmation de transformation
    showTransformConfirmationModal(fromUnitName, toUnitName, gameState) {
        // Créer la modal de confirmation
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'transform-confirmation-modal';
        
        const fromIcon = this.getUnitIcon(fromUnitName, gameState);
        const toIcon = this.getUnitIcon(toUnitName, gameState);
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Confirmation de transformation</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="transform-confirmation-content">
                        <div class="transform-preview">
                            <div class="transform-from">
                                <span class="transform-icon">${fromIcon}</span>
                                <span class="transform-name">${fromUnitName}</span>
                            </div>
                            <div class="transform-arrow">➜</div>
                            <div class="transform-to">
                                <span class="transform-icon">${toIcon}</span>
                                <span class="transform-name">${toUnitName}</span>
                            </div>
                        </div>
                        <p>Êtes-vous sûr de vouloir transformer une unité <strong>${fromUnitName}</strong> en <strong>${toUnitName}</strong> ?</p>
                        <p><em>Cette action consommera un consommable de transformation.</em></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary">Annuler</button>
                    <button class="btn primary">Confirmer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Ajouter les gestionnaires d'événements
        const confirmBtn = modal.querySelector('.btn.primary');
        const cancelBtn = modal.querySelector('.btn.secondary');
        const closeBtn = modal.querySelector('.close-btn');
        
        // Fonction pour fermer la modal et nettoyer les événements
        const closeModal = () => {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        };
        
        // Gestionnaire d'événements pour Échap
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                this.deactivateTransformMode();
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        confirmBtn.addEventListener('click', () => {
            this.confirmTransform(fromUnitName, toUnitName, gameState);
            closeModal();
        });
        
        cancelBtn.addEventListener('click', () => {
            closeModal();
            this.deactivateTransformMode();
        });
        
        closeBtn.addEventListener('click', () => {
            closeModal();
            this.deactivateTransformMode();
        });
    }
    
    // Confirmer la transformation
    confirmTransform(fromUnitName, toUnitName, gameState) {
        // Effectuer la transformation
        this.transformUnitFromModal(fromUnitName, toUnitName, gameState);
        
        // Désactiver le mode transformation
        this.deactivateTransformMode();
    }
    
    // Désactiver le mode transformation
    deactivateTransformMode() {
        // Réinitialiser le curseur
        document.body.style.cursor = '';
        document.body.removeAttribute('data-transform-cursor');
        document.body.classList.remove('transform-mode');
        
        // Supprimer les listeners
        this.removeTransformClickListeners();
        
        // Réinitialiser le consommable actif
        this.activeTransformConsumable = null;
    }

    // Récupérer l'icône d'un consommable
    getConsumableIcon(consumableType) {
        const consumableData = this.CONSUMABLES_TYPES[consumableType];
        return consumableData ? consumableData.icon : '❓';
    }
} 