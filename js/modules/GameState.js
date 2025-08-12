// Classe GameState en ES6
import { RANKS, BOSS_RANKS, INFINITE_RANKS, INFINITE_BOSS_RANKS, formatLargeNumber, isInfiniteRank, getNextInfiniteRank } from './constants/combat/GameConstants.js';
import { BASE_DAMAGE, DAMAGE_INCREMENT_PER_RANK, RANK_MULTIPLIERS, getMajorRank } from './constants/combat/GameConstants.js';
import { BASE_UNITS, ALL_UNITS, getRandomElement } from './constants/units/UnitConstants.js';
import { BONUS_DESCRIPTIONS } from './constants/shop/BonusConstants.js';
import { DEFAULT_SYNERGY_LEVELS } from './constants/synergies/SynergyConstants.js';
import { BOSSES } from './constants/boss/BossConstants.js';
import { getBaseUnits, getShopUnits, getAllAvailableTroops, getOwnedUnits, loadOwnedUnits, addTroop, drawCombatTroops, maintainCombatTroops, isPermanentUnit, selectTroopForCombat, deselectTroopFromCombat, removeUsedTroopsFromCombat, hasTroopType, calculateSynergies, calculateEquipmentBonuses, applyCombatBonuses, incrementDynamicBonusTrigger, syncDynamicBonusTriggers, clearUnitCache } from './UnitManager.js';
import { UnitSorter } from './UnitSorter.js';
import { unlockBonus, cleanInvalidBonuses, getBonusDescriptions, updateActiveBonuses } from './ShopManager.js';
import { ModalManager } from './ModalManager.js';
import { CombatManager } from './CombatManager.js';
import { UIManager } from './UIManager.js';
import { ProgressManager } from './ProgressManager.js';
import { StatisticsManager } from './StatisticsManager.js';
import { EventManager } from './EventManager.js';
import { DebugManager } from './DebugManager.js';
import { BossManager } from './BossManager.js';
import { AnimationManager } from './AnimationManager.js';
import { CombatCalculator } from './CombatCalculator.js';
import { NotificationManager } from './NotificationManager.js';
import { SaveManager } from './SaveManager.js';
import { ConsumableManager } from './ConsumableManager.js';
import { ShopManager } from './ShopManager.js';
import { getRarityIcon, getRarityColor, getRarityDisplayName } from './constants/game/RarityUtils.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { getEnemyData, getEnemyImage, getEnemyName } from './constants/combat/GameConstants.js';

export class GameState {
    constructor() {
        this.rank = 'F-';
        this.rankProgress = 0;
        this.rankTarget = 100;
        this.gold = 100;
        this.guildName = 'Guilde d\'Aventuriers'; // Nom de la guilde modifiable
        this.availableTroops = [];
        this.selectedTroops = [];
        this.combatTroops = []; // Troupes tirées pour le combat
        this.usedTroopsThisCombat = []; // Troupes utilisées dans ce combat
        
        // NOUVEAU : Pool global d'unités pour tout le jeu
        this.globalUnitPool = [];
        
        this.combatHistory = [];
        this.isFirstTime = true;
        this.unlockedBonuses = []; // Bonus débloqués via le magasin
        this.dynamicBonusStates = {}; // États des bonus dynamiques (compteurs, etc.)
        this.transformedBaseUnits = {}; // Unités de base transformées
        
        // Mode infini
        this.isInfiniteMode = false;
        this.infiniteCombatCount = 0; // Compteur de combats en mode infini
        this.infiniteRankIndex = 0; // Index du rang infini actuel
        
        // Initialiser les gestionnaires
        this.notificationManager = new NotificationManager();
        this.saveManager = new SaveManager();
        this.consumableManager = new ConsumableManager();
        this.shopManager = new ShopManager();
        this.unitSorter = new UnitSorter();
        this.bossManager = new BossManager(this);
        this.animationManager = new AnimationManager(this);
        this.combatManager = new CombatManager(this);
        this.combatCalculator = new CombatCalculator(this);
        this.uiManager = new UIManager(this);
        this.progressManager = new ProgressManager(this);
        this.statisticsManager = new StatisticsManager(this);
        this.eventManager = new EventManager(this);
        this.debugManager = new DebugManager(this);
        
        // État du combat actuel
        this.currentCombat = {
            targetDamage: 0,
            totalDamage: 0,
            round: 0,
            maxRounds: 5,
            isActive: false,
            isBossFight: false,
            bossName: '',
            bossMechanic: ''
        };
        

        
        // Système de consomables (géré par ConsumableManager)

        
        // Système de niveaux de synergies
        this.synergyLevels = { ...DEFAULT_SYNERGY_LEVELS };
        
        // Stockage des unités possédées (pour la sauvegarde)
        this.ownedUnits = {};
        // Initialiser les unités de base par défaut (chaque unité est un objet individuel avec son propre élément)
        this.getBaseUnits().forEach(unit => {
            if (unit.quantity > 0) {
                this.ownedUnits[unit.name] = [];
                for (let i = 0; i < unit.quantity; i++) {
                    // On clone l'objet de base et on lui donne un nouvel élément aléatoire
                    this.ownedUnits[unit.name].push({
                        ...unit,
                        element: getRandomElement()
                    });
                }
            }
        });
        
        // NOUVEAU : Initialiser le pool global d'unités
        this.initializeGlobalUnitPool();
    }

    // NOUVEAU : Initialiser le pool global d'unités au début de la partie
    initializeGlobalUnitPool() {
        this.globalUnitPool = [];
        
        // Remplir le pool avec les unités de base définies
        this.getBaseUnits().forEach(unit => {
            if (unit.quantity > 0) {
                for (let i = 0; i < unit.quantity; i++) {
                    const unitInstance = {
                        ...unit,
                        id: `${unit.name}_base_${i}`,
                        element: getRandomElement(),
                        isBaseUnit: true
                    };
                    this.globalUnitPool.push(unitInstance);
                }
            }
        });
        

        
        console.log(`Pool global initialisé avec ${this.globalUnitPool.length} unités`);
        
        // Initialiser les fonctions de debug
        this.setupDebugFunctions();
    }



    // NOUVEAU : Ajouter une unité au pool global (achat, transformation, duplication)
    addUnitToGlobalPool(unit) {
        // Générer un ID unique pour cette unité
        const uniqueId = `${unit.name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const unitWithId = {
            ...unit,
            id: uniqueId
        };
        
        this.globalUnitPool.push(unitWithId);
        console.log(`Unité ajoutée au pool global: ${unit.name} d'${unit.element || 'élément inconnu'}`);
        
        // Mettre à jour l'interface si nécessaire
        if (this.updateTroopsUI) {
            this.updateTroopsUI();
        }
    }

    // NOUVEAU : Retirer une unité du pool global
    removeUnitFromGlobalPool(unitId) {
        const index = this.globalUnitPool.findIndex(unit => unit.id === unitId);
        if (index !== -1) {
            const removedUnit = this.globalUnitPool.splice(index, 1)[0];
            console.log(`Unité retirée du pool global: ${removedUnit.name}`);
            return removedUnit;
        }
        return null;
    }

    // NOUVEAU : Obtenir le pool de combat disponible (excluant les unités utilisées)
    getAvailableCombatPool() {
        return this.globalUnitPool.filter(unit => 
            !this.usedTroopsThisCombat.includes(unit.id)
        );
    }

    // NOUVEAU : Tirer 7 unités aléatoirement du pool global pour le combat
    drawCombatTroopsFromGlobalPool() {
        this.combatTroops = [];
        const availablePool = this.getAvailableCombatPool();
        
        // Tirer 7 unités aléatoirement
        for (let i = 0; i < 7 && availablePool.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availablePool.length);
            const selectedUnit = availablePool.splice(randomIndex, 1)[0];
            this.combatTroops.push(selectedUnit);
        }
        
        console.log(`7 unités tirées du pool global pour le combat: ${this.combatTroops.map(u => u.name).join(', ')}`);
        
        // Mettre à jour l'interface
        if (this.updateTroopsUI) {
            this.updateTroopsUI();
        }
    }

    // NOUVEAU : Marquer une unité comme utilisée dans ce combat
    markUnitAsUsed(unitId) {
        if (!this.usedTroopsThisCombat.includes(unitId)) {
            this.usedTroopsThisCombat.push(unitId);
            console.log(`Unité marquée comme utilisée: ${unitId}`);
        }
    }

    // NOUVEAU : Réinitialiser les unités utilisées pour un nouveau combat
    resetUsedUnitsForNewCombat() {
        this.usedTroopsThisCombat = [];
        console.log('Liste des unités utilisées réinitialisée pour le nouveau combat');
    }

    // Progression des rangs
    get RANKS() { return RANKS; }
    
    // Rangs qui déclenchent des combats de boss
    get BOSS_RANKS() { return BOSS_RANKS; }
    
    // Rangs infinis
    get INFINITE_RANKS() { return INFINITE_RANKS; }
    get INFINITE_BOSS_RANKS() { return INFINITE_BOSS_RANKS; }
    
    // Définition des unités de base
    get BASE_UNITS() { return BASE_UNITS; }

    // Fonction pour calculer les dégâts cibles selon le rang majeur
    calculateTargetDamageByRank(rank) {
        const rankIndex = this.RANKS.indexOf(rank);
        if (rankIndex === -1) {
            // Mode infini
            if (isInfiniteRank(rank)) {
                const infiniteIndex = this.INFINITE_RANKS.indexOf(rank);
                if (infiniteIndex !== -1) {
                    const baseDamage = BASE_DAMAGE + (infiniteIndex * DAMAGE_INCREMENT_PER_RANK * 10); // Augmentation exponentielle
                    return baseDamage * RANK_MULTIPLIERS[rank];
                }
            }
            return BASE_DAMAGE; // Valeur par défaut
        }
        
        const majorRank = getMajorRank(rank);
        const baseDamage = BASE_DAMAGE + (rankIndex * DAMAGE_INCREMENT_PER_RANK);
        return baseDamage * RANK_MULTIPLIERS[majorRank];
    }
    
    // Vitesse d'animation (1x, 2x, 4x)
    get animationSpeed() { return this._animationSpeed || 1; }
    set animationSpeed(value) { this._animationSpeed = value; }
    
    // Compteur de relances (limité à 3 par rang)
    get rerollCount() { return this._rerollCount || 0; }
    set rerollCount(value) { this._rerollCount = value; }
    
    // Calculer le nombre maximum de relances en tenant compte des bonus
    getMaxRerolls() {
        const baseRerolls = 3;
        let bonusRerolls = 0;
        
        // Compter les bonus de relance supplémentaire
        this.unlockedBonuses.forEach(bonusId => {
            if (bonusId === 'relance_supplementaire') {
                bonusRerolls += 1;
            }
        });
        
        return baseRerolls + bonusRerolls;
    }


    gainRank() {
        return this.progressManager.gainRank();
    }

    // Démarrer le mode infini
    startInfiniteMode() {
        this.isInfiniteMode = true;
        this.infiniteCombatCount = 0;
        this.infiniteRankIndex = 0;
        this.rank = this.INFINITE_RANKS[0]; // Commencer par S1
        
        // Réinitialiser les troupes et l'état du jeu
        this.usedTroopsThisCombat = [];
        this.rerollCount = 0;
        this.bossManager.resetForNewRank();
        this.drawCombatTroops();
        
        // Mettre à jour l'interface
        this.updateUI();
        
        // Démarrer le premier combat en mode infini
        this.startNewCombat();
    }

    // Gagner un rang en mode infini
    gainInfiniteRank() {
        this.infiniteCombatCount++;
        
        // Gagner un rang tous les 3 combats
        if (this.infiniteCombatCount % 3 === 0) {
            this.infiniteRankIndex++;
            if (this.infiniteRankIndex >= this.INFINITE_RANKS.length) {
                this.infiniteRankIndex = 0; // Retour au début
            }
            this.rank = this.INFINITE_RANKS[this.infiniteRankIndex];
            
            // Réinitialiser les troupes utilisées pour le nouveau rang
            this.usedTroopsThisCombat = [];
            
            // Réinitialiser le compteur de relances pour le nouveau rang
            this.rerollCount = 0;
            
            // Réinitialiser l'état du boss pour le nouveau rang
            this.bossManager.resetForNewRank();
            
            // Tirer de nouvelles troupes pour le nouveau rang
            this.drawCombatTroops();
            
            // Mettre à jour l'interface
            this.updateUI();
            
            this.notificationManager.showRankGained(this.rank);
        }
    }

    // Vérifier si c'est un combat de boss en mode infini
    isInfiniteBossFight() {
        if (!this.isInfiniteMode) return false;
        return this.infiniteCombatCount % 3 === 2; // 3ème combat de chaque cycle
    }

    // Formater les dégâts pour l'affichage
    formatDamageForDisplay(damage) {
        return formatLargeNumber(damage);
    }
    
    // Calculer les dégâts cibles pour le mode infini avec progression exponentielle
    calculateInfiniteTargetDamage() {
        // Base de dégâts pour le premier combat du rang S1
        const baseDamage = 800000; // 800k pour le premier combat S1
        
        // Calculer le multiplicateur basé sur le rang infini et le nombre de combats
        const rankIndex = INFINITE_RANKS.indexOf(this.rank);
        const combatInRank = this.infiniteCombatCount % 3; // 0, 1, ou 2 (3ème combat = boss)
        
        // Multiplicateur de rang : chaque rang multiplie par 2.5
        const rankMultiplier = Math.pow(2.5, rankIndex);
        
        // Multiplicateur de combat dans le rang : +25% par combat
        const combatMultiplier = 1 + (combatInRank * 0.25);
        
        // Calcul final
        const targetDamage = Math.round(baseDamage * rankMultiplier * combatMultiplier);
        
        console.log(`Infinite target damage: rank=${this.rank}, combatInRank=${combatInRank}, rankMultiplier=${rankMultiplier}, combatMultiplier=${combatMultiplier}, target=${targetDamage}`);
        
        return targetDamage;
    }

    // Sauvegarder l'état du mode infini
    saveInfiniteModeState() {
        return {
            isInfiniteMode: this.isInfiniteMode,
            infiniteCombatCount: this.infiniteCombatCount,
            infiniteRankIndex: this.infiniteRankIndex
        };
    }

    // Charger l'état du mode infini
    loadInfiniteModeState(state) {
        if (state.isInfiniteMode !== undefined) {
            this.isInfiniteMode = state.isInfiniteMode;
        }
        if (state.infiniteCombatCount !== undefined) {
            this.infiniteCombatCount = state.infiniteCombatCount;
        }
        if (state.infiniteRankIndex !== undefined) {
            this.infiniteRankIndex = state.infiniteRankIndex;
        }
    }

    // Démarrer un nouveau combat
    startNewCombat() {
        // Nettoyer le boss-malus-container de l'animation précédente
        if (this.uiManager) {
            this.uiManager.cleanBossMalusContainer();
        }
        
        // Réinitialiser complètement l'affichage de la mécanique de boss
        const combatProgressContainer = document.getElementById('combat-progress-container');
        if (combatProgressContainer) {
            // Supprimer tous les éléments de mécanique de boss existants
            const bossInfoElements = combatProgressContainer.querySelectorAll('.boss-info');
            bossInfoElements.forEach(element => element.remove());
            
            // Supprimer les indicateurs Quilegan existants
            const quileganIndicators = combatProgressContainer.querySelectorAll('.quilegan-progress-indicator');
            quileganIndicators.forEach(element => element.remove());
        }
        
        // Réinitialiser les triggers de bonus dynamiques pour le nouveau combat
        this.dynamicBonusTriggers = {};
        
        let isBossFight = false;
        
        if (this.isInfiniteMode) {
            // Mode infini
            isBossFight = this.isInfiniteBossFight();
        } else {
            // Mode normal
            isBossFight = this.bossManager.isBossRank(this.rank);
        }
        
        if (isBossFight) {
            // Combat de boss - sélectionner un boss pour le rang actuel
            const selectedBoss = this.bossManager.selectBossForRank(this.rank);
            this.bossManager.startBossFight(selectedBoss, this.rank);
            
            this.notificationManager.showBossFight(selectedBoss.name, selectedBoss.mechanic);
        } else {
            // Combat normal
            let targetDamage;
            
            if (this.isInfiniteMode) {
                // Mode infini : progression exponentielle
                targetDamage = this.calculateInfiniteTargetDamage();
            } else {
                // Mode normal
                targetDamage = this.calculateTargetDamageByRank(this.rank);
            }
            
            this.currentCombat = {
                targetDamage: targetDamage,
                totalDamage: 0,
                round: 0,
                maxRounds: 5,
                isActive: true,
                isBossFight: false,
                bossName: '',
                bossMechanic: ''
            };
        }
        
        // NOUVEAU : Réinitialiser les unités utilisées pour le nouveau combat
        this.resetUsedUnitsForNewCombat();
        
        // NOUVEAU : Tirer 7 unités aléatoirement du pool global pour le combat
        this.drawCombatTroopsFromGlobalPool();
        
        // Mettre à jour la modal de combat (mais ne pas l'afficher encore)
        this.combatManager.updateCombatModal();
        
        this.updateUI();
        
        // Afficher la barre de progression du combat dès le début
        this.progressManager.updateCombatProgressDisplay();
        
        // Lancer le premier tour de combat automatiquement
        this.executeCombatTurn();
    }

    validateCombatTurn() {
        return this.combatManager.validateCombatTurn();
    }

    prepareTroopsForTurn() {
        return this.combatManager.prepareTroopsForTurn();
    }

    updateCombatStatistics(troopsUsed, turnDamage) {
        return this.statisticsManager.updateCombatStatistics(troopsUsed, turnDamage);
    }

    handleTroopsAfterTurn() {
        return this.combatManager.handleTroopsAfterTurn();
    }

    checkCombatEnd() {
        return this.combatManager.checkCombatEnd();
    }

    updateUIAfterAnimation() {
        return this.combatManager.updateUIAfterAnimation();
    }

    handleCombatAnimation(troopsUsed, turnDamage) {
        return this.combatManager.handleCombatAnimation(troopsUsed, turnDamage);
    }

    executeCombatTurn() {
        return this.combatManager.executeCombatTurn();
    }

    calculateTurnDamage(troops) {
        return this.combatManager.calculateTurnDamage(troops);
    }

    initializeCombatAnimation() {
        return this.combatManager.initializeCombatAnimation();
    }

    setupAnimationCloseEvent(closeButton) {
        return this.combatManager.setupAnimationCloseEvent(closeButton);
    }

    resetAnimationCounters(damageCounter, multiplierCounter, finalResult, unitsContent, synergiesContent, bonusesContent) {
        return this.combatManager.resetAnimationCounters(damageCounter, multiplierCounter, finalResult, unitsContent, synergiesContent, bonusesContent);
    }

    initializeMainCounter(previousDamage) {
        return this.combatManager.initializeMainCounter(previousDamage);
    }











    

    

    

    




    // Méthode déléguée vers CombatManager
    endCombat(victory) {
        return this.combatManager.endCombat(victory);
    }



    // Méthode déléguée vers CombatManager
    createVictoryRewardsContent(baseReward, wealthBonus, equipmentGoldBonus, totalGold) {
        return this.combatManager.createVictoryRewardsContent(baseReward, wealthBonus, equipmentGoldBonus, totalGold);
    }

    // Méthode déléguée vers CombatManager
    createVictorySummaryBox(baseReward, wealthBonus, equipmentGoldBonus, totalGold) {
        return this.combatManager.createVictorySummaryBox(baseReward, wealthBonus, equipmentGoldBonus, totalGold);
    }

    insertVictoryBoxInModal(victoryBox) {
        return this.combatManager.insertVictoryBoxInModal(victoryBox);
    }

    animateVictoryBox(victoryBox) {
        return this.combatManager.animateVictoryBox(victoryBox);
    }

    attachVictoryContinueEvent(victoryBox) {
        return this.combatManager.attachVictoryContinueEvent(victoryBox);
    }

    handleVictoryContinue() {
        return this.combatManager.handleVictoryContinue();
    }

    configureVictoryModal() {
        return this.combatManager.configureVictoryModal();
    }

    showVictorySummary(baseReward, wealthBonus, equipmentGoldBonus) {
        return this.combatManager.showVictorySummary(baseReward, wealthBonus, equipmentGoldBonus);
    }

    showGameSummary() {
        return this.statisticsManager.showGameSummary();
    }

    calculateRankTarget() {
        return this.progressManager.calculateRankTarget();
    }

    // Gestion des ressources
    addGold(amount) {
        this.gold += amount;
        this.statisticsManager.addGoldEarned(amount);
        this.updateUI();
    }

    // Incrémenter les statistiques d'achat d'unités
    incrementUnitsPurchased() {
        this.statisticsManager.incrementUnitsPurchased();
    }

    // Incrémenter les statistiques d'achat de bonus
    incrementBonusesPurchased() {
        this.statisticsManager.incrementBonusesPurchased();
    }

    // Getter pour accéder aux statistiques (pour la compatibilité)
    get gameStats() {
        return this.statisticsManager.gameStats;
    }

    // Calculer le bonus d'or basé sur la richesse actuelle
    calculateWealthBonus() {
        // Bonus d'économie basé sur l'or actuel (même sans bonus débloqué)
        const wealthBonus = Math.floor(this.gold / 100) * 5; // 5 or par 100 or possédé
        return wealthBonus;
    }

    // Calculer le bonus d'or des bonus d'équipement
    calculateEquipmentGoldBonus() {
        let totalBonus = 0;
        
        // Compter les occurrences de chaque bonus
        const bonusCounts = {};
        this.unlockedBonuses.forEach(bonusId => {
            bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
        });
        
        // Bonus d'or statiques
        if (bonusCounts['gold_bonus']) {
            totalBonus = 25 * bonusCounts['gold_bonus'];
        }
        
        // Bonus d'or dynamiques
        const equipmentBonuses = this.calculateEquipmentBonuses();
        equipmentBonuses.forEach(bonus => {
            if (bonus.gold) {
                totalBonus += bonus.gold;
            }
        });
        
        return totalBonus;
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.statisticsManager.addGoldSpent(amount);
            this.updateUI();
            return true;
        }
        return false;
    }
    
    updateGuildName(newName) {
        return this.uiManager.updateGuildName(newName);
    }

    // Gestion des troupes
    addTroop(troop) {
        addTroop(troop, this);
    }

    drawCombatTroops() {
        return this.combatManager.drawCombatTroops();
    }

    maintainCombatTroops() {
        return this.combatManager.maintainCombatTroops();
    }

    selectTroopForCombat(troopIndex) {
        return this.combatManager.selectTroopForCombat(troopIndex);
    }

    selectTroopById(troopId) {
        return this.combatManager.selectTroopById(troopId);
    }

    deselectTroopFromCombat(troopIndex) {
        return this.combatManager.deselectTroopFromCombat(troopIndex);
    }

    removeUsedTroopsFromCombat(troopsUsed) {
        return this.combatManager.removeUsedTroopsFromCombat(troopsUsed);
    }

    isPermanentUnit(troop) {
        return this.combatManager.isPermanentUnit(troop);
    }

    calculateSynergies(troops = null) {
        return this.combatManager.calculateSynergies(troops);
    }

    hasTroopType(troop, targetType) {
        return this.combatManager.hasTroopType(troop, targetType);
    }

    calculateEquipmentBonuses() {
        return this.combatManager.calculateEquipmentBonuses();
    }

    applyCombatBonuses() {
        return this.combatManager.applyCombatBonuses();
    }
    
    incrementEndOfCombatCounters() {
        return this.combatManager.incrementEndOfCombatCounters();
    }

    // Débloquer un bonus
    unlockBonus(bonusId) {
        return unlockBonus(bonusId, this);
    }

    // Nettoyer les bonus invalides
    cleanInvalidBonuses() {
        cleanInvalidBonuses(this);
    }

    updateUI() {
        return this.uiManager.updateUI();
    }

    updateBossDamageGauge() {
        return this.uiManager.updateBossDamageGauge();
    }

    updateCombatModalBasicElements() {
        return this.uiManager.updateCombatModalBasicElements();
    }

    updateCombatModalEnemyImage() {
        return this.combatManager.updateCombatModalEnemyImage();
    }

    // Extraire la création de l'effet de brillance
    createShineEffect() {
        const shine = document.createElement('div');
        shine.style.cssText = `
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            transform: rotate(45deg);
            animation: shine 3s infinite;
        `;
        return shine;
    }



    createInitialCombatLog() {
        return this.combatManager.createInitialCombatLog();
    }

    updateCombatModal() {
        return this.combatManager.updateCombatModal();
    }
    
    // Ajouter un message au log de combat
    addCombatLog(message, type = 'info') {
        const combatLog = document.getElementById('combat-log');
        if (!combatLog) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        combatLog.appendChild(logEntry);
        combatLog.scrollTop = combatLog.scrollHeight;
    }
    
    // Mettre à jour la progression dans la modal de combat
    updateCombatModalProgress() {
        const combatProgress = document.getElementById('combat-progress');
        const combatLog = document.getElementById('combat-log');
        
        if (combatProgress) {
            const percentage = Math.min((this.currentCombat.totalDamage / this.currentCombat.targetDamage) * 100, 100);
            combatProgress.style.width = `${percentage}%`;
        }
        
        if (combatLog) {
            // Ajouter un message de progression
            this.addCombatLog(`Tour ${this.currentCombat.round}: ${this.currentCombat.totalDamage}/${this.currentCombat.targetDamage} dégâts`, 'synergy');
            
            // Vérifier si c'est la victoire ou la défaite
            if (this.currentCombat.totalDamage >= this.currentCombat.targetDamage) {
                this.addCombatLog('🎉 VICTOIRE !', 'victory');
            } else if (this.currentCombat.round >= this.currentCombat.maxRounds) {
                this.addCombatLog('💀 DÉFAITE !', 'defeat');
            }
        }
    }
    
    // Obtenir le nom de l'ennemi selon le rang
    getEnemyName() {
        return getEnemyNameFromConstants(this.rank);
    }
    
    updateCombatProgressDisplay() {
        return this.progressManager.updateCombatProgressDisplay();
    }

    updateTroopsUI() {
        return this.uiManager.updateTroopsUIDisplay();
    }

    createTroopCard(troop, index, isSelected) {
        return createTroopCard(troop, index, isSelected, this);
    }

    updateSynergies() {
        return this.uiManager.updateSynergiesDisplay();
    }

    // Définitions centralisées des bonus
    getBonusDescriptions() {
        return getBonusDescriptions();
    }

    updateActiveBonuses() {
        return this.uiManager.updateActiveBonuses();
    }

    updateSectionDisplay() {
        return this.uiManager.updateSectionDisplay();
    }

    showNotification(message, type = 'info') {
        return this.uiManager.showNotification(message, type);
    }

    save() {
        this.saveManager.save(this);
    }

    load() {
        return this.saveManager.load(this);
    }

    newGame() {
        this.saveManager.newGame(this);
    }

    // === SYSTÈME DE CONSOMMABLES ===

    addConsumable(consumableType) {
        this.consumableManager.addConsumable(consumableType, this);
    }

    useConsumable(consumableId) {
        return this.consumableManager.useConsumable(consumableId, this);
    }

    updateConsumablesDisplay() {
        return this.uiManager.updateConsumablesDisplay();
    }

    addConsumableToShop() {
        return this.consumableManager.addConsumableToShop();
    }

    // Récupérer toutes les troupes disponibles dans le jeu
    getAllAvailableTroops() {
        return getAllAvailableTroops();
    }

    // Récupérer seulement les unités de base (quantity > 0)
    getBaseUnits() {
        return getBaseUnits();
    }


    // Récupérer toutes les unités disponibles pour le magasin
    getShopUnits() {
        return getShopUnits();
    }



    // Obtenir les unités possédées pour la sauvegarde
    getOwnedUnits() {
        return getOwnedUnits(this.ownedUnits);
    }

    // Charger les unités possédées depuis la sauvegarde
    loadOwnedUnits(ownedUnits) {
        loadOwnedUnits(ownedUnits, this);
    }

    updateTroopsDisplay() {
        return this.uiManager.updateTroopsDisplay();
    }

    // Changer la vitesse d'animation

    






    // Fonction de debug pour changer le rang depuis la console
    setupDebugFunctions() {
        console.log('🔧 Initialisation des fonctions de debug...');
        
        // Fonction globale pour changer le rang
        window.setRank = (newRank) => {
            if (RANKS.includes(newRank)) {
                this.currentRank = newRank;
                this.updateUI();
                return true;
            } else {
                console.error(`❌ Rang invalide : ${newRank}`);
                return false;
            }
        };

        // Fonction globale pour afficher le rang actuel
        window.getRank = () => {
            return this.currentRank;
        };

        // Fonction globale pour lister tous les rangs
        window.listRanks = () => {
            return RANKS;
        };

        // Fonction globale pour obtenir des informations de debug
        window.debugInfo = () => {
            // Informations de debug silencieuses
        };

        // Fonction globale pour ajouter de l'or
        window.addGoldDebug = (amount) => {
            console.log(`💰 Ajout de ${amount} or via addGoldDebug`);
            this.addGold(amount);
        };

        // Fonction globale pour débloquer tous les bonus
        window.unlockAllBonuses = () => {
            const bonusDescriptions = this.getBonusDescriptions();
            const allBonusIds = Object.keys(bonusDescriptions);
            
            allBonusIds.forEach(bonusId => {
                if (!this.unlockedBonuses.includes(bonusId)) {
                    this.unlockedBonuses.push(bonusId);
                }
            });
            
            this.updateActiveBonuses();
        };

        // Fonction globale pour ajouter toutes les troupes
        window.addAllTroops = () => {
            const allUnits = this.getAllAvailableTroops();
            allUnits.forEach(unit => {
                this.ownedUnits[unit.name] = (this.ownedUnits[unit.name] || 0) + 1;
            });
            
            // Nettoyer le cache des unités car les quantités ont changé
            clearUnitCache();
            
            this.updateUI();
        };
        
        console.log('✅ Fonctions de debug initialisées:', Object.keys(window).filter(key => ['setRank', 'getRank', 'listRanks', 'debugInfo', 'addGoldDebug', 'unlockAllBonuses', 'addAllTroops'].includes(key)));
        
        // Test de la fonction addGoldDebug
        console.log('🧪 Test de addGoldDebug...');
        if (typeof window.addGoldDebug === 'function') {
            console.log('✅ addGoldDebug est bien définie sur window');
        } else {
            console.error('❌ addGoldDebug n\'est pas définie sur window');
        }
    }
} 