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

// Afficher les troupes dans le header
export function updateTroopsDisplay(gameState) {
    const troopsContainer = document.getElementById('troops-display');
    if (!troopsContainer) return;

    troopsContainer.innerHTML = '';

    // Créer un pool complet de toutes les troupes disponibles
    const fullTroopPool = [];
    
    // Utiliser ownedUnits pour les quantités réelles
    // Parcourir toutes les unités de BASE_UNITS, pas seulement celles avec quantity > 0
    BASE_UNITS.forEach(unit => {
        const quantity = gameState.ownedUnits[unit.name] || unit.quantity || 0;
        if (quantity > 0) {
            for (let i = 0; i < quantity; i++) {
                fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
            }
        }
    });

    // Ajouter les troupes achetées dans le magasin
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
                type: troop.unitType || troop.type,
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

    // Créer les icônes pour chaque type de troupe
    Object.keys(troopsByType).forEach(troopName => {
        const troopData = troopsByType[troopName];
        if (troopData.count > 0) {
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
            
            troopsContainer.appendChild(troopElement);
        }
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
        console.log('Debug drawCombatTroops - Troupes existantes préservées:', gameState.combatTroops.length);
        gameState.updateTroopsUI();
        return;
    }
    
    gameState.combatTroops = [];
    // Ne pas vider selectedTroops ici, seulement les troupes de combat
    // gameState.selectedTroops = [];
    
    // Créer un pool de troupes avec toutes les unités possédées (ownedUnits)
    const troopPool = [];
    BASE_UNITS.forEach(unit => {
        const quantity = gameState.ownedUnits[unit.name] || unit.quantity || 0;
        for (let i = 0; i < quantity; i++) {
            troopPool.push({...unit, id: `${unit.name}_${i}`});
        }
    });
    

    
    // Tirer 7 troupes aléatoirement
    for (let i = 0; i < 7 && troopPool.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * troopPool.length);
        gameState.combatTroops.push(troopPool.splice(randomIndex, 1)[0]);
    }
    
    console.log('Debug drawCombatTroops - Troupes créées:', gameState.combatTroops.length);
    gameState.updateTroopsUI();
} 

// Maintenir 7 troupes disponibles en tirant de nouvelles troupes
export function maintainCombatTroops(gameState) {
    // Créer un pool complet de troupes avec toutes les unités possédées (ownedUnits)
    const fullTroopPool = [];
    BASE_UNITS.forEach(unit => {
        const quantity = gameState.ownedUnits[unit.name] || unit.quantity || 0;
        for (let i = 0; i < quantity; i++) {
            fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
        }
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

// Sélectionner une troupe pour le combat (max 5)
export function selectTroopForCombat(troopIndex, gameState) {
    if (gameState.selectedTroops.length >= 5) {
        gameState.showNotification('Vous ne pouvez sélectionner que 5 troupes maximum !', 'error');
        return;
    }
    
    // Obtenir toutes les troupes disponibles
    const allAvailableTroops = [...gameState.combatTroops, ...gameState.availableTroops];
    
    if (troopIndex >= 0 && troopIndex < allAvailableTroops.length) {
        const troop = allAvailableTroops[troopIndex];
        
        // Vérifier si la troupe n'est pas déjà sélectionnée
        const alreadySelected = gameState.selectedTroops.some(t => t.id === troop.id);
        if (alreadySelected) {
            gameState.showNotification('Cette troupe est déjà sélectionnée !', 'error');
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
    console.log('Debug updateTroopsUI:', {
        combatTroops: gameState.combatTroops.length,
        availableTroops: gameState.availableTroops.length,
        selectedTroops: gameState.selectedTroops.length,
        allAvailableTroops: allAvailableTroops.length
    });
    
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

// Créer une carte de troupe
export function createTroopCard(troop, index, isSelected, gameState) {
    const card = document.createElement('div');
    const isUsed = gameState.usedTroopsThisRank.includes(troop.id);
    
    // Ajouter la classe de rareté
    const rarityClass = troop.rarity ? `rarity-${troop.rarity}` : '';
    const classes = ['unit-card'];
    if (isSelected) classes.push('selected');
    if (isUsed) classes.push('used');
    if (rarityClass) classes.push(rarityClass);
    card.className = classes.join(' ');
    
    // Debug: afficher les informations de rareté
    console.log(`Création carte pour ${troop.name}:`, {
        rarity: troop.rarity,
        rarityClass: rarityClass,
        finalClassName: card.className
    });
    
    // Forcer l'application du background de rareté via style inline
    if (troop.rarity) {
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
    
    // Afficher les types (gère les types multiples)
    const typeDisplay = getTypeDisplayString(troop.type);
    
    card.innerHTML = `
        <div class="unit-icon">${troop.icon}</div>
        <div class="unit-name">${troop.name}</div>
        <div class="unit-stats"><span class="unit-damage">${troop.damage}</span> × <span class="unit-multiplier">${troop.multiplier}</span></div>
        <div class="unit-type">${typeDisplay}</div>
        ${troop.rarity ? `<div class="unit-rarity" style="color: ${getRarityColor(troop.rarity)}; font-weight: 600; margin-top: 5px; font-size: 0.8rem;">
            ${getRarityIcon(troop.rarity)} ${getRarityDisplayName(troop.rarity)}
        </div>` : ''}
        ${isUsed ? '<div class="unit-used">Utilisée</div>' : ''}
    `;

    card.addEventListener('click', () => {
        if (isUsed) {
            gameState.showNotification('Cette troupe a déjà été utilisée dans ce rang !', 'error');
            return;
        }
        
        if (isSelected) {
            // Trouver l'index dans selectedTroops pour la désélection
            const selectedIndex = gameState.selectedTroops.findIndex(t => t.id === troop.id);
            if (selectedIndex !== -1) {
                gameState.deselectTroopFromCombat(selectedIndex);
            }
        } else {
            gameState.selectTroopForCombat(index);
        }
    });

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
    
    console.log('Troupes sélectionnées pour les synergies:', troopsToAnalyze.length);
    
    // Si aucune troupe n'est sélectionnée, afficher un message
    if (troopsToAnalyze.length === 0) {
        synergiesContainer.innerHTML = '<p class="no-synergies">Sélectionnez des unités pour voir les synergies</p>';
        return;
    }

    const synergies = gameState.calculateSynergies(troopsToAnalyze);
    console.log('Synergies calculées:', synergies);
    
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
                console.log(`🎯 calculateDynamicBonus: Compteur récupéré depuis sauvegarde pour ${bonusId}.${effect.triggerSynergy} = ${triggerCount}`);
            } else {
                // Fallback vers le compteur local si pas de sauvegarde
                triggerCount = effect.triggerCount || 0;
                console.log(`🎯 calculateDynamicBonus: Compteur local utilisé pour ${bonusId}.${effect.triggerSynergy} = ${triggerCount}`);
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
                console.log(`🎯 calculateDynamicBonus: Compteur fin de combat récupéré pour ${bonusId} = ${triggerCount}`);
            } else {
                // Fallback vers le compteur local si pas de sauvegarde
                triggerCount = effect.triggerCount || 0;
                console.log(`🎯 calculateDynamicBonus: Compteur fin de combat local utilisé pour ${bonusId} = ${triggerCount}`);
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
                    console.log(`🎯 syncDynamicBonusTriggers: ${bonusId}.${triggerSynergy} synchronisé de ${currentTriggerCount} à ${newTriggerCount} (${count} exemplaires possédés)`);
                }
            }
        });
    });
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