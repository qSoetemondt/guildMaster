// Gestion centralisée des unités pour GuildMaster
import { BASE_UNITS, ALL_UNITS } from './constants/units/UnitConstants.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { getRarityDisplayName, getRarityColor, getRarityIcon } from './constants/game/RarityUtils.js';
import { getDynamicBonusValue, incrementDynamicBonus, syncDynamicBonus } from '../utils/DynamicBonusUtils.js';

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
            quantity = (gameState.ownedUnits[unit.name] !== undefined) ? gameState.ownedUnits[unit.name] : (unit.quantity || 0);
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

// Générer la liste des troupes disponibles à partir de ownedUnits (chaque objet reçoit un id unique)
export function createAvailableTroopsFromOwnedUnits(gameState) {
    const troops = [];
    Object.entries(gameState.ownedUnits).forEach(([name, arr]) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((unit, idx) => {
            troops.push({
                ...unit,
                id: `${name}_${unit.element || ''}_${idx}_${Math.random().toString(36).slice(2,7)}`
            });
        });
    });
    return troops;
}

// Créer le pool de combat à partir du pool global en excluant les unités utilisées
function createCombatPool(gameState) {
    const globalPool = createAvailableTroopsFromOwnedUnits(gameState);
    
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


 

 

import { SYNERGY_DEFINITIONS, SPECIAL_SYNERGIES, calculateSynergyBonus } from './constants/synergies/SynergyDefinitions.js';

// Calculer les synergies entre les troupes
export function calculateSynergies(troops = null, gameState) {
    // Utiliser les troupes passées en paramètre ou les troupes sélectionnées
    const troopsToCheck = troops || gameState.selectedTroops;
    if (!troopsToCheck || troopsToCheck.length === 0) return [];

    // --- FUSION D'ÉLÉMENTS ---
    // Détecter les fusions d'éléments actives
    const fusionElements = [];
    const bonusDescriptions = gameState.getBonusDescriptions();
    for (const bonusId of gameState.unlockedBonuses) {
        const bonusDesc = bonusDescriptions[bonusId];
        if (bonusDesc && bonusDesc.effects) {
            for (const effect of bonusDesc.effects) {
                if (effect.type === 'fusion_element') {
                    fusionElements.push(effect.elements);
                }
            }
        }
    }
    // Fonction utilitaire pour savoir si deux éléments sont fusionnés
    function areElementsFused(el1, el2) {
        for (const fusion of fusionElements) {
            if (fusion.includes(el1) && fusion.includes(el2)) return true;
        }
        return false;
    }
    // Fonction utilitaire pour obtenir la "clé fusionnée" d'un élément
    function getFusionKey(element) {
        for (const fusion of fusionElements) {
            if (fusion.includes(element)) {
                // Retourne la première valeur de la fusion comme clé commune
                return fusion[0];
            }
        }
        return element;
    }
    // --- FIN FUSION D'ÉLÉMENTS ---

    // Comptage des types et éléments présents (pour synergies)
    const typeCounts = {};
    const elementCounts = {};
    for (const troop of troopsToCheck) {
        if (troop.type) {
            typeCounts[troop.type] = (typeCounts[troop.type] || 0) + 1;
        }
        if (troop.element) {
            const fusionKey = getFusionKey(troop.element);
            elementCounts[fusionKey] = (elementCounts[fusionKey] || 0) + 1;
        }
    }

    // Fusionner les synergies normales et spéciales
    const allSynergies = { ...SYNERGY_DEFINITIONS, ...SPECIAL_SYNERGIES };

    // Parcourir toutes les synergies et vérifier l’activation
    let activableSynergies = [];
    for (const [synergyName, synergyDef] of Object.entries(allSynergies)) {
        let isActive = true;
        // Vérification des types
        if (synergyDef.requiredTypes) {
            isActive = synergyDef.requiredTypes.every((type, idx) =>
                (typeCounts[type] || 0) >= (synergyDef.requiredCounts ? synergyDef.requiredCounts[idx] : 1)
            );
        } else if (synergyDef.requiredType) {
            isActive = (typeCounts[synergyDef.requiredType] || 0) >= (synergyDef.requiredCount || 1);
        }
        // Vérification des éléments
        if (synergyDef.requiredElements) {
            isActive = isActive && synergyDef.requiredElements.every((el, idx) =>
                (elementCounts[el] || 0) >= (synergyDef.requiredElementsCounts ? synergyDef.requiredElementsCounts[idx] : 1)
            );
        } else if (Array.isArray(synergyDef.requiredElement)) {
            // Cas où requiredElement est un tableau (ex: ['Feu','Eau','Terre','Air'])
            if (Array.isArray(synergyDef.requiredCount)) {
                isActive = isActive && synergyDef.requiredElement.every((el, idx) =>
                    (elementCounts[el] || 0) >= (synergyDef.requiredCount[idx] || 1)
                );
            } else {
                isActive = isActive && synergyDef.requiredElement.every(el =>
                    (elementCounts[el] || 0) >= (synergyDef.requiredCount || 1)
                );
            }
        } else if (synergyDef.requiredElement) {
            isActive = isActive && (elementCounts[synergyDef.requiredElement] || 0) >= (synergyDef.requiredCount || 1);
        }
        if (isActive) {
            activableSynergies.push({
                name: synergyName,
                priority: synergyDef.priority || 0 // priorité par défaut 0 si non définie
            });
        }
    }
    // DEBUG : Afficher les synergies activables
    console.log('Synergies activables:', activableSynergies.map(s => s.name));

    // Détection spéciale pour Duo/Doublon/Trio/Triplette
    // Chercher 2 ou 3 unités de même type/élément
    // On fait ça AVANT la boucle des synergies classiques
    let duoType = null, doublonElement = null, trioType = null, tripletteElement = null;
    // Comptage des types
    for (const [type, count] of Object.entries(typeCounts)) {
        if (count >= 2) duoType = type;
        if (count >= 3) trioType = type;
    }
    // Comptage des éléments
    for (const [el, count] of Object.entries(elementCounts)) {
        if (count >= 2) doublonElement = el;
        if (count >= 3) tripletteElement = el;
    }
    // Ajout des synergies spéciales si activées
    if (duoType) {
        activableSynergies.push({ name: 'Duo', priority: SYNERGY_DEFINITIONS['Duo'].priority });
    }
    if (doublonElement) {
        activableSynergies.push({ name: 'Doublon', priority: SYNERGY_DEFINITIONS['Doublon'].priority });
    }
    if (trioType) {
        activableSynergies.push({ name: 'Trio', priority: SYNERGY_DEFINITIONS['Trio'].priority });
    }
    if (tripletteElement) {
        activableSynergies.push({ name: 'Triplette', priority: SYNERGY_DEFINITIONS['Triplette'].priority });
    }

    // Si aucune synergie activable
    if (activableSynergies.length === 0) return [];

    // Sélectionner la synergie avec la priorité la plus haute (ou la première en cas d'égalité)
    activableSynergies.sort((a, b) => b.priority - a.priority);
    const selectedSynergyName = activableSynergies[0].name;
    const level = gameState.synergyLevels[selectedSynergyName] || 1;
    const synergyBonus = calculateSynergyBonus(selectedSynergyName, level);
    return [synergyBonus];
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
        
        // --- FUSION D'ÉLÉMENTS ---
        // Détecter les fusions d'éléments actives
        const fusionElements = [];
        if (bonusDesc.effects && Array.isArray(bonusDesc.effects)) {
            for (const effect of bonusDesc.effects) {
                if (effect.type === 'fusion_element') {
                    fusionElements.push(effect.elements);
                }
            }
        }
        // Fonction utilitaire pour savoir si deux éléments sont fusionnés
        function areElementsFused(el1, el2) {
            for (const fusion of fusionElements) {
                if (fusion.includes(el1) && fusion.includes(el2)) return true;
            }
            return false;
        }
        // Fonction utilitaire pour obtenir la "clé fusionnée" d'un élément
        function getFusionKey(element) {
            for (const fusion of fusionElements) {
                if (fusion.includes(element)) {
                    // Retourne la première valeur de la fusion comme clé commune
                    return fusion[0];
                }
            }
            return element;
        }
        // --- FIN FUSION D'ÉLÉMENTS ---

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
                damage: 25 * count, 
                multiplier: 5 * count, 
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
        // Bonus de position (4ème position)
        else if (bonusId === 'position_quatre') {
            // Calculer le multiplicateur : 2 + (count - 1) * 0.5, arrondi au supérieur
            // 1 exemplaire = 2, 2 exemplaires = 3, 3 exemplaires = 3, 4 exemplaires = 4, etc.
            const positionMultiplier = Math.ceil(2 + (count - 1) * 1);
            const positionBonus = { 
                name: bonusDesc.name,
                positionMultiplier: positionMultiplier, 
                target: 'fourth_position',
                type: 'position_bonus'
            };
            bonuses.push(positionBonus);
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
        // Bonus multiplicateur pour chaque élément
        else if (bonusId === 'bonus_feu' || bonusId === 'bonus_eau' || bonusId === 'bonus_terre' || bonusId === 'bonus_air' || bonusId === 'bonus_lumiere' || bonusId === 'bonus_tenebre') {
            bonuses.push({
                name: bonusDesc.name,
                multiplier: 4 * count,
                target: bonusDesc.effects[0].target
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
    const dynamicBonusesWithTriggers = ['cac_cest_la_vie', 'economie_dune_vie', 'position_quatre'];
    
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
    syncDynamicBonus(gameState);
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
    
    // Appliquer les bonus de position en dernier (après tous les autres bonus)
    if (bonusCounts['position_quatre']) {
        // Ce bonus sera appliqué dans calculateTurnDamage pour s'assurer qu'il s'applique en dernier
    }
} 