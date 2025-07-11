// Gestion centralisée des unités pour GuildMaster
import { BASE_UNITS } from './UnitConstants.js';
import { ALL_UNITS } from './UnitConstants.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { getRarityDisplayName, getRarityColor, getRarityIcon } from './RarityUtils.js';

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
    
    // Ne plus modifier BASE_UNITS, seulement ownedUnits
    // Les unités spéciales restent dans BASE_UNITS avec quantity = 0
    // mais sont comptées via ownedUnits
} 

// Extraire la création du pool complet de troupes
function createFullTroopPool(gameState) {
    const fullTroopPool = [];
    
    // Utiliser ownedUnits pour les quantités réelles
    BASE_UNITS.forEach(unit => {
        const quantity = gameState.ownedUnits[unit.name] || unit.quantity || 0;
        if (quantity > 0) {
            for (let i = 0; i < quantity; i++) {
                fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
            }
        }
    });

    // Ajouter les troupes achetées dans le magasin
    return [
        ...fullTroopPool,
        ...gameState.availableTroops
    ];
}

// Extraire le groupement des troupes par type
function groupTroopsByType(allTroops) {
    const troopsByType = {};
    allTroops.forEach(troop => {
        if (!troopsByType[troop.name]) {
            troopsByType[troop.name] = {
                count: 0,
                damage: troop.damage,
                multiplier: troop.multiplier,
                type: troop.unitType || troop.type,
                icon: troop.icon,
                rarity: troop.rarity
            };
        }
        troopsByType[troop.name].count++;
    });
    return troopsByType;
}

// Extraire l'ajustement des compteurs pour les unités transformées
function adjustTransformedUnitsCount(troopsByType, gameState) {
    Object.keys(gameState.transformedBaseUnits).forEach(unitName => {
        if (troopsByType[unitName]) {
            troopsByType[unitName].count = Math.max(0, troopsByType[unitName].count - gameState.transformedBaseUnits[unitName]);
        }
    });
}

// Extraire la création d'une icône de troupe avec tooltip
function createTroopIcon(troopName, troopData) {
    const rarityClass = troopData.rarity ? `rarity-${troopData.rarity}` : '';
    const classes = ['troop-icon-header'];
    if (rarityClass) classes.push(rarityClass);
    
    const troopElement = document.createElement('div');
    troopElement.className = classes.join(' ');
    troopElement.setAttribute('data-count', troopData.count);
    troopElement.setAttribute('data-troop-name', troopName);
    
    const typeDisplay = getTypeDisplayString(troopData.type);
    const rarityDisplay = troopData.rarity ? getRarityDisplayName(troopData.rarity) : '';
    
    // Chiffres colorés pour dégâts et multiplicateur
    const damageColored = `<span class='troop-damage-tooltip'>${troopData.damage}</span>`;
    const multiColored = `<span class='troop-mult-tooltip'>${troopData.multiplier}</span>`;
    
    // Créer le tooltip avec les informations de l'unité
    const tooltipContent = `
        <strong>${troopName}</strong><br>
        ${damageColored} × ${multiColored}<br>
        🏷️ ${typeDisplay}<br>
        ${rarityDisplay ? `⭐ ${rarityDisplay}` : ''}
    `;
    
    troopElement.innerHTML = `
        ${troopData.icon}
        <div class="troop-tooltip">${tooltipContent}</div>
    `;
    
    return troopElement;
}

// Extraire la création de toutes les icônes de troupes
function createTroopIcons(troopsByType) {
    const troopElements = [];
    
    Object.keys(troopsByType).forEach(troopName => {
        const troopData = troopsByType[troopName];
        if (troopData.count > 0) {
            const troopElement = createTroopIcon(troopName, troopData);
            troopElements.push(troopElement);
        }
    });
    
    return troopElements;
}

// Afficher les troupes dans le header
export function updateTroopsDisplay(gameState) {
    const troopsContainer = document.getElementById('troops-display');
    if (!troopsContainer) return;

    troopsContainer.innerHTML = '';

    // Créer un pool complet de toutes les troupes disponibles
    const allTroops = createFullTroopPool(gameState);

    // Grouper les troupes par nom
    const troopsByType = groupTroopsByType(allTroops);

    // Ajuster les compteurs pour les unités de base transformées
    adjustTransformedUnitsCount(troopsByType, gameState);

    // Créer les icônes pour chaque type de troupe
    const troopElements = createTroopIcons(troopsByType);
    
    // Ajouter les éléments au conteneur
    troopElements.forEach(element => {
        troopsContainer.appendChild(element);
    });
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
    // Ne pas vider selectedTroops ici, seulement les troupes de combat
    // gameState.selectedTroops = [];
    
    // Créer un pool de troupes avec toutes les unités possédées (ownedUnits)
    const troopPool = [];
    BASE_UNITS.forEach(unit => {
        // Calculer la quantité disponible en tenant compte des transformations
        let quantity = gameState.ownedUnits[unit.name] || unit.quantity || 0;
        
        // Retirer les unités transformées
        const transformedCount = gameState.transformedBaseUnits[unit.name] || 0;
        quantity = Math.max(0, quantity - transformedCount);
        
        // Ajouter seulement les unités non transformées
        for (let i = 0; i < quantity; i++) {
            troopPool.push({...unit, id: `${unit.name}_${i}`});
        }
    });
    
    // Ajouter les unités achetées/transformées depuis availableTroops
    gameState.availableTroops.forEach(troop => {
        troopPool.push({...troop});
    });
    

    
    // Tirer 7 troupes aléatoirement
    for (let i = 0; i < 7 && troopPool.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * troopPool.length);
        gameState.combatTroops.push(troopPool.splice(randomIndex, 1)[0]);
    }
    
            gameState.updateTroopsUI();
} 

// Maintenir 7 troupes disponibles en tirant de nouvelles troupes
export function maintainCombatTroops(gameState) {
    // Créer un pool complet de troupes avec toutes les unités possédées (ownedUnits)
    const fullTroopPool = [];
    BASE_UNITS.forEach(unit => {
        // Calculer la quantité disponible en tenant compte des transformations
        let quantity = gameState.ownedUnits[unit.name] || unit.quantity || 0;
        
        // Retirer les unités transformées
        const transformedCount = gameState.transformedBaseUnits[unit.name] || 0;
        quantity = Math.max(0, quantity - transformedCount);
        
        // Ajouter seulement les unités non transformées
        for (let i = 0; i < quantity; i++) {
            fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
        }
    });
    
    // Ajouter les unités achetées/transformées depuis availableTroops
    gameState.availableTroops.forEach(troop => {
        fullTroopPool.push({...troop});
    });
    

    
    // Retirer les troupes déjà utilisées dans ce rang
    const availableTroops = fullTroopPool.filter(troop => 
        !gameState.usedTroopsThisRank.includes(troop.id)
    );
    
    // Retirer les troupes déjà dans le pool de combat
    const remainingTroops = availableTroops.filter(troop => 
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
        const isNotUsed = !gameState.usedTroopsThisRank.includes(troop.id);
        return isInCombatPool && isNotUsed;
    });
    
    if (troopsToReroll.length === 0) {
        gameState.notificationManager.showNotification('Aucune troupe sélectionnée peut être relancée !', 'warning');
        return;
    }
    
    // Créer un pool de troupes disponibles pour les remplacements
    const availablePool = [];
    BASE_UNITS.forEach(unit => {
        // Calculer la quantité disponible en tenant compte des transformations
        let quantity = gameState.ownedUnits[unit.name] || unit.quantity || 0;
        
        // Retirer les unités transformées
        const transformedCount = gameState.transformedBaseUnits[unit.name] || 0;
        quantity = Math.max(0, quantity - transformedCount);
        
        // Ajouter seulement les unités non transformées
        for (let i = 0; i < quantity; i++) {
            availablePool.push({...unit, id: `${unit.name}_${i}`});
        }
    });
    
    // Ajouter les unités achetées/transformées depuis availableTroops
    gameState.availableTroops.forEach(troop => {
        availablePool.push({...troop});
    });
    
    // Retirer les troupes déjà dans le pool de combat
    const remainingTroops = availablePool.filter(t => 
        !gameState.combatTroops.some(combatTroop => combatTroop.id === t.id)
    );
    
    // Retirer les troupes déjà utilisées dans ce rang
    const unusedTroops = remainingTroops.filter(t => 
        !gameState.usedTroopsThisRank.includes(t.id)
    );
    
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
        
        // Ajouter la troupe relancée à la liste des troupes utilisées dans ce rang
        gameState.usedTroopsThisRank.push(troop.id);
        
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
    
    // Obtenir toutes les troupes disponibles
    const allAvailableTroops = [...gameState.combatTroops, ...gameState.availableTroops];
    
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
        
        // Si c'est une unité achetée/transformée (permanente), la remettre seulement dans availableTroops
        if (isPermanentUnit(usedTroop)) {
            // Vérifier qu'elle n'est pas déjà dans availableTroops
            const existingAvailableIndex = gameState.availableTroops.findIndex(troop => troop.id === usedTroop.id);
            if (existingAvailableIndex === -1) {
                gameState.availableTroops.push(usedTroop);
            }
            // NE PAS remettre dans combatTroops pour éviter qu'elle apparaisse automatiquement
        }
    });
    
    // Maintenir 7 troupes disponibles en ajoutant de nouvelles troupes (seulement pour les unités temporaires)
    maintainCombatTroops(gameState);
    
    gameState.updateTroopsUI();
    gameState.updateSynergies();
} 

// Mettre à jour l'interface des troupes disponibles
export function updateTroopsUI(gameState) {
    const availableContainer = document.getElementById('available-troops');
    if (!availableContainer) {
        console.error('Containers non trouvés');
        return;
    }
    availableContainer.innerHTML = '';
    

    
    // Afficher toutes les troupes disponibles (combat + achetées)
    const allAvailableTroops = [...gameState.combatTroops, ...gameState.availableTroops]

    
    allAvailableTroops.forEach((troop, index) => {
        // Vérifier si cette troupe est sélectionnée
        const isSelected = gameState.selectedTroops.some(selectedTroop => selectedTroop.id === troop.id);
        const troopCard = createTroopCard(troop, index, isSelected, gameState);
        availableContainer.appendChild(troopCard);
    });

    // Mettre à jour les titres des sections (sans le nombre de troupes disponibles)
    const availableTitle = availableContainer.parentElement.querySelector('h4');
    
    if (availableTitle) {
        availableTitle.textContent = `Troupes Disponibles`;
    }
}

// Extraire la logique de création des classes CSS pour les cartes de troupes
function createTroopCardClasses(troop, isSelected, isUsed) {
    const classes = ['unit-card'];
    if (isSelected) classes.push('selected');
    if (isUsed) classes.push('used');
    if (troop.rarity) classes.push(`rarity-${troop.rarity}`);
    return classes.join(' ');
}

// Extraire la logique de style de rareté
function applyRarityStyling(card, troop) {
    if (!troop.rarity) return;
    
    const rarityColors = {
        'common': 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(102, 102, 102, 0.05) 100%)',
        'uncommon': 'linear-gradient(135deg, rgba(0, 184, 148, 0.1) 0%, rgba(0, 184, 148, 0.05) 100%)',
        'rare': 'linear-gradient(135deg, rgba(116, 185, 255, 0.1) 0%, rgba(116, 185, 255, 0.05) 100%)',
        'epic': 'linear-gradient(135deg, rgba(162, 155, 254, 0.1) 0%, rgba(162, 155, 254, 0.05) 100%)',
        'legendary': 'linear-gradient(135deg, rgba(253, 203, 110, 0.1) 0%, rgba(253, 203, 110, 0.05) 100%)'
    };
    
    card.style.background = rarityColors[troop.rarity];
    card.style.borderColor = getRarityColor(troop.rarity);
}

// Extraire la génération du HTML de la carte
function generateTroopCardHTML(troop, isUsed) {
    const typeDisplay = getTypeDisplayString(troop.type);
    const rarityHTML = troop.rarity ? 
        `<div class="unit-rarity" style="color: ${getRarityColor(troop.rarity)}; font-weight: 600; margin-top: 5px; font-size: 0.8rem;">
            ${getRarityIcon(troop.rarity)} ${getRarityDisplayName(troop.rarity)}
        </div>` : '';
    
    const usedHTML = isUsed ? '<div class="unit-used">Utilisée</div>' : '';
    
    return `
        <div class="unit-icon">${troop.icon}</div>
        <div class="unit-name">${troop.name}</div>
        <div class="unit-stats"><span class="unit-damage">${troop.damage}</span> × <span class="unit-multiplier">${troop.multiplier}</span></div>
        <div class="unit-type">${typeDisplay}</div>
        ${rarityHTML}
        ${usedHTML}
    `;
}

// Extraire la logique d'événements de la carte
function attachTroopCardEvents(card, troop, troopId, isSelected, isUsed, gameState) {
    card.addEventListener('click', () => {
        if (isUsed) {
            gameState.notificationManager.showUnitUsedError('Cette troupe a déjà été utilisée dans ce rang !');
            return;
        }
        
        if (isSelected) {
            // Trouver l'index dans selectedTroops pour la désélection
            const selectedIndex = gameState.selectedTroops.findIndex(t => t.id === troop.id);
            if (selectedIndex !== -1) {
                gameState.deselectTroopFromCombat(selectedIndex);
            }
        } else {
            // Utiliser l'ID de la troupe pour la sélection
            gameState.selectTroopById(troop.id);
        }
    });
}

export function createTroopCard(troop, index, isSelected, gameState) {
    const card = document.createElement('div');
    const isUsed = gameState.usedTroopsThisRank.includes(troop.id);
    
    // Appliquer les classes CSS
    card.className = createTroopCardClasses(troop, isSelected, isUsed);
    

    
    // Appliquer le style de rareté
    applyRarityStyling(card, troop);
    
    // Générer le HTML
    card.innerHTML = generateTroopCardHTML(troop, isUsed);
    
    // Attacher les événements
    attachTroopCardEvents(card, troop, index, isSelected, isUsed, gameState);

    return card;
} 

// Mettre à jour l'affichage des synergies
export function updateSynergies(gameState) {
    const synergiesContainer = document.getElementById('synergies-display');
    if (!synergiesContainer) {
        console.warn('Container synergies-display non trouvé');
        return;
    }

    // Vider le conteneur AVANT d'ajouter de nouveaux éléments
    synergiesContainer.innerHTML = '';

    // Utiliser UNIQUEMENT les troupes sélectionnées pour les synergies
    let troopsToAnalyze = gameState.selectedTroops;
    
    // Si aucune troupe n'est sélectionnée, afficher un message
    if (troopsToAnalyze.length === 0) {
        synergiesContainer.innerHTML = '<p class="no-synergies">Sélectionnez des unités pour voir les synergies</p>';
        return;
    }

    const synergies = gameState.calculateSynergies(troopsToAnalyze);
    
    if (synergies.length === 0) {
        synergiesContainer.innerHTML = '<p class="no-synergies">Aucune synergie active avec cette composition</p>';
        return;
    }

    // Ajouter les synergies une par une
    synergies.forEach(synergy => {
        const synergyElement = document.createElement('div');
        synergyElement.className = 'synergy-item';
        synergyElement.innerHTML = `
            <div class="synergy-name">${synergy.name}</div>
            <div class="synergy-effect">${synergy.description}</div>
        `;
        synergiesContainer.appendChild(synergyElement);
    });
} 

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

    // --- SYNERGIE SOIGNEUR ---
    const healerCount = typeCounts['Soigneur'] || 0;
    if (healerCount > 0) {
        synergies.push({
            name: 'Présence de Soigneur',
            description: `+${healerCount} dégâts pour toute l'équipe (Soigneur)`,
            bonus: { damage: healerCount, target: 'all' },
            level: healerCount
        });
    }

    // --- SAINTE TRINITÉ ---
    const meleeCount = typeCounts['Corps à corps'] || 0;
    const rangedCount = typeCounts['Distance'] || 0;
    if (meleeCount >= 1 && rangedCount >= 1 && healerCount >= 1) {
        synergies.push({
            name: 'Sainte Trinité',
            description: '+2 dégâts et +2 multiplicateur pour toute l\'équipe',
            bonus: { damage: 2, multiplier: 2, target: 'all' },
            level: 1
        });
    }

    // Synergies de base (augmentées)
    if (typeCounts['Corps à corps'] >= 3) {
        const level = gameState.synergyLevels['Formation Corps à Corps'] || 1;
        const multiplierBonus = 2 + (level - 1); // +2 au niveau 1, +3 au niveau 2, etc.
        synergies.push({
            name: 'Formation Corps à Corps',
            description: `+${multiplierBonus} multiplicateur pour toutes les unités corps à corps (Niveau ${level})`,
            bonus: { multiplier: multiplierBonus, target: 'Corps à corps' },
            level: level
        });
    }
    
    if (typeCounts['Distance'] >= 3) {
        const level = gameState.synergyLevels['Formation Distance'] || 1;
        const multiplierBonus = 3 + (level - 1); // +3 au niveau 1, +4 au niveau 2, etc.
        synergies.push({
            name: 'Formation Distance',
            description: `+${multiplierBonus} multiplicateur pour toutes les unités distance (Niveau ${level})`,
            bonus: { multiplier: multiplierBonus, target: 'Distance' },
            level: level
        });
    }
    
    if (typeCounts['Magique'] >= 3) {
        const level = gameState.synergyLevels['Formation Magique'] || 1;
        const multiplierBonus = 4 + (level - 1); // +4 au niveau 1, +5 au niveau 2, etc.
        synergies.push({
            name: 'Formation Magique',
            description: `+${multiplierBonus} multiplicateur pour toutes les unités magiques (Niveau ${level})`,
            bonus: { multiplier: multiplierBonus, target: 'Magique' },
            level: level
        });
    }

    // Synergies avancées (nouvelles et plus puissantes)
    if (typeCounts['Corps à corps'] >= 5) {
        const level = gameState.synergyLevels['Horde Corps à Corps'] || 1;
        const damageBonus = 5 + (level - 1); // +5 au niveau 1, +6 au niveau 2, etc.
        const multiplierBonus = 3 + (level - 1); // +3 au niveau 1, +4 au niveau 2, etc.
        synergies.push({
            name: 'Horde Corps à Corps',
            description: `+${damageBonus} dégâts et +${multiplierBonus} multiplicateur pour toutes les unités corps à corps (Niveau ${level})`,
            bonus: { damage: damageBonus, multiplier: multiplierBonus, target: 'Corps à corps' },
            level: level
        });
    }
    
    if (typeCounts['Distance'] >= 5) {
        const level = gameState.synergyLevels['Volée de Flèches'] || 1;
        const damageBonus = 8 + (level - 1); // +8 au niveau 1, +9 au niveau 2, etc.
        const multiplierBonus = 4 + (level - 1); // +4 au niveau 1, +5 au niveau 2, etc.
        synergies.push({
            name: 'Volée de Flèches',
            description: `+${damageBonus} dégâts et +${multiplierBonus} multiplicateur pour toutes les unités distance (Niveau ${level})`,
            bonus: { damage: damageBonus, multiplier: multiplierBonus, target: 'Distance' },
            level: level
        });
    }
    
    if (typeCounts['Magique'] >= 5) {
        const level = gameState.synergyLevels['Tempête Magique'] || 1;
        const damageBonus = 10 + (level - 1); // +10 au niveau 1, +11 au niveau 2, etc.
        const multiplierBonus = 5 + (level - 1); // +5 au niveau 1, +6 au niveau 2, etc.
        synergies.push({
            name: 'Tempête Magique',
            description: `+${damageBonus} dégâts et +${multiplierBonus} multiplicateur pour toutes les unités magiques (Niveau ${level})`,
            bonus: { damage: damageBonus, multiplier: multiplierBonus, target: 'Magique' },
            level: level
        });
    }

    // Synergies mixtes (nouvelles)
    if (typeCounts['Corps à corps'] >= 3 && typeCounts['Distance'] >= 3) {
        const level = gameState.synergyLevels['Tactique Mixte'] || 1;
        const damageBonus = 3 + (level - 1); // +3 au niveau 1, +4 au niveau 2, etc.
        synergies.push({
            name: 'Tactique Mixte',
            description: `+${damageBonus} dégâts pour toutes les unités (Niveau ${level})`,
            bonus: { damage: damageBonus, target: 'all' },
            level: level
        });
    }
    
    if (typeCounts['Physique'] >= 6) {
        const level = gameState.synergyLevels['Force Physique'] || 1;
        const damageBonus = 4 + (level - 1); // +4 au niveau 1, +5 au niveau 2, etc.
        synergies.push({
            name: 'Force Physique',
            description: `+${damageBonus} dégâts pour toutes les unités physiques (Niveau ${level})`,
            bonus: { damage: damageBonus, target: 'Physique' },
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
            // Effet de base : toujours appliqué
            totalValue += effect.value;
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
                console.log(`🎯 calculateDynamicBonus: Compteur récupéré depuis sauvegarde pour ${bonusId}.${effect.triggerSynergy} = ${triggerCount}`);
            } else {
                // Fallback vers le compteur local si pas de sauvegarde
                triggerCount = effect.triggerCount || 0;
                console.log(`🎯 calculateDynamicBonus: Compteur local utilisé pour ${bonusId}.${effect.triggerSynergy} = ${triggerCount}`);
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
    
        return null;
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
            console.log(`🎯 incrementDynamicBonusTrigger: Déjà incrémenté ce round pour ${bonusId}.${triggerSynergy}`);
            return;
        }
        
        // Récupérer le compteur actuel depuis les états sauvegardés
        let currentCount = 0;
        if (gameState.dynamicBonusStates && 
            gameState.dynamicBonusStates[bonusId] && 
            gameState.dynamicBonusStates[bonusId][triggerSynergy]) {
            currentCount = gameState.dynamicBonusStates[bonusId][triggerSynergy];
            console.log(`🎯 incrementDynamicBonusTrigger: Compteur actuel depuis sauvegarde = ${currentCount}`);
        } else {
            currentCount = triggerEffect.triggerCount || 0;
            console.log(`🎯 incrementDynamicBonusTrigger: Compteur actuel depuis effet = ${currentCount}`);
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
        
        console.log(`🎯 Bonus dynamique "${bonusDesc.name}" : compteur incrémenté de ${currentCount} à ${newCount} (synergie "${triggerSynergy}" - round ${gameState.currentCombat.round || 1})`);
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