// Gestion centralisée des unités pour GuildMaster
import { BASE_UNITS, ALL_UNITS } from './constants/units/UnitConstants.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { getRarityDisplayName, getRarityColor, getRarityIcon } from './constants/game/RarityUtils.js';

// Récupérer seulement les unités de base (quantity > 0)
export function getBaseUnits() {
    return BASE_UNITS.filter(unit => unit.quantity > 0);
}

// Récupérer toutes les unités disponibles pour le magasin
export function getShopUnits() {
    return BASE_UNITS.filter(unit => unit.quantity === 0);
}

// Récupérer toutes les troupes disponibles dans le jeu
export function getAllAvailableTroops() {
    return ALL_UNITS;
}

// Obtenir les unités possédées pour la sauvegarde
export function getOwnedUnits(ownedUnits) {
    return ownedUnits;
}

// Charger les unités possédées depuis la sauvegarde
export function loadOwnedUnits(ownedUnits, gameState) {
    gameState.ownedUnits = ownedUnits || {};
}

// Cache pour les objets d'unités de base (évite la recréation répétée)
const unitBaseCache = new Map();

// Fonction pour nettoyer le cache quand les unités changent
export function clearUnitCache() {
    unitBaseCache.clear();
}

// Créer le pool global d'unités avec comptage par nom (optimisé avec cache)
export function createGlobalUnitPool(gameState) {
    const globalPool = [];
    
    // Ajouter toutes les unités avec leurs quantités respectives
    ALL_UNITS.forEach(unit => {
        let quantity = 0;
        
        // Pour les unités de base, prendre la quantité depuis ownedUnits ou la quantité par défaut
        if (unit.quantity > 0) {
            quantity = gameState.ownedUnits[unit.name] || unit.quantity || 0;
        } else {
            // Pour les unités spéciales, prendre la quantité depuis ownedUnits
            quantity = gameState.ownedUnits[unit.name] || 0;
        }
        
        // Créer les instances d'unités avec des IDs uniques (utiliser le cache)
        for (let i = 0; i < quantity; i++) {
            const cacheKey = `${unit.name}_${i}`;
            
            // Vérifier si l'objet est déjà en cache
            if (!unitBaseCache.has(cacheKey)) {
                // Créer l'objet de base et le mettre en cache
                const unitInstance = {
                    ...unit,
                    id: cacheKey,
                    originalName: unit.name // Garder une trace du nom original
                };
                unitBaseCache.set(cacheKey, unitInstance);
            }
            
            // Récupérer l'objet du cache
            globalPool.push(unitBaseCache.get(cacheKey));
        }
    });
    
    return globalPool;
}

// Créer un pool de combat à partir du pool global en excluant les unités utilisées
function createCombatPool(gameState) {
    const globalPool = createGlobalUnitPool(gameState);
    
    // Retirer les unités déjà utilisées dans ce combat
    const availableUnits = globalPool.filter(unit => {
        return !gameState.usedTroopsThisCombat.includes(unit.id);
    });
    
    return availableUnits;
}

// Ajouter une troupe à la liste des troupes disponibles
export function addTroop(troop, gameState) {
    gameState.availableTroops.push(troop);
    gameState.updateTroopsUI();
} 

// Tirer 7 troupes aléatoirement pour le combat
export function drawCombatTroops(gameState) {
    // Ne pas régénérer les troupes si elles existent déjà (pour la sauvegarde)
    if (gameState.combatTroops && gameState.combatTroops.length > 0) {
        gameState.updateTroopsUI();
        return;
    }
    
    gameState.combatTroops = [];
    
    // Créer le pool de combat disponible
    const combatPool = createCombatPool(gameState);
    
    // Tirer 7 troupes aléatoirement
    for (let i = 0; i < 7 && combatPool.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * combatPool.length);
        gameState.combatTroops.push(combatPool.splice(randomIndex, 1)[0]);
    }
    
    gameState.updateTroopsUI();
} 

// Maintenir 7 troupes disponibles en tirant de nouvelles troupes
export function maintainCombatTroops(gameState) {
    // Créer le pool de combat disponible
    const combatPool = createCombatPool(gameState);
    
    // Retirer les troupes déjà dans le pool de combat
    const remainingTroops = combatPool.filter(troop => 
        !gameState.combatTroops.some(combatTroop => combatTroop.id === troop.id)
    );
    
    // Ajouter des troupes jusqu'à avoir 7 disponibles
    while (gameState.combatTroops.length < 7 && remainingTroops.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingTroops.length);
        const newTroop = remainingTroops.splice(randomIndex, 1)[0];
        gameState.combatTroops.push(newTroop);
    }
} 

// Vérifier si une unité est permanente (achetée ou transformée)
export function isPermanentUnit(troop) {
    // Les unités de base ont des IDs avec un format spécifique (nom_index)
    // Les unités achetées/transformées ont des IDs uniques avec timestamp
    return !troop.id.includes('_') || troop.id.split('_').length > 2;
} 

// Vérifier si une troupe a un type spécifique
export function hasTroopType(troop, targetType) {
    if (Array.isArray(troop.type)) {
        return troop.type.includes(targetType);
    }
    return troop.type === targetType;
}

// Relancer les troupes sélectionnées (les retirer du pool de combat et les remplacer par de nouvelles)
export function rerollSelectedTroops(gameState) {
    // Vérifier si le malus de Quilegan est actif
    const isQuileganActive = gameState.currentCombat && 
                            gameState.currentCombat.isBossFight && 
                            gameState.currentCombat.bossName === 'Quilegan' &&
                            !gameState.bossManager.isBossMalusDisabled();
    
    if (isQuileganActive) {
        gameState.notificationManager.showNotification('Relance bloquée par Quilegan - Vendez un bonus pour débloquer !', 'warning');
        return;
    }
    
    // Vérifier le nombre de relances restantes
    if (!gameState.rerollCount) {
        gameState.rerollCount = 0;
    }
    
    if (gameState.rerollCount >= 3) {
        gameState.notificationManager.showNotification('Vous avez atteint la limite de 3 relances maximum !', 'warning');
        return;
    }
    
    // Filtrer les troupes sélectionnées qui peuvent être relancées
    const troopsToReroll = gameState.selectedTroops.filter(troop => {
        // Vérifier si la troupe est dans le pool de combat
        const isInCombatPool = gameState.combatTroops.some(t => t.id === troop.id);
        // Vérifier si la troupe n'est pas utilisée
        const isNotUsed = !gameState.usedTroopsThisCombat.includes(troop.id);
        return isInCombatPool && isNotUsed;
    });
    
    if (troopsToReroll.length === 0) {
        gameState.notificationManager.showNotification('Aucune troupe sélectionnée peut être relancée !', 'warning');
        return;
    }
    
    // Créer le pool de combat disponible
    const combatPool = createCombatPool(gameState);
    
    // Retirer les troupes déjà dans le pool de combat
    const remainingTroops = combatPool.filter(t => 
        !gameState.combatTroops.some(combatTroop => combatTroop.id === t.id)
    );
    
    // Retirer les troupes déjà utilisées dans ce combat
    const unusedTroops = remainingTroops.filter(troop => {
        return !gameState.usedTroopsThisCombat.includes(troop.id);
    });
    
    let rerolledCount = 0;
    const rerolledTroops = [];
    
    // Relancer chaque troupe sélectionnée
    troopsToReroll.forEach(troop => {
        // Retirer la troupe du pool de combat
        const combatTroopIndex = gameState.combatTroops.findIndex(t => t.id === troop.id);
        if (combatTroopIndex !== -1) {
            gameState.combatTroops.splice(combatTroopIndex, 1);
        }
        
        // Retirer la troupe de la sélection
        const selectedIndex = gameState.selectedTroops.findIndex(t => t.id === troop.id);
        if (selectedIndex !== -1) {
            gameState.selectedTroops.splice(selectedIndex, 1);
        }
        
        // Ajouter la troupe relancée à la liste des troupes utilisées dans ce combat
        gameState.usedTroopsThisCombat.push(troop.id);
        
        // Tirer une nouvelle troupe au hasard
        if (unusedTroops.length > 0) {
            const randomIndex = Math.floor(Math.random() * unusedTroops.length);
            const newTroop = unusedTroops.splice(randomIndex, 1)[0];
            gameState.combatTroops.push(newTroop);
            
            rerolledTroops.push({ from: troop.name, to: newTroop.name });
            rerolledCount++;
        }
    });
    
    // Incrémenter le compteur de relances
    gameState.rerollCount++;
    
    // Afficher une notification avec le résumé des relances
    if (rerolledCount > 0) {
        const rerollText = rerolledTroops.map(r => `${r.from} → ${r.to}`).join(', ');
        gameState.notificationManager.showNotification(`Relance ${gameState.rerollCount}/3 : ${rerollText}`, 'info');
    } else {
        gameState.notificationManager.showNotification('Aucune troupe disponible pour le remplacement', 'warning');
    }
    
    // Mettre à jour l'interface
    gameState.updateTroopsUI();
    gameState.updateSynergies();
    
    // Mettre à jour l'affichage du bouton de relance
    if (gameState.unitSorter) {
        gameState.unitSorter.updateRerollButton();
    }
}

// Sélectionner une troupe pour le combat (max 5)
export function selectTroopForCombat(troopIndex, gameState) {
    if (gameState.selectedTroops.length >= 5) {
        gameState.notificationManager.showUnitSelectionError('Vous ne pouvez sélectionner que 5 troupes maximum !');
        return;
    }
    
    // Obtenir toutes les troupes disponibles (seulement depuis combatTroops)
    const allAvailableTroops = [...gameState.combatTroops];
    
    if (troopIndex >= 0 && troopIndex < allAvailableTroops.length) {
        const troop = allAvailableTroops[troopIndex];
        
        // Vérifier si la troupe n'est pas déjà sélectionnée
        const alreadySelected = gameState.selectedTroops.some(t => t.id === troop.id);
        if (alreadySelected) {
            gameState.notificationManager.showUnitSelectionError('Cette troupe est déjà sélectionnée !');
            return;
        }
        
        // Ajouter la troupe à la sélection sans la retirer de la liste disponible
        gameState.selectedTroops.push(troop);
        gameState.updateTroopsUI();
        gameState.updateSynergies();
    }
} 

// Désélectionner une troupe du combat
export function deselectTroopFromCombat(troopIndex, gameState) {
    if (troopIndex >= 0 && troopIndex < gameState.selectedTroops.length) {
        const troop = gameState.selectedTroops.splice(troopIndex, 1)[0];
        
        // La troupe reste dans la liste disponible, pas besoin de la remettre
        gameState.updateTroopsUI();
        gameState.updateSynergies();
    }
} 

// Retirer les troupes utilisées de la sélection ET du pool de combat
export function removeUsedTroopsFromCombat(troopsUsed, gameState) {
    troopsUsed.forEach(usedTroop => {
        // Retirer de la sélection
        const selectedIndex = gameState.selectedTroops.findIndex(troop => troop.id === usedTroop.id);
        if (selectedIndex !== -1) {
            gameState.selectedTroops.splice(selectedIndex, 1);
        }
        
        // Retirer du pool de combat
        const combatIndex = gameState.combatTroops.findIndex(troop => troop.id === usedTroop.id);
        if (combatIndex !== -1) {
            gameState.combatTroops.splice(combatIndex, 1);
        }
        
        // Ajouter l'unité utilisée à la liste des unités utilisées dans ce combat
        if (!gameState.usedTroopsThisCombat.includes(usedTroop.id)) {
            gameState.usedTroopsThisCombat.push(usedTroop.id);
        }
    });
    
    // Maintenir 7 troupes disponibles en ajoutant de nouvelles troupes
    maintainCombatTroops(gameState);
    
    gameState.updateTroopsUI();
    gameState.updateSynergies();
} 

// Mettre à jour l'interface des troupes disponibles


 

 

import { SYNERGY_DEFINITIONS, SPECIAL_SYNERGIES } from './constants/synergies/SynergyDefinitions.js';

// Calculer les synergies entre les troupes
export function calculateSynergies(troops = null, gameState) {
    const synergies = [];
    
    // Utiliser les troupes passées en paramètre ou les troupes sélectionnées
    const troopsToCheck = troops || gameState.selectedTroops;
    
    // Compter les types de troupes
    const typeCounts = {};
    troopsToCheck.forEach(troop => {
        if (Array.isArray(troop.type)) {
            troop.type.forEach(type => {
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
        } else {
            typeCounts[troop.type] = (typeCounts[troop.type] || 0) + 1;
        }
    });

    // --- SYNERGIE SOIGNEUR (SPECIAL_SYNERGIES) ---
    const healerCount = typeCounts['Soigneur'] || 0;
    if (healerCount > 0) {
        const synergyDef = SPECIAL_SYNERGIES['Présence de Soigneur'];
        synergies.push({
            name: synergyDef.name,
            description: `+${healerCount * 3} dégâts pour toute l'équipe (Soigneur)`,
            bonus: { damage: healerCount * 3, target: 'all' },
            level: healerCount
        });
    }

    // --- SAINTE TRINITÉ (SPECIAL_SYNERGIES) ---
    const meleeCount = typeCounts['Corps à corps'] || 0;
    const rangedCount = typeCounts['Distance'] || 0;
    if (meleeCount >= 1 && rangedCount >= 1 && healerCount >= 1) {
        const synergyDef = SPECIAL_SYNERGIES['Sainte Trinité'];
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description,
            bonus: { 
                damage: synergyDef.damageBonus, 
                multiplier: synergyDef.multiplierBonus, 
                target: synergyDef.target 
            },
            level: 1
        });
    }

    // Synergies de base (SYNERGY_DEFINITIONS)
    if (typeCounts['Corps à corps'] >= 3) {
        const synergyDef = SYNERGY_DEFINITIONS['Formation Corps à Corps'];
        const level = gameState.synergyLevels['Formation Corps à Corps'] || 1;
        const multiplierBonus = synergyDef.baseBonus + (level - 1);
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description.replace('{bonus}', multiplierBonus).replace('{level}', level),
            bonus: { multiplier: multiplierBonus, target: synergyDef.target },
            level: level
        });
    }
    
    if (typeCounts['Distance'] >= 3) {
        const synergyDef = SYNERGY_DEFINITIONS['Formation Distance'];
        const level = gameState.synergyLevels['Formation Distance'] || 1;
        const multiplierBonus = synergyDef.baseBonus + (level - 1);
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description.replace('{bonus}', multiplierBonus).replace('{level}', level),
            bonus: { multiplier: multiplierBonus, target: synergyDef.target },
            level: level
        });
    }
    
    if (typeCounts['Magique'] >= 3) {
        const synergyDef = SYNERGY_DEFINITIONS['Formation Magique'];
        const level = gameState.synergyLevels['Formation Magique'] || 1;
        const multiplierBonus = synergyDef.baseBonus + (level - 1);
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description.replace('{bonus}', multiplierBonus).replace('{level}', level),
            bonus: { multiplier: multiplierBonus, target: synergyDef.target },
            level: level
        });
    }

    // Synergies avancées (SYNERGY_DEFINITIONS)
    if (typeCounts['Corps à corps'] >= 5) {
        const synergyDef = SYNERGY_DEFINITIONS['Horde Corps à Corps'];
        const level = gameState.synergyLevels['Horde Corps à Corps'] || 1;
        const damageBonus = synergyDef.baseDamageBonus + (level - 1);
        const multiplierBonus = synergyDef.baseMultiplierBonus + (level - 1);
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description
                .replace('{damage}', damageBonus)
                .replace('{multiplier}', multiplierBonus)
                .replace('{level}', level),
            bonus: { damage: damageBonus, multiplier: multiplierBonus, target: synergyDef.target },
            level: level
        });
    }
    
    if (typeCounts['Distance'] >= 5) {
        const synergyDef = SYNERGY_DEFINITIONS['Volée de Flèches'];
        const level = gameState.synergyLevels['Volée de Flèches'] || 1;
        const damageBonus = synergyDef.baseDamageBonus + (level - 1);
        const multiplierBonus = synergyDef.baseMultiplierBonus + (level - 1);
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description
                .replace('{damage}', damageBonus)
                .replace('{multiplier}', multiplierBonus)
                .replace('{level}', level),
            bonus: { damage: damageBonus, multiplier: multiplierBonus, target: synergyDef.target },
            level: level
        });
    }
    
    if (typeCounts['Magique'] >= 5) {
        const synergyDef = SYNERGY_DEFINITIONS['Tempête Magique'];
        const level = gameState.synergyLevels['Tempête Magique'] || 1;
        const damageBonus = synergyDef.baseDamageBonus + (level - 1);
        const multiplierBonus = synergyDef.baseMultiplierBonus + (level - 1);
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description
                .replace('{damage}', damageBonus)
                .replace('{multiplier}', multiplierBonus)
                .replace('{level}', level),
            bonus: { damage: damageBonus, multiplier: multiplierBonus, target: synergyDef.target },
            level: level
        });
    }

    // Synergies mixtes (SYNERGY_DEFINITIONS)
    if (typeCounts['Corps à corps'] >= 3 && typeCounts['Distance'] >= 3) {
        const synergyDef = SYNERGY_DEFINITIONS['Tactique Mixte'];
        const level = gameState.synergyLevels['Tactique Mixte'] || 1;
        const damageBonus = synergyDef.baseBonus + (level - 1);
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description
                .replace('{bonus}', damageBonus)
                .replace('{level}', level),
            bonus: { damage: damageBonus, target: synergyDef.target },
            level: level
        });
    }
    
    if (typeCounts['Physique'] >= 6) {
        const synergyDef = SYNERGY_DEFINITIONS['Force Physique'];
        const level = gameState.synergyLevels['Force Physique'] || 1;
        const damageBonus = synergyDef.baseBonus + (level - 1);
        synergies.push({
            name: synergyDef.name,
            description: synergyDef.description
                .replace('{bonus}', damageBonus)
                .replace('{level}', level),
            bonus: { damage: damageBonus, target: synergyDef.target },
            level: level
        });
    }

    return synergies;
} 

// Calculer les bonus d'équipement
export function calculateEquipmentBonuses(gameState) {
    const bonuses = [];
    const bonusDescriptions = gameState.getBonusDescriptions();
    
    // Compter les occurrences de chaque bonus
    const bonusCounts = {};
    gameState.unlockedBonuses.forEach(bonusId => {
        bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
    });
    
    // Appliquer les bonus d'équipement
    Object.keys(bonusCounts).forEach(bonusId => {
        const count = bonusCounts[bonusId];
        const bonusDesc = bonusDescriptions[bonusId];
        
        if (!bonusDesc) {
            console.warn(`Bonus non trouvé dans les descriptions: ${bonusId}`);
            return;
        }
        
        // Bonus de dégâts pour corps à corps
        if (bonusId === 'epee_aiguisee') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 2 * count, 
                target: 'Corps à corps' 
            });
        }
        // Bonus de dégâts pour distance
        else if (bonusId === 'arc_renforce') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 2 * count, 
                target: 'Distance' 
            });
        }
        // Bonus de dégâts pour magique
        else if (bonusId === 'grimoire_magique') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 2 * count, 
                target: 'Magique' 
            });
        }
        // Bonus de multiplicateur pour corps à corps
        else if (bonusId === 'amulette_force') {
            bonuses.push({ 
                name: bonusDesc.name,
                multiplier: 1 * count, 
                target: 'Corps à corps' 
            });
        }
        // Bonus de multiplicateur pour distance
        else if (bonusId === 'cristal_precision') {
            bonuses.push({ 
                name: bonusDesc.name,
                multiplier: 1 * count, 
                target: 'Distance' 
            });
        }
        // Bonus de multiplicateur pour magique
        else if (bonusId === 'orbe_mystique') {
            bonuses.push({ 
                name: bonusDesc.name,
                multiplier: 1 * count, 
                target: 'Magique' 
            });
        }
        // Bonus légendaires corps à corps
        else if (bonusId === 'armure_legendaire') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 5 * count, 
                multiplier: 2 * count, 
                target: 'Corps à corps' 
            });
        }
        // Bonus légendaires distance
        else if (bonusId === 'arc_divin') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 5 * count, 
                multiplier: 2 * count, 
                target: 'Distance' 
            });
        }
        // Bonus légendaires magique
        else if (bonusId === 'baguette_supreme') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 5 * count, 
                multiplier: 2 * count, 
                target: 'Magique' 
            });
        }
        // Bonus pour toutes les unités
        else if (bonusId === 'potion_force') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 3 * count, 
                target: 'all' 
            });
        }
        else if (bonusId === 'elixir_puissance') {
            bonuses.push({ 
                name: bonusDesc.name,
                multiplier: 1 * count, 
                target: 'all' 
            });
        }
        else if (bonusId === 'relique_ancienne') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 10 * count, 
                multiplier: 3 * count, 
                target: 'all' 
            });
        }
        // Bonus dynamiques avec effets multiples
        else if (bonusId === 'cac_cest_la_vie') {
            const dynamicBonus = calculateDynamicBonus(bonusDesc, gameState, bonusId);
            if (dynamicBonus) {
                bonuses.push(dynamicBonus);
            }
        }
        else if (bonusId === 'economie_dune_vie') {
            const dynamicBonus = calculateDynamicBonus(bonusDesc, gameState, bonusId);
            if (dynamicBonus) {
                bonuses.push(dynamicBonus);
            }
        }
        // Bonus de base pour corps à corps
        else if (bonusId === 'corps_a_corps_bonus') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 10 * count, 
                target: 'Corps à corps' 
            });
        }
        // Bonus de base pour distance
        else if (bonusId === 'distance_bonus') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 10 * count, 
                target: 'Distance' 
            });
        }
        // Bonus de base pour magique
        else if (bonusId === 'magique_bonus') {
            bonuses.push({ 
                name: bonusDesc.name,
                damage: 10 * count, 
                target: 'Magique' 
            });
        }
    });
    
    return bonuses;
}

// Calculer les bonus dynamiques avec effets multiples
export function calculateDynamicBonus(bonusDesc, gameState, bonusId) {
    if (!bonusDesc.effects) {
        return null;
    }
    
    let totalValue = 0;
    let target = null;
    
    bonusDesc.effects.forEach(effect => {
        if (effect.condition === 'base') {
            // Effet de base : valeur de base + améliorations d'achat
            let baseValue = effect.value;
            
            // Ajouter les améliorations d'achat si disponibles
            if (gameState.dynamicBonusStates && 
                gameState.dynamicBonusStates[bonusId] && 
                gameState.dynamicBonusStates[bonusId]['base']) {
                baseValue += gameState.dynamicBonusStates[bonusId]['base'];
            }
            
            totalValue += baseValue;
            target = effect.target;
        }
        else if (effect.condition === 'synergy_trigger') {
            // Effet déclenché par synergie
            let triggerCount = 0;
            
            // Récupérer le compteur depuis les états sauvegardés
            if (gameState.dynamicBonusStates && 
                gameState.dynamicBonusStates[bonusId] && 
                gameState.dynamicBonusStates[bonusId][effect.triggerSynergy]) {
                triggerCount = gameState.dynamicBonusStates[bonusId][effect.triggerSynergy];
            } else {
                // Fallback vers le compteur local si pas de sauvegarde
                triggerCount = effect.triggerCount || 0;
            }
            
            totalValue += effect.value * triggerCount;
            target = effect.target;
        }
        else if (effect.condition === 'end_of_combat') {
            // Effet déclenché par fin de combat
            let triggerCount = 0;
            
            // Récupérer le compteur depuis les états sauvegardés
            if (gameState.dynamicBonusStates && 
                gameState.dynamicBonusStates[bonusId] && 
                gameState.dynamicBonusStates[bonusId]['end_of_combat']) {
                triggerCount = gameState.dynamicBonusStates[bonusId]['end_of_combat'];
            } else {
                // Fallback vers le compteur local si pas de sauvegarde
                triggerCount = effect.triggerCount || 0;
            }
            
            totalValue += effect.value * triggerCount;
            target = effect.target;
        }
    });
    
    if (totalValue > 0 && target) {
        return {
            name: bonusDesc.name,
            multiplier: totalValue,
            target: target === 'melee_units' ? 'Corps à corps' : target
        };
    }
    
    // Gérer les bonus d'or (sans target spécifique)
    if (totalValue > 0 && bonusDesc.effects.some(effect => effect.type === 'gold_bonus')) {
        return {
            name: bonusDesc.name,
            gold: totalValue,
            target: 'all'
        };
    }
    
    return null;
}

// Synchroniser les compteurs de trigger des bonus dynamiques avec le nombre d'exemplaires possédés
export function syncDynamicBonusTriggers(gameState) {
    const bonusDescriptions = gameState.getBonusDescriptions();
    
    // Compter les occurrences de chaque bonus
    const bonusCounts = {};
    gameState.unlockedBonuses.forEach(bonusId => {
        bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
    });
    
    // Liste des bonus dynamiques qui ont des triggers
    const dynamicBonusesWithTriggers = ['cac_cest_la_vie', 'economie_dune_vie'];
    
    dynamicBonusesWithTriggers.forEach(bonusId => {
        const bonusDesc = bonusDescriptions[bonusId];
        if (!bonusDesc || !bonusDesc.effects) return;
        
        const count = bonusCounts[bonusId] || 0;
        if (count === 0) return;
        
        bonusDesc.effects.forEach(effect => {
            if (effect.condition === 'synergy_trigger') {
                // Synchroniser le compteur de trigger avec le nombre d'exemplaires
                const triggerSynergy = effect.triggerSynergy;
                
                // Initialiser les états de sauvegarde si nécessaire
                if (!gameState.dynamicBonusStates) {
                    gameState.dynamicBonusStates = {};
                }
                if (!gameState.dynamicBonusStates[bonusId]) {
                    gameState.dynamicBonusStates[bonusId] = {};
                }
                
                // Mettre à jour le compteur de trigger pour qu'il soit au moins égal au nombre d'exemplaires
                const currentTriggerCount = gameState.dynamicBonusStates[bonusId][triggerSynergy] || 0;
                const newTriggerCount = Math.max(currentTriggerCount, count);
                
                if (newTriggerCount !== currentTriggerCount) {
                    gameState.dynamicBonusStates[bonusId][triggerSynergy] = newTriggerCount;
                    effect.triggerCount = newTriggerCount;
                }
            }
        });
    });
}

// Incrémenter le compteur d'un bonus dynamique quand une synergie se déclenche
export function incrementDynamicBonusTrigger(bonusId, triggerSynergy, gameState) {
    // Vérifier si le bonus est débloqué
    if (!gameState.unlockedBonuses.includes(bonusId)) {
        return;
    }
    
    // Récupérer la description du bonus
    const bonusDescriptions = gameState.getBonusDescriptions();
    const bonusDesc = bonusDescriptions[bonusId];
    
    if (!bonusDesc || !bonusDesc.effects) {
        return;
    }
    
    // Trouver l'effet avec le trigger correspondant
    const triggerEffect = bonusDesc.effects.find(effect => 
        effect.condition === 'synergy_trigger' && 
        effect.triggerSynergy === triggerSynergy
    );
    
    if (triggerEffect) {
        // Vérifier si ce bonus a déjà été incrémenté ce round
        const roundKey = `round_${gameState.currentCombat.round || 1}`;
        const bonusRoundKey = `${bonusId}_${triggerSynergy}_${roundKey}`;
        
        if (gameState.dynamicBonusTriggers && gameState.dynamicBonusTriggers[bonusRoundKey]) {
            // Déjà incrémenté ce round, ne rien faire
            return;
        }
        
        // Récupérer le compteur actuel depuis les états sauvegardés
        let currentCount = 0;
        if (gameState.dynamicBonusStates && 
            gameState.dynamicBonusStates[bonusId] && 
            gameState.dynamicBonusStates[bonusId][triggerSynergy]) {
            currentCount = gameState.dynamicBonusStates[bonusId][triggerSynergy];
        } else {
            currentCount = triggerEffect.triggerCount || 0;
        }
        
        // Incrémenter le compteur
        const newCount = currentCount + 1;
        triggerEffect.triggerCount = newCount;
        
        // Sauvegarder l'état du bonus dynamique
        if (!gameState.dynamicBonusStates) {
            gameState.dynamicBonusStates = {};
        }
        if (!gameState.dynamicBonusStates[bonusId]) {
            gameState.dynamicBonusStates[bonusId] = {};
        }
        gameState.dynamicBonusStates[bonusId][triggerSynergy] = newCount;
        
        // Marquer comme incrémenté ce round
        if (!gameState.dynamicBonusTriggers) {
            gameState.dynamicBonusTriggers = {};
        }
        gameState.dynamicBonusTriggers[bonusRoundKey] = true;
    }
}

// Appliquer les bonus après combat
export function applyCombatBonuses(gameState) {
    // Compter les occurrences de chaque bonus
    const bonusCounts = {};
    gameState.unlockedBonuses.forEach(bonusId => {
        bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
    });
    
    // Bonus d'or uniquement
    if (bonusCounts['gold_bonus']) {
        const goldBonus = 25 * bonusCounts['gold_bonus'];
        gameState.addGold(goldBonus);
        // gameState.showNotification(`+${goldBonus} or (bonus)`, 'success');
    }
    
    // Les bonus de dégâts (corps_a_corps_bonus, distance_bonus, magique_bonus) 
    // sont maintenant traités comme des bonus d'équipement dans calculateEquipmentBonuses()
} 