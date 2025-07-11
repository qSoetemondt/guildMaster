// Classe GameState en ES6
import { NotificationManager } from './NotificationManager.js';
import { getRarityIcon, getRarityColor, getRarityDisplayName } from './RarityUtils.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { SaveManager } from './SaveManager.js';
import { ConsumableManager } from './ConsumableManager.js';
import { ShopManager } from './ShopManager.js';
import { RANKS, BOSS_RANKS, RANK_MULTIPLIERS, BASE_DAMAGE, DAMAGE_INCREMENT_PER_RANK, getMajorRank, getEnemyData, getEnemyImage, getEnemyName as getEnemyNameFromConstants } from './GameConstants.js';
import { BASE_UNITS, ALL_UNITS } from './UnitConstants.js';

import { BossManager } from './BossManager.js';
import { AnimationManager } from './AnimationManager.js';
import { DEFAULT_SYNERGY_LEVELS } from './SynergyConstants.js';
import { BONUS_DESCRIPTIONS, calculateBonusPrice, getBonusRarity } from './BonusConstants.js';
import { SYNERGY_DEFINITIONS, SPECIAL_SYNERGIES, calculateSynergyBonus, checkSynergyActivation } from './SynergyDefinitions.js';
import { getBaseUnits, getShopUnits, getAllAvailableTroops, getOwnedUnits, loadOwnedUnits, updateTroopsDisplay, addTroop, drawCombatTroops, maintainCombatTroops, isPermanentUnit, selectTroopForCombat, deselectTroopFromCombat, removeUsedTroopsFromCombat, hasTroopType, updateTroopsUI, createTroopCard, updateSynergies, calculateSynergies, calculateEquipmentBonuses, applyCombatBonuses, incrementDynamicBonusTrigger, syncDynamicBonusTriggers } from './UnitManager.js';
import { UnitSorter } from './UnitSorter.js';
import { unlockBonus, cleanInvalidBonuses, getBonusDescriptions, updateActiveBonuses } from './ShopManager.js';

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
        this.usedTroopsThisRank = []; // Troupes utilisées dans ce rang
        this.combatHistory = [];
        this.isFirstTime = true;
        this.unlockedBonuses = []; // Bonus débloqués via le magasin
        this.dynamicBonusStates = {}; // États des bonus dynamiques (compteurs, etc.)
        
        // Initialiser les gestionnaires
        this.notificationManager = new NotificationManager();
        this.saveManager = new SaveManager();
        this.consumableManager = new ConsumableManager();
        this.shopManager = new ShopManager();
        this.unitSorter = new UnitSorter();
        this.bossManager = new BossManager(this);
        this.animationManager = new AnimationManager(this);
        
        // Statistiques de partie
        this.gameStats = {
            combatsPlayed: 0,
            combatsWon: 0,
            combatsLost: 0,
            goldSpent: 0,
            goldEarned: 0,
            unitsPurchased: 0,
            bonusesPurchased: 0,
            unitsUsed: {}, // {unitName: count}
            maxDamageInTurn: 0,
            bestTurnDamage: 0,
            bestTurnRound: 0,
            totalDamageDealt: 0,
            highestRank: 'F-',
            startTime: Date.now()
        };
        
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
        this.transformedBaseUnits = {}; // Garder une trace des unités de base transformées
        
        // Système de niveaux de synergies
        this.synergyLevels = { ...DEFAULT_SYNERGY_LEVELS };
        
        // Stockage des unités possédées (pour la sauvegarde)
        this.ownedUnits = {};
        
        // Initialiser les unités de base par défaut
        this.getBaseUnits().forEach(unit => {
            if (unit.quantity > 0) {
                this.ownedUnits[unit.name] = unit.quantity;
            }
        });
        
        // Progression des rangs
        this.RANKS = RANKS;
        
        // Rangs qui déclenchent des combats de boss
        this.BOSS_RANKS = BOSS_RANKS;
        
        // Définition des unités de base
        this.BASE_UNITS = BASE_UNITS;

        // Boss disponibles

        
        // Fonction pour calculer les dégâts cibles selon le rang majeur
        this.calculateTargetDamageByRank = function(rank) {
            const rankIndex = this.RANKS.indexOf(rank);
            if (rankIndex === -1) return BASE_DAMAGE; // Valeur par défaut
            
            const majorRank = getMajorRank(rank);
            const baseDamage = BASE_DAMAGE + (rankIndex * DAMAGE_INCREMENT_PER_RANK);
            return baseDamage * RANK_MULTIPLIERS[majorRank];
        };
        
        // Vitesse d'animation (1x, 2x, 4x)
        this.animationSpeed = 1;
        
        // Compteur de relances (limité à 3 par rang)
        this.rerollCount = 0;
        
        // Fonction de debug pour changer le rang depuis la console
        this.setupDebugFunctions();
        
        // Tirer les premières troupes pour le combat
        this.drawCombatTroops();
    }

    // Gagner un rang après chaque combat
    gainRank() {
        const currentIndex = this.RANKS.indexOf(this.rank);
        if (currentIndex < this.RANKS.length - 1) {
            const oldRank = this.rank;
            this.rank = this.RANKS[currentIndex + 1];
            
            // Réinitialiser les troupes utilisées pour le nouveau rang
            this.usedTroopsThisRank = [];
            
            // Réinitialiser le compteur de relances pour le nouveau rang
            this.rerollCount = 0;
            
            // Réinitialiser l'état du boss pour le nouveau rang
            this.bossManager.resetForNewRank();
            
            // Tirer de nouvelles troupes pour le nouveau rang
            this.drawCombatTroops();
            
            // Mettre à jour l'interface pour afficher le nouveau boss si nécessaire
            this.updateUI();
            
            this.notificationManager.showRankGained(this.rank);
        }
    }

    // Démarrer un nouveau combat
    startNewCombat() {
        // Nettoyer l'affichage du malus de boss avant de commencer un nouveau combat
        this.bossManager.cleanBossMalusDisplay();
        
        // Réinitialiser les triggers de bonus dynamiques pour le nouveau combat
        this.dynamicBonusTriggers = {};
        
        // Synchroniser les compteurs de trigger avec le nombre d'exemplaires possédés
        syncDynamicBonusTriggers(this);
        
        const isBossFight = this.bossManager.isBossRank(this.rank);
        
        if (isBossFight) {
            // Combat de boss - sélectionner un boss pour le rang actuel
            const selectedBoss = this.bossManager.selectBossForRank(this.rank);
            this.bossManager.startBossFight(selectedBoss, this.rank);
            
            this.notificationManager.showBossFight(selectedBoss.name, selectedBoss.mechanic);
        } else {
            // Combat normal
            this.currentCombat = {
                targetDamage: this.calculateTargetDamageByRank(this.rank),
                totalDamage: 0,
                round: 0,
                maxRounds: 5,
                isActive: true,
                isBossFight: false,
                bossName: '',
                bossMechanic: ''
            };
        }
        
        // Toujours tirer de nouvelles troupes pour un nouveau combat
        this.drawCombatTroops();
        
        // Mettre à jour la modal de combat (mais ne pas l'afficher encore)
        this.updateCombatModal();
        
        this.updateUI();
        
        // Afficher la barre de progression du combat dès le début
        this.updateCombatProgressDisplay();
        
        // Lancer le premier tour de combat automatiquement
        this.executeCombatTurn();
    }

    // Extraire la validation et préparation du tour de combat
    validateCombatTurn() {
        if (!this.currentCombat.isActive || this.selectedTroops.length === 0) {
            return { valid: false, message: 'Aucune troupe sélectionnée' };
        }
        return { valid: true };
    }

    // Extraire la préparation des troupes pour le tour
    prepareTroopsForTurn() {
        // Copier les troupes sélectionnées pour l'animation
        const troopsUsed = [...this.selectedTroops];
        const turnDamage = this.calculateTurnDamage(troopsUsed);
        
        return { troopsUsed, turnDamage };
    }

    // Extraire la mise à jour des statistiques de combat
    updateCombatStatistics(troopsUsed, turnDamage) {
        // Mettre à jour les dégâts totaux
        this.currentCombat.totalDamage += turnDamage;
        this.currentCombat.round++;
        
        // Tracker les statistiques
        this.gameStats.totalDamageDealt += turnDamage;
        
        // Tracker les unités utilisées
        troopsUsed.forEach(troop => {
            this.gameStats.unitsUsed[troop.name] = (this.gameStats.unitsUsed[troop.name] || 0) + 1;
        });
        
        // Tracker le meilleur tour de dégâts
        if (turnDamage > this.gameStats.bestTurnDamage) {
            this.gameStats.bestTurnDamage = turnDamage;
            this.gameStats.bestTurnRound = this.currentCombat.round;
        }
    }

    // Extraire la gestion des troupes après le tour
    handleTroopsAfterTurn() {
        // Retirer les troupes utilisées
        this.selectedTroops = [];
    }

    // Extraire la vérification de fin de combat
    checkCombatEnd() {
        if (this.currentCombat.totalDamage >= this.currentCombat.targetDamage) {
            setTimeout(() => {
                this.endCombat(true);
            }, 1000);
            return true;
        } else if (this.currentCombat.round >= this.currentCombat.maxRounds) {
            setTimeout(() => {
                this.endCombat(false);
            }, 1000);
            return true;
        }
        return false;
    }

    // Extraire la mise à jour de l'UI après animation
    updateUIAfterAnimation() {
        // Mettre à jour l'UI après l'animation
        this.updateCombatProgressDisplay();
        this.updateCombatModalProgress();
        this.updateUI();
        this.updateTroopsUI();
    }

    // Extraire la gestion de l'animation et de la fin de combat
    handleCombatAnimation(troopsUsed, turnDamage) {
        // Jouer l'animation de combat
        this.animationManager.playCombatAnimation(troopsUsed, turnDamage).then(() => {
            // Mettre à jour l'UI après l'animation
            this.updateUIAfterAnimation();
            
            // Vérifier si le combat est terminé
            this.checkCombatEnd();
        });
    }

    executeCombatTurn() {
        // Validation et préparation
        const validation = this.validateCombatTurn();
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        // Préparation des troupes
        const { troopsUsed, turnDamage } = this.prepareTroopsForTurn();

        // Mise à jour des statistiques
        this.updateCombatStatistics(troopsUsed, turnDamage);

        // Gestion des troupes
        this.handleTroopsAfterTurn();

        // Gestion de l'animation et de la fin de combat
        this.handleCombatAnimation(troopsUsed, turnDamage);

        return { 
            success: true, 
            message: 'Animation de combat lancée', 
            damage: turnDamage, 
            total: this.currentCombat.totalDamage 
        };
    }

    // Calculer les dégâts d'un tour
    calculateTurnDamage(troops) {
        console.log(`🐛 calculateTurnDamage appelé avec ${troops.length} troupes`);
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        for (const troop of troops) {
            // Vérifier si la troupe a déjà été utilisée dans ce rang
            if (this.usedTroopsThisRank.includes(troop.id)) {
                console.log(`🐛 Troupe ${troop.name} déjà utilisée, skip`);
                continue; // Passer cette troupe
            }

            let unitDamage = troop.damage;
            let unitMultiplier = troop.multiplier;
            
            // Appliquer les synergies
            const synergies = this.calculateSynergies(troops);
            synergies.forEach(synergy => {
                if (synergy.bonus.target === 'all' || this.hasTroopType(troop, synergy.bonus.target)) {
                    if (synergy.bonus.damage) unitDamage += synergy.bonus.damage;
                    if (synergy.bonus.multiplier) unitMultiplier += synergy.bonus.multiplier;
                }
            });
            
            // Les bonus dynamiques seront incrémentés pendant l'animation de combat
            // pour permettre une animation visuelle de l'augmentation
            
            // Appliquer les bonus d'équipement
            const equipmentBonuses = this.calculateEquipmentBonuses();
            equipmentBonuses.forEach(bonus => {
                if (bonus.target === 'all' || this.hasTroopType(troop, bonus.target)) {
                    if (bonus.damage) unitDamage += bonus.damage;
                    if (bonus.multiplier) unitMultiplier += bonus.multiplier;
                }
            });
            
            // Appliquer les mécaniques de boss (après les synergies et bonus)
            if (this.currentCombat.isBossFight) {
                console.log(`🐛 GameState: Applique mécaniques boss pour ${troop.name} - Dégâts: ${unitDamage}, Multiplicateur: ${unitMultiplier}`);
                
                // Appliquer les mécaniques de boss sur les dégâts
                unitDamage = this.bossManager.applyBossMechanics(unitDamage, troop);
                
                // Appliquer les mécaniques de boss sur les multiplicateurs
                unitMultiplier = this.bossManager.applyBossMechanicsToMultiplier(unitMultiplier, troop);
                
                console.log(`🐛 GameState: Après mécaniques boss - Dégâts: ${unitDamage}, Multiplicateur: ${unitMultiplier}`);
            }
            
            // Accumuler les dégâts et multiplicateurs
            totalDamage += unitDamage;
            totalMultiplier += unitMultiplier;
            
            // Marquer la troupe comme utilisée dans ce rang
            this.usedTroopsThisRank.push(troop.id);
        }
        
        // Retirer les troupes utilisées du pool de combat
        this.removeUsedTroopsFromCombat(troops);
        
        // Calculer le total final
        let finalDamage = totalDamage * totalMultiplier;
        console.log(`🐛 GameState: Calcul final - totalDamage: ${totalDamage}, totalMultiplier: ${totalMultiplier}, finalDamage: ${finalDamage}`);
        
        // Appliquer le malus de Quilegan à la fin (après tous les calculs)
        if (this.currentCombat && this.currentCombat.isBossFight && 
            this.currentCombat.bossMechanic.includes('Bloque les relances, les bonus, les synergies et les dégâts des unités tant qu\'aucun bonus n\'est vendu')) {
            
            console.log(`🐛 Quilegan Debug: bonusSoldThisCombat = ${this.bossManager.isBossMalusDisabled()}, finalDamage = ${finalDamage}`);
            
            if (!this.bossManager.isBossMalusDisabled()) {
                console.log(`🐛 Quilegan: Bonus non vendu, dégâts mis à 0 (était ${finalDamage})`);
                finalDamage = 0;
            } else {
                console.log(`🐛 Quilegan: Bonus vendu, dégâts normaux (${finalDamage})`);
            }
        }
        
        return Math.round(finalDamage);
    }

    // Extraire l'initialisation de l'animation de combat
    initializeCombatAnimation() {
        const container = document.getElementById('combat-animation-container');
        const closeButton = document.getElementById('close-combat-animation');
        const damageCounter = document.getElementById('total-damage-counter');
        const multiplierCounter = document.getElementById('total-multiplier-counter');
        const finalResult = document.getElementById('final-result');
        const unitsContent = document.getElementById('units-slider-content');
        const synergiesContent = document.getElementById('synergies-animation-content');
        const bonusesContent = document.getElementById('bonuses-animation-content');
        
        // Ajouter l'image de l'ennemi dans la popup
        const enemyImageContainer = document.getElementById('enemy-image-animation');
        if (enemyImageContainer) {
            let enemyImageSrc = 'assets/orcs.jpg';
            if (this.currentCombat.isBossFight) {
                enemyImageSrc = 'assets/orcs.jpg';
            } else {
                enemyImageSrc = getEnemyImage(this.rank);
            }
            enemyImageContainer.src = enemyImageSrc;
        }
        

        
        // Afficher le conteneur d'animation
        container.style.display = 'flex';
        
        // Masquer le bouton de fermeture au début de l'animation
        const closeSectionInitial = document.getElementById('combat-close-section');
        if (closeSectionInitial) {
            closeSectionInitial.style.display = 'none';
        }
        
        return {
            container,
            closeButton,
            damageCounter,
            multiplierCounter,
            finalResult,
            unitsContent,
            synergiesContent,
            bonusesContent
        };
    }

    // Extraire la configuration de l'événement de fermeture
    setupAnimationCloseEvent(closeButton) {
        const closeAnimation = () => {
            const container = document.getElementById('combat-animation-container');
            container.style.display = 'none';
            closeButton.removeEventListener('click', closeAnimation);
            

            
            // Masquer le bouton de fermeture
            const closeSection = document.getElementById('combat-close-section');
            if (closeSection) {
                closeSection.style.display = 'none';
            }
            
            // Mettre à jour l'UI après fermeture
            this.updateCombatProgressDisplay();
            this.updateUI();
            this.updateTroopsUI();
            
            // Vérifier si le combat est terminé après fermeture
            if (this.currentCombat.totalDamage >= this.currentCombat.targetDamage) {
                setTimeout(() => {
                    this.endCombat(true);
                }, 500);
            } else if (this.currentCombat.round >= this.currentCombat.maxRounds) {
                setTimeout(() => {
                    this.endCombat(false);
                }, 500);
            }
        };
        closeButton.addEventListener('click', closeAnimation);
    }

    // Extraire la réinitialisation des compteurs
    resetAnimationCounters(damageCounter, multiplierCounter, finalResult, unitsContent, synergiesContent, bonusesContent) {
        // Réinitialiser tous les contenus
        damageCounter.textContent = '0';
        multiplierCounter.textContent = '0';
        finalResult.textContent = '= 0 dégâts';
        unitsContent.innerHTML = '';
        synergiesContent.innerHTML = '';
        bonusesContent.innerHTML = '';
        
        // Réinitialiser aussi les conteneurs mobile
        const unitsContentMobile = document.getElementById('units-slider-content-mobile');
        const synergiesContentMobile = document.getElementById('synergies-animation-content-mobile');
        const bonusesContentMobile = document.getElementById('bonuses-animation-content-mobile');
        
        if (unitsContentMobile) unitsContentMobile.innerHTML = '';
        if (synergiesContentMobile) synergiesContentMobile.innerHTML = '';
        if (bonusesContentMobile) bonusesContentMobile.innerHTML = '';
    }

    // Extraire l'initialisation du compteur principal
    initializeMainCounter(previousDamage) {
        const previousPercentage = Math.min((previousDamage / this.currentCombat.targetDamage) * 100, 100);
        
        // Initialiser le background du main-counter avec les dégâts précédents (pour la barre seulement)
        const mainCounter = document.querySelector('.main-counter');
        if (mainCounter) {
            mainCounter.style.setProperty('--progress-width', `${previousPercentage}%`);
            if (previousPercentage > 100) {
                mainCounter.classList.add('over-100');
            } else {
                mainCounter.classList.remove('over-100');
            }
        }
    }











    

    

    

    




    // Terminer le combat
    endCombat(victory) {
        if (!this.currentCombat.isActive) return;

        this.currentCombat.isActive = false;
        this.currentCombat.round = 0;

        // Tracker les statistiques de combat
        this.gameStats.combatsPlayed++;
        if (victory) {
            this.gameStats.combatsWon++;
        } else {
            this.gameStats.combatsLost++;
            // Afficher le récapitulatif de partie en cas de défaite
            this.showGameSummary();
        }

        // Mettre à jour le rang le plus élevé
        const currentRankIndex = this.RANKS.indexOf(this.rank);
        const highestRankIndex = this.RANKS.indexOf(this.gameStats.highestRank);
        if (currentRankIndex > highestRankIndex) {
            this.gameStats.highestRank = this.rank;
        }

        if (victory) {
            // Récompense de base augmentée
            const baseReward = this.currentCombat.isBossFight ? 75 : 50;
            this.addGold(baseReward);
            
            // Bonus de richesse
            const wealthBonus = this.calculateWealthBonus();
            this.addGold(wealthBonus);
            
            // Incrémenter les compteurs de fin de combat pour les bonus dynamiques AVANT de calculer les bonus d'or
            this.incrementEndOfCombatCounters();
            
            // Calculer les bonus d'or des bonus d'équipement (après l'incrémentation)
            const equipmentGoldBonus = this.calculateEquipmentGoldBonus();
            this.addGold(equipmentGoldBonus);
            
            // Monter de rang après victoire
            this.gainRank();
            
            // Appliquer les bonus de base après combat
            this.applyCombatBonuses();
            
            // S'assurer que la modal de combat est affichée
            const combatModal = document.getElementById('combat-modal');
            if (combatModal) {
                combatModal.style.display = 'flex';
                combatModal.classList.add('active');
            }
            
            // Afficher l'encadré de victoire avec le détail des récompenses
            this.showVictorySummary(baseReward, wealthBonus, equipmentGoldBonus);
            

        } else {
            this.notificationManager.showDefeat();
        }

        // Vider les troupes après combat
        this.combatTroops = [];
        this.selectedTroops = [];
        this.usedTroopsThisRank = [];

        // Réinitialiser le magasin pour qu'il se régénère
        this.shopManager.resetShop();
        
        // Réinitialiser le coût de rafraîchissement après chaque combat
        this.shopManager.shopRefreshCount = 0;
        this.shopManager.shopRefreshCost = 10;

        // Nettoyer l'affichage du malus de boss
        this.bossManager.cleanBossMalusDisplay();

        this.updateUI();
        
        // Tirer de nouvelles troupes pour le prochain combat
        this.drawCombatTroops();
        
        // En cas de victoire, fermer l'animation de combat pour laisser place au récapitulatif
        if (victory) {
            setTimeout(() => {
                const combatAnimationContainer = document.getElementById('combat-animation-container');
                if (combatAnimationContainer) {
                    combatAnimationContainer.style.display = 'none';
                }
            }, 1000); // Fermer l'animation après 1 seconde pour laisser le temps au récapitulatif de s'afficher
        } else {
            // Fermer automatiquement seulement en cas de défaite
            setTimeout(() => {
                const combatModal = document.getElementById('combat-modal');
                if (combatModal) {
                    combatModal.style.display = 'none';
                }
            }, 3000);
        }
    }



    // Extraire la création du contenu des récompenses
    createVictoryRewardsContent(baseReward, wealthBonus, equipmentGoldBonus, totalGold) {
        return `
            <div class="victory-rewards">
                <div class="reward-details">
                    <div class="reward-line">
                        <span>Or pour la victoire :</span>
                        <span class="reward-amount">+${baseReward} or</span>
                    </div>
                    ${wealthBonus > 0 ? `
                    <div class="reward-line">
                        <span>Bonus économie :</span>
                        <span class="reward-amount">+${wealthBonus} or</span>
                    </div>
                    ` : ''}
                    ${equipmentGoldBonus > 0 ? `
                    <div class="reward-line">
                        <span>Bonus équipement :</span>
                        <span class="reward-amount">+${equipmentGoldBonus} or</span>
                    </div>
                    ` : ''}
                    <div class="reward-total">
                        <span><strong>Total :</strong></span>
                        <span class="reward-amount total"><strong>+${totalGold} or</strong></span>
                    </div>
                </div>
                <p class="rank-progression">Vous passez au rang : <strong>${this.rank}</strong></p>
            </div>
        `;
    }

    // Extraire la création de l'encadré de victoire
    createVictorySummaryBox(baseReward, wealthBonus, equipmentGoldBonus, totalGold) {
        const victoryBox = document.createElement('div');
        victoryBox.className = 'victory-summary-box';
        victoryBox.innerHTML = `
            <div class="victory-summary-content">
                <h3>🎉 Victoire !</h3>
                ${this.createVictoryRewardsContent(baseReward, wealthBonus, equipmentGoldBonus, totalGold)}
                <div class="victory-actions">
                    <button class="btn primary victory-continue-btn">Continuer vers le magasin</button>
                </div>
            </div>
        `;
        return victoryBox;
    }

    // Extraire l'insertion de l'encadré dans la modal
    insertVictoryBoxInModal(victoryBox) {
        const combatModal = document.getElementById('combat-modal');
        if (!combatModal) {
            console.error('Modal de combat non trouvée');
            return false;
        }

        const modalBody = combatModal.querySelector('.modal-body');
        if (!modalBody) {
            console.error('Modal body non trouvé dans la modal de combat');
            return false;
        }

        // Supprimer l'ancien encadré de victoire s'il existe
        const oldVictoryBox = modalBody.querySelector('.victory-summary-box');
        if (oldVictoryBox) {
            oldVictoryBox.remove();
        }

        // Ajouter le nouvel encadré
        modalBody.appendChild(victoryBox);
        return true;
    }

    // Extraire l'animation d'apparition
    animateVictoryBox(victoryBox) {
        setTimeout(() => {
            victoryBox.classList.add('show');
        }, 100);
    }

    // Extraire la gestion des événements du bouton continuer
    attachVictoryContinueEvent(victoryBox) {
        const continueBtn = victoryBox.querySelector('.victory-continue-btn');
        if (!continueBtn) return;

        continueBtn.addEventListener('click', () => {
            this.handleVictoryContinue();
        });
    }

    // Extraire la logique de continuation vers le magasin
    handleVictoryContinue() {
        // Fermer la modal de combat
        const combatModal = document.getElementById('combat-modal');
        if (combatModal) {
            combatModal.style.display = 'none';
            // Nettoyer l'attribut de modal de victoire
            combatModal.removeAttribute('data-victory-modal');
        }

        // Ouvrir le magasin
        setTimeout(() => {
            const shopModal = document.getElementById('shop-modal');
            if (shopModal) {
                shopModal.style.display = 'block';
                shopModal.classList.add('active');
                // Initialiser le magasin
                this.shopManager.updatePreCombatShop(this);
            }
        }, 500);
    }

    // Extraire la configuration de la modal de victoire
    configureVictoryModal() {
        const combatModal = document.getElementById('combat-modal');
        if (combatModal) {
            // Empêcher la fermeture avec Échap pour la modal de victoire
            combatModal.setAttribute('data-victory-modal', 'true');
        }
    }

    showVictorySummary(baseReward, wealthBonus, equipmentGoldBonus) {
        const totalGold = baseReward + wealthBonus + equipmentGoldBonus;

        // Créer l'encadré de victoire
        const victoryBox = this.createVictorySummaryBox(baseReward, wealthBonus, equipmentGoldBonus, totalGold);

        // Insérer l'encadré dans la modal
        if (this.insertVictoryBoxInModal(victoryBox)) {
            // Animer l'apparition
            this.animateVictoryBox(victoryBox);

            // Attacher les événements
            this.attachVictoryContinueEvent(victoryBox);

            // Configurer la modal
            this.configureVictoryModal();

            console.log('Encadré de victoire ajouté à la modal de combat');
        }
    }

    // Afficher le récapitulatif de partie
    showGameSummary() {
        const gameTime = Math.floor((Date.now() - this.gameStats.startTime) / 1000 / 60); // en minutes
        
        // Trouver l'unité la plus utilisée
        let mostUsedUnit = 'Aucune';
        let mostUsedCount = 0;
        Object.entries(this.gameStats.unitsUsed).forEach(([unitName, count]) => {
            if (count > mostUsedCount) {
                mostUsedUnit = unitName;
                mostUsedCount = count;
            }
        });

        // Créer la modal de récapitulatif
        const summaryModal = document.createElement('div');
        summaryModal.className = 'modal active';
        summaryModal.id = 'game-summary-modal';
        summaryModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>📊 Récapitulatif de Partie</h3>
                    <button class="close-btn">×</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="summary-section">
                            <h4>⚔️ Combats</h4>
                            <p><strong>Combats joués:</strong> ${this.gameStats.combatsPlayed}</p>
                            <p><strong>Victoires:</strong> ${this.gameStats.combatsWon}</p>
                            <p><strong>Défaites:</strong> ${this.gameStats.combatsLost}</p>
                            <p><strong>Taux de victoire:</strong> ${this.gameStats.combatsPlayed > 0 ? Math.round((this.gameStats.combatsWon / this.gameStats.combatsPlayed) * 100) : 0}%</p>
                        </div>
                        <div class="summary-section">
                            <h4>💰 Économie</h4>
                            <p><strong>Or gagné:</strong> ${this.gameStats.goldEarned}💰</p>
                            <p><strong>Or dépensé:</strong> ${this.gameStats.goldSpent}💰</p>
                            <p><strong>Solde actuel:</strong> ${this.gold}💰</p>
                            <p><strong>Unités achetées:</strong> ${this.gameStats.unitsPurchased}</p>
                            <p><strong>Bonus achetés:</strong> ${this.gameStats.bonusesPurchased}</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="summary-section">
                            <h4>🎯 Performance</h4>
                            <p><strong>Dégâts totaux:</strong> ${this.gameStats.totalDamageDealt.toLocaleString()}</p>
                            <p><strong>Meilleur tour:</strong> ${this.gameStats.bestTurnDamage} dégâts (tour ${this.gameStats.bestTurnRound})</p>
                            <p><strong>Rang atteint:</strong> ${this.gameStats.highestRank}</p>
                            <p><strong>Temps de jeu:</strong> ${gameTime} minutes</p>
                        </div>
                        <div class="summary-section">
                            <h4>👥 Unités</h4>
                            <p><strong>Unité la plus jouée:</strong> ${mostUsedUnit} (${mostUsedCount} fois)</p>
                            <p><strong>Unités différentes:</strong> ${Object.keys(this.gameStats.unitsUsed).length}</p>
                        </div>
                    </div>

                    <div class="summary-section">
                        <h4>🏆 Top 5 des Unités Utilisées</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${Object.entries(this.gameStats.unitsUsed)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 5)
                                .map(([unitName, count], index) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 6px;">
                                        <span><strong>${index + 1}.</strong> ${unitName}</span>
                                        <span style="color: #666;">${count} fois</span>
                                    </div>
                                `).join('')}
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn primary new-game-btn">Nouvelle Partie</button>
                        <button class="btn secondary close-modal-btn">Fermer</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(summaryModal);
        
        // Ajouter les gestionnaires d'événements pour les boutons
        const closeBtn = summaryModal.querySelector('.close-btn');
        const newGameBtn = summaryModal.querySelector('.new-game-btn');
        const closeModalBtn = summaryModal.querySelector('.close-modal-btn');
        
        closeBtn.addEventListener('click', () => summaryModal.remove());
        newGameBtn.addEventListener('click', () => {
            this.newGame();
            document.querySelectorAll('.modal').forEach(modal => modal.remove());
        });
        closeModalBtn.addEventListener('click', () => summaryModal.remove());
        
        // Ajouter un gestionnaire d'événements pour fermer avec Échap
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                summaryModal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    calculateRankTarget() {
        const rankIndex = this.RANKS.indexOf(this.rank);
        return 100 + (rankIndex * 25);
    }

    // Gestion des ressources
    addGold(amount) {
        this.gold += amount;
        this.gameStats.goldEarned += amount;
        this.updateUI();
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
            this.gameStats.goldSpent += amount;
            this.updateUI();
            return true;
        }
        return false;
    }
    
    // Mettre à jour le nom de la guilde
    updateGuildName(newName) {
        if (newName && newName.trim() !== '') {
            this.guildName = newName.trim();
            this.updateUI();
        }
    }

    // Gestion des troupes
    addTroop(troop) {
        addTroop(troop, this);
    }

    // Tirer 7 troupes aléatoirement pour le combat
    drawCombatTroops() {
        drawCombatTroops(this);
    }

    // Maintenir 7 troupes disponibles en tirant de nouvelles troupes
    maintainCombatTroops() {
        maintainCombatTroops(this);
    }

    // Sélectionner une troupe pour le combat (max 5)
    selectTroopForCombat(troopIndex) {
        selectTroopForCombat(troopIndex, this);
    }

    // Sélectionner une troupe par son ID
    selectTroopById(troopId) {
        // Trouver la troupe par son ID dans toutes les troupes disponibles
        const allAvailableTroops = [...this.combatTroops, ...this.availableTroops];
        const troopIndex = allAvailableTroops.findIndex(troop => troop.id === troopId);
        
        if (troopIndex !== -1) {
            return selectTroopForCombat(troopIndex, this);
        } else {
            console.warn(`Troupe avec l'ID ${troopId} non trouvée`);
            return false;
        }
    }

    // Désélectionner une troupe du combat
    deselectTroopFromCombat(troopIndex) {
        deselectTroopFromCombat(troopIndex, this);
    }

    // Retirer les troupes utilisées de la sélection ET du pool de combat
    removeUsedTroopsFromCombat(troopsUsed) {
        removeUsedTroopsFromCombat(troopsUsed, this);
    }

    // Vérifier si une unité est permanente (achetée ou transformée)
    isPermanentUnit(troop) {
        return isPermanentUnit(troop);
    }

    // Calcul des synergies (toujours actives)
    calculateSynergies(troops = null) {
        return calculateSynergies(troops, this);
    }

    // Vérifier si une troupe a un type spécifique (gère les types multiples)
    hasTroopType(troop, targetType) {
        return hasTroopType(troop, targetType);
    }

    // Calculer les bonus d'équipement
    calculateEquipmentBonuses() {
        return calculateEquipmentBonuses(this);
    }

    // Appliquer les bonus après combat
    applyCombatBonuses() {
        applyCombatBonuses(this);
    }
    
    // Incrémenter les compteurs de fin de combat pour les bonus dynamiques
    incrementEndOfCombatCounters() {
        if (!this.dynamicBonusStates) {
            this.dynamicBonusStates = {};
        }
        
        // Liste des bonus qui ont des compteurs de fin de combat
        const endOfCombatBonuses = ['economie_dune_vie'];
        
        endOfCombatBonuses.forEach(bonusId => {
            if (this.unlockedBonuses.includes(bonusId)) {
                if (!this.dynamicBonusStates[bonusId]) {
                    this.dynamicBonusStates[bonusId] = {};
                }
                
                // Incrémenter le compteur de fin de combat
                if (!this.dynamicBonusStates[bonusId]['end_of_combat']) {
                    this.dynamicBonusStates[bonusId]['end_of_combat'] = 0;
                }
                this.dynamicBonusStates[bonusId]['end_of_combat'] += 1;
                
                console.log(`🎯 incrementEndOfCombatCounters: ${bonusId} compteur = ${this.dynamicBonusStates[bonusId]['end_of_combat']}`);
            }
        });
    }

    // Débloquer un bonus
    unlockBonus(bonusId) {
        return unlockBonus(bonusId, this);
    }

    // Nettoyer les bonus invalides
    cleanInvalidBonuses() {
        cleanInvalidBonuses(this);
    }

    // Mise à jour de l'interface
    updateUI() {
        // Mettre à jour les informations de base
        document.getElementById('current-rank').textContent = this.rank;
        document.getElementById('gold-amount').textContent = this.gold;
        
        // Mettre à jour le nom de la guilde dans l'input
        const guildNameInput = document.getElementById('guild-name-input');
        if (guildNameInput) {
            guildNameInput.value = this.guildName;
        }
        
        // Mettre à jour l'affichage des troupes dans le header
        this.updateTroopsDisplay();
        
        // Mettre à jour les troupes disponibles pour le combat
        this.updateTroopsUI();
        
        // Mettre à jour les synergies
        this.updateSynergies();
        
        // Mettre à jour les informations de combat
        this.updateCombatInfo();
        
        // Mettre à jour les bonus actifs
        this.updateActiveBonuses();
        
        // Mettre à jour l'affichage des sections
        this.updateSectionDisplay();

        // Mettre à jour l'affichage des consommables
        this.updateConsumablesDisplay();
    }

    // Mettre à jour la jauge de dégâts pour les boss
    updateBossDamageGauge() {
        const bossGauge = document.getElementById('boss-damage-gauge');
        const bossDamageFill = document.getElementById('boss-damage-fill');
        const bossDamageCurrent = document.getElementById('boss-damage-current');
        const bossDamageTarget = document.getElementById('boss-damage-target');
        
        if (this.currentCombat.isActive && this.currentCombat.isBossFight) {
            if (bossGauge) bossGauge.style.display = 'block';
            if (bossDamageCurrent) bossDamageCurrent.textContent = this.currentCombat.totalDamage;
            if (bossDamageTarget) bossDamageTarget.textContent = this.currentCombat.targetDamage;
            if (bossDamageFill) {
                const percentage = Math.min((this.currentCombat.totalDamage / this.currentCombat.targetDamage) * 100, 100);
                bossDamageFill.style.width = `${percentage}%`;
            }
        } else {
            if (bossGauge) bossGauge.style.display = 'none';
        }
    }

    // Extraire la mise à jour des éléments de base de la modal
    updateCombatModalBasicElements() {
        const combatTarget = document.getElementById('combat-target');
        const combatProgress = document.getElementById('combat-progress');
        const modalHeader = document.querySelector('#combat-modal .modal-header h3');
        
        if (combatTarget) {
            combatTarget.textContent = this.currentCombat.targetDamage;
        }
        
        if (combatProgress) {
            combatProgress.style.width = '0%';
        }
        
        if (modalHeader) {
            if (this.currentCombat.isBossFight) {
                modalHeader.textContent = `Boss: ${this.currentCombat.bossName}`;
            } else {
                modalHeader.textContent = `Combat: ${this.getEnemyName()}`;
            }
        }
    }

    // Extraire la mise à jour de l'image de l'ennemi
    updateCombatModalEnemyImage() {
        const enemyImageModal = document.getElementById('enemy-image-modal');
        
        if (enemyImageModal) {
            if (this.currentCombat.isBossFight) {
                enemyImageModal.src = 'assets/orcs.jpg';
            } else {
                enemyImageModal.src = getEnemyImage(this.rank);
            }
        }
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

    // Extraire la création du contenu du malus de boss
    createBossMalusContent() {
        const bossMalusContent = document.createElement('div');
        bossMalusContent.style.cssText = `
            position: relative;
            z-index: 1;
        `;
        
        const bossTitle = document.createElement('div');
        bossTitle.style.cssText = `
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        `;
        bossTitle.textContent = '⚠️ MALUS DE BOSS ⚠️';
        
        const bossName = document.createElement('div');
        bossName.style.cssText = `
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        bossName.textContent = this.currentCombat.bossName;
        
        const bossEffect = document.createElement('div');
        bossEffect.style.cssText = `
            font-size: 1rem;
            font-style: italic;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        bossEffect.textContent = this.currentCombat.bossMechanic;
        
        bossMalusContent.appendChild(bossTitle);
        bossMalusContent.appendChild(bossName);
        bossMalusContent.appendChild(bossEffect);
        
        return bossMalusContent;
    }

    // Extraire la création de l'encart de malus de boss
    createBossMalusContainer() {
        const bossMalusContainer = document.createElement('div');
        bossMalusContainer.className = 'boss-malus-modal';
        bossMalusContainer.style.cssText = `
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            border: 3px solid #c44569;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 15px;
            color: white;
            text-align: center;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        `;
        
        // Ajouter un effet de brillance
        const shine = this.createShineEffect();
        bossMalusContainer.appendChild(shine);
        
        // Ajouter le contenu
        const bossMalusContent = this.createBossMalusContent();
        bossMalusContainer.appendChild(bossMalusContent);
        
        return bossMalusContainer;
    }

    // Extraire la création du log de combat initial
    createInitialCombatLog() {
        const combatLog = document.getElementById('combat-log');
        if (!combatLog) return;
        
        combatLog.innerHTML = '';
        
        // Ajouter les informations initiales du combat
        if (this.currentCombat.isBossFight) {
            // Créer un encart spécial pour le malus de boss en premier
            const bossMalusContainer = this.createBossMalusContainer();
            
            // Insérer le malus de boss en premier dans le log
            combatLog.appendChild(bossMalusContainer);
            
            // Ajouter l'objectif après le malus
            this.addCombatLog(`Objectif: ${this.currentCombat.targetDamage} dégâts`, 'info');
        } else {
            this.addCombatLog(`Combat contre ${this.getEnemyName()} !`, 'info');
            this.addCombatLog(`Objectif: ${this.currentCombat.targetDamage} dégâts`, 'info');
        }
    }

    updateCombatModal() {
        // Mettre à jour les éléments de base
        this.updateCombatModalBasicElements();
        
        // Mettre à jour l'image de l'ennemi
        this.updateCombatModalEnemyImage();
        
        // Créer le log de combat initial
        this.createInitialCombatLog();
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
    
    // Mettre à jour l'affichage de la progression du combat
    updateCombatProgressDisplay() {
        const combatProgressContainer = document.getElementById('combat-progress-container');
        
        // Afficher la barre pour tous les combats, y compris les boss
        if (this.currentCombat.isActive) {
            if (!combatProgressContainer) {
                // Créer le conteneur de progression s'il n'existe pas
                const newContainer = this.createCombatProgressDisplay();
                this.insertCombatProgressContainer(newContainer);
            } else {
                // Mettre à jour l'affichage existant
                this.updateExistingCombatProgress();
            }
        } else {
            // Supprimer l'affichage si le combat n'est pas actif
            if (combatProgressContainer) {
                combatProgressContainer.remove();
            }
        }
    }

    // Extraire la création du conteneur de progression
    createCombatProgressContainer() {
        const newContainer = document.createElement('div');
        newContainer.id = 'combat-progress-container';
        newContainer.className = 'combat-progress-container';
        newContainer.style.cssText = `
            background: ${this.currentCombat.isBossFight ? '#fff3cd' : '#f8f9fa'};
            border: 2px solid ${this.currentCombat.isBossFight ? '#ffc107' : '#dee2e6'};
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        `;
        return newContainer;
    }

    // Extraire la création du titre et de la mécanique
    createCombatProgressTitle() {
        const title = document.createElement('h4');
        title.style.cssText = `
            color: ${this.currentCombat.isBossFight ? '#856404' : '#2d3436'};
            margin-bottom: 10px;
            font-size: 1.1rem;
        `;
        title.textContent = this.currentCombat.isBossFight ? 
            `BOSS: ${this.currentCombat.bossName}` : 'Progression du Combat';
        
        return title;
    }



    // Extraire la création de la barre de progression
    createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.cssText = `
            width: 100%;
            height: 20px;
            background: #ddd;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 8px;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.id = 'combat-progress-fill';
        progressFill.className = 'progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: ${this.currentCombat.isBossFight ? 'linear-gradient(45deg, #ffc107, #ff8c00)' : 'linear-gradient(45deg, #74b9ff, #0984e3)'};
            transition: width 0.3s ease;
            width: 0%;
        `;
        
        const progressText = document.createElement('div');
        progressText.style.cssText = `
            text-align: center;
            font-weight: 600;
            color: ${this.currentCombat.isBossFight ? '#856404' : '#2d3436'};
            font-size: 1rem;
        `;
        progressText.innerHTML = `
            ${this.currentCombat.totalDamage} / ${this.currentCombat.targetDamage} dégâts 
            (Tour ${this.currentCombat.round}/${this.currentCombat.maxRounds})
        `;
        
        progressBar.appendChild(progressFill);
        
        return { progressBar, progressText };
    }

    // Extraire la création de l'image de l'ennemi
    createEnemyImage() {
        const enemyImage = document.createElement('img');
        enemyImage.style.cssText = `
            width: 250px;
            height: 250px;
            object-fit: cover;
            border-radius: 8px;
            border: 3px solid #e74c3c;
            margin: 10px auto;
            display: block;
        `;
        
        // Déterminer l'image selon le rang
        if (this.BOSS_RANKS.includes(this.rank)) {
            enemyImage.src = 'assets/orcs.jpg';
        } else {
            enemyImage.src = getEnemyImage(this.rank);
        }
        
        return enemyImage;
    }

    // Extraire la création complète du conteneur de progression
    createCombatProgressDisplay() {
        const newContainer = this.createCombatProgressContainer();
        const title = this.createCombatProgressTitle();
        const mechanicText = this.bossManager.createBossMechanicElement();
        const { progressBar, progressText } = this.createProgressBar();
        const enemyImage = this.createEnemyImage();
        
        // Vérifier si Quilegan est actif et créer l'indicateur
        const quileganIndicator = this.bossManager.createQuileganIndicator();
        
        if (quileganIndicator) {
            // Ajouter l'indicateur en premier dans le conteneur
            newContainer.appendChild(quileganIndicator);
        }
        
        // Assembler les éléments
        // Ne pas ajouter la mécanique du boss si Quilegan est actif (déjà présente dans l'indicateur)
        if (mechanicText && !this.bossManager.isQuileganActive()) {
            newContainer.appendChild(mechanicText);
        }
        newContainer.appendChild(title);
        newContainer.appendChild(progressBar);
        newContainer.appendChild(progressText);
        newContainer.appendChild(enemyImage);
        
        return newContainer;
    }

    // Extraire la mise à jour de l'affichage existant
    updateExistingCombatProgress() {
        const combatProgressContainer = document.getElementById('combat-progress-container');
        if (!combatProgressContainer) return;
        
        const title = combatProgressContainer.querySelector('h4');
        const progressFill = combatProgressContainer.querySelector('#combat-progress-fill');
        const progressText = combatProgressContainer.querySelector('div:nth-last-child(2)'); // Avant l'image
        const enemyImage = combatProgressContainer.querySelector('img');
        
        // Vérifier si Quilegan est actif et mettre à jour l'indicateur
        const isQuileganActive = this.currentCombat && 
                                 this.currentCombat.isBossFight && 
                                 this.currentCombat.bossName === 'Quilegan';
        
        if (isQuileganActive) {
            let quileganIndicator = combatProgressContainer.querySelector('.quilegan-progress-indicator');
            
            if (!quileganIndicator) {
                // Créer l'indicateur s'il n'existe pas
                quileganIndicator = document.createElement('div');
                quileganIndicator.className = 'quilegan-progress-indicator';
                combatProgressContainer.insertBefore(quileganIndicator, combatProgressContainer.firstChild);
                console.log('🐛 Quilegan: Indicateur créé dans le conteneur de progression');
            }
            
            // Mettre à jour l'indicateur
            quileganIndicator.style.cssText = `
                background: ${this.bossManager.isBossMalusDisabled() ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #e74c3c, #c0392b)'};
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                margin-bottom: 10px;
                font-weight: bold;
                text-align: center;
                border: 2px solid ${this.bossManager.isBossMalusDisabled() ? '#28a745' : '#e74c3c'};
                font-size: 0.9rem;
            `;
            
            quileganIndicator.innerHTML = `
                🎯 <strong>Quilegan:</strong> ${this.bossManager.isBossMalusDisabled() ? 'MÉCANIQUE DÉSACTIVÉE' : 'MÉCANIQUE ACTIVE'}
                <br><small>${this.bossManager.isBossMalusDisabled() ? 'Bonus vendu - malus désactivé' : 'Bloque les relances, bonus, synergies et dégâts tant qu\'aucun bonus n\'est vendu'}</small>
            `;
            
            console.log(`🐛 Quilegan: Indicateur mis à jour - bonusSoldThisCombat = ${this.bossManager.isBossMalusDisabled()}`);
        } else {
            // Supprimer l'indicateur s'il existe mais que Quilegan n'est plus actif
            const existingIndicator = combatProgressContainer.querySelector('.quilegan-progress-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
        }
        
        // Mettre à jour le titre
        if (title) {
            title.textContent = this.currentCombat.isBossFight ? 
                `BOSS: ${this.currentCombat.bossName}` : 'Progression du Combat';
        }
        
        // Mettre à jour l'image si elle existe
        if (enemyImage) {
            if (this.BOSS_RANKS.includes(this.rank)) {
                enemyImage.src = 'assets/orcs.jpg';
            } else {
                enemyImage.src = getEnemyImage(this.rank);
            }
        }
        
        // Mettre à jour ou créer la mécanique du boss (sauf pour Quilegan)
        if (!isQuileganActive) {
            this.updateBossMechanicDisplay(combatProgressContainer, title);
        } else {
            // Supprimer la mécanique du boss si Quilegan est actif (remplacée par l'indicateur)
            const existingMechanic = combatProgressContainer.querySelector('.boss-mechanic');
            if (existingMechanic) {
                existingMechanic.remove();
            }
        }
        
        // Mettre à jour la barre de progression
        if (progressFill) {
            const percentage = Math.min((this.currentCombat.totalDamage / this.currentCombat.targetDamage) * 100, 100);
            progressFill.style.width = `${percentage}%`;
        }
        
        // Mettre à jour le texte de progression
        if (progressText) {
            progressText.innerHTML = `
                ${this.currentCombat.totalDamage} / ${this.currentCombat.targetDamage} dégâts 
                (Tour ${this.currentCombat.round}/${this.currentCombat.maxRounds})
            `;
        }
    }

    // Extraire la mise à jour de la mécanique du boss
    updateBossMechanicDisplay(container, title) {
        if (!this.currentCombat.isBossFight || !this.currentCombat.bossMechanic) {
            return;
        }
        
        // Chercher l'élément mécanique existant
        const existingMechanic = container.querySelector('.boss-mechanic');
        
        if (existingMechanic) {
            // Mettre à jour l'élément existant
            existingMechanic.textContent = `Mécanique: ${this.currentCombat.bossMechanic}`;
        } else {
            // Créer un nouvel élément
            const newMechanicText = this.bossManager.createBossMechanicElement();
            if (newMechanicText) {
                container.insertBefore(newMechanicText, title.nextSibling);
            }
        }
    }

    // Extraire l'insertion du conteneur dans le DOM
    insertCombatProgressContainer(newContainer) {
        // Insérer avant les troupes sélectionnées
        const troopsSelected = document.querySelector('.troops-selected');
        if (troopsSelected) {
            troopsSelected.parentNode.insertBefore(newContainer, troopsSelected);
        }
    }

    updateTroopsUI() {
        // Utiliser le système de tri si un tri est actif
        if (this.unitSorter && this.unitSorter.currentSort !== 'none') {
            this.unitSorter.applySort(this);
        } else {
            updateTroopsUI(this);
        }
        
        // Mettre à jour l'affichage du bouton de relance
        if (this.unitSorter) {
            this.unitSorter.updateRerollButton();
        }
    }

    createTroopCard(troop, index, isSelected) {
        return createTroopCard(troop, index, isSelected, this);
    }

    updateSynergies() {
        updateSynergies(this);
    }

    // Mettre à jour les informations de combat
    updateCombatInfo() {
        const targetDisplay = document.getElementById('combat-target-display');
        const enemyName = document.getElementById('combat-enemy-name');
        const bossMechanicDisplay = document.getElementById('boss-mechanic-display');
        const bossName = document.getElementById('boss-name');
        const bossMechanicText = document.getElementById('boss-mechanic-text');
        const enemyImage = document.getElementById('enemy-image');
        const enemyImageModal = document.getElementById('enemy-image-modal');
        
        // Éléments pour l'affichage en combat (modal de combat)
        const combatModal = document.getElementById('combat-modal');
        const combatLog = document.getElementById('combat-log');

        // Calculer l'objectif de dégâts même sans combat actif
        let targetDamage = 0;
        let isBossFight = false;
        let selectedBoss = null;
        
        if (this.currentCombat && this.currentCombat.isActive) {
            // Combat actif en cours
            targetDamage = this.currentCombat.targetDamage;
            isBossFight = this.currentCombat.isBossFight;
            if (isBossFight) {
                selectedBoss = {
                    name: this.currentCombat.bossName,
                    mechanic: this.currentCombat.bossMechanic,
                    targetDamage: this.currentCombat.targetDamage
                };
            }
        } else {
            // Calculer l'objectif pour le prochain combat
            isBossFight = this.BOSS_RANKS.includes(this.rank);
            if (isBossFight) {
                // Utiliser le boss mémorisé ou en sélectionner un nouveau selon le rang si pas encore fait
                if (!this.displayBoss) {
                    this.displayBoss = this.bossManager.selectBossForRank(this.rank);
                }
                selectedBoss = this.displayBoss;
                targetDamage = this.bossManager.calculateBossTargetDamageByRank(selectedBoss, this.rank);
            } else {
                // Objectif normal basé sur le rang
                targetDamage = this.calculateTargetDamageByRank(this.rank);
            }
        }

        targetDisplay.textContent = targetDamage;

        // Déterminer le nom de l'ennemi et l'image correspondante
        let enemyNameText = 'Troupes de gobelin';
        let enemyImageSrc = 'assets/gobelin.jpg';
        
        if (isBossFight) {
            enemyNameText = selectedBoss ? selectedBoss.name : 'Boss';
            enemyImageSrc = 'assets/orcs.jpg'; // Image pour les boss
        } else {
            // Utiliser les données centralisées des ennemis
            const enemyInfo = getEnemyData(this.rank);
            enemyNameText = enemyInfo.name;
            enemyImageSrc = enemyInfo.image;
        }
        
        if (enemyName) enemyName.textContent = enemyNameText;
        
        // Mettre à jour les images
        if (enemyImage) enemyImage.src = enemyImageSrc;
        if (enemyImageModal) enemyImageModal.src = enemyImageSrc;

        // Afficher les informations de boss si c'est un combat de boss
        if (isBossFight && bossMechanicDisplay) {
            bossMechanicDisplay.style.display = 'block';
            if (bossName) bossName.textContent = selectedBoss ? selectedBoss.name : 'Boss';
            
            // Vérifier si c'est Quilegan et si un bonus a été vendu
            const isQuilegan = selectedBoss && selectedBoss.name === 'Quilegan';
            const shouldDisable = isQuilegan && this.bossManager.isBossMalusDisabled();
            
            // Debug pour vérifier l'état
            if (isQuilegan) {
                console.log('🐛 Quilegan détecté:', {
                    bossName: selectedBoss.name,
                    bonusSoldThisCombat: this.bossManager.isBossMalusDisabled(),
                    shouldDisable: shouldDisable
                });
            }
            
            if (bossMechanicText) {
                const mechanicText = selectedBoss ? selectedBoss.mechanic : 'Mécanique spéciale de boss';
                bossMechanicText.textContent = mechanicText;
            }
            
            // Appliquer la classe CSS pour désactiver visuellement la mécanique
            if (bossMechanicDisplay) {
                if (shouldDisable) {
                    bossMechanicDisplay.classList.add('disabled');
                    console.log('🐛 Quilegan: Classe "disabled" ajoutée à la mécanique');
                } else {
                    bossMechanicDisplay.classList.remove('disabled');
                    console.log('🐛 Quilegan: Classe "disabled" retirée de la mécanique');
                }
            }
            
            // Afficher l'état de la mécanique dans le log de combat si en combat
            if (this.currentCombat && this.currentCombat.isActive && isQuilegan && combatLog) {
                // Supprimer les anciens messages de mécanique
                const existingMechanicMessages = combatLog.querySelectorAll('.boss-mechanic-status');
                existingMechanicMessages.forEach(msg => msg.remove());
                
                // Créer un nouveau message
                const mechanicStatus = document.createElement('div');
                mechanicStatus.className = 'boss-mechanic-status log-entry';
                mechanicStatus.style.color = shouldDisable ? '#28a745' : '#e74c3c';
                mechanicStatus.style.fontWeight = 'bold';
                mechanicStatus.innerHTML = `🎯 <strong>Quilegan:</strong> ${shouldDisable ? 'Mécanique DÉSACTIVÉE' : 'Mécanique ACTIVE'} - ${selectedBoss.mechanic}`;
                
                // Insérer au début du log
                if (combatLog.firstChild) {
                    combatLog.insertBefore(mechanicStatus, combatLog.firstChild);
                } else {
                    combatLog.appendChild(mechanicStatus);
                }
            }
            
            // Afficher l'état de la mécanique dans l'en-tête si Quilegan est actif
            if (isQuilegan) {
                this.bossManager.updateQuileganStatusDisplay(shouldDisable, selectedBoss.mechanic);
                // Mettre à jour aussi l'indicateur dans le conteneur de progression de combat
                this.updateCombatProgressDisplay();
            }
        } else if (bossMechanicDisplay) {
            bossMechanicDisplay.style.display = 'none';
        }
    }

    // Définitions centralisées des bonus
    getBonusDescriptions() {
        return getBonusDescriptions();
    }

    // Mettre à jour les bonus actifs
    updateActiveBonuses() {
        updateActiveBonuses(this, this.shopManager);
    }

    // Gérer l'affichage des sections
    updateSectionDisplay() {
        const preCombatSection = document.getElementById('pre-combat-section');
        const combatSection = document.getElementById('combat-section');

        if (!preCombatSection || !combatSection) return;

        if (this.currentCombat.isActive) {
            // Combat en cours : afficher la section des troupes
            preCombatSection.style.display = 'none';
            combatSection.style.display = 'block';
        } else {
            // Pas de combat : afficher la section avant combat
            preCombatSection.style.display = 'block';
            combatSection.style.display = 'none';
            
            // Mettre à jour le magasin avant combat
            this.shopManager.updatePreCombatShop(this);
        }
    }

    // Déléguer les notifications au NotificationManager
    showNotification(message, type = 'info') {
        this.notificationManager.showNotification(message, type);
    }

    // Déléguer la sauvegarde au SaveManager
    save() {
        this.saveManager.save(this);
    }

    // Déléguer le chargement au SaveManager
    load() {
        return this.saveManager.load(this);
    }

    // Déléguer la création d'une nouvelle partie au SaveManager
    newGame() {
        this.saveManager.newGame(this);
    }

    // === SYSTÈME DE CONSOMMABLES ===

    // Déléguer les méthodes de consommables au ConsumableManager
    addConsumable(consumableType) {
        this.consumableManager.addConsumable(consumableType, this);
    }

    useConsumable(consumableId) {
        return this.consumableManager.useConsumable(consumableId, this);
    }

    updateConsumablesDisplay() {
        this.consumableManager.updateConsumablesDisplay(this);
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

    // Afficher les troupes dans le header
    updateTroopsDisplay() {
        updateTroopsDisplay(this);
    }

    // Changer la vitesse d'animation

    






    // Fonction de debug pour changer le rang depuis la console
    setupDebugFunctions() {
        // Fonction globale pour changer le rang
        window.setRank = (newRank) => {
            if (RANKS.includes(newRank)) {
                this.currentRank = newRank;
                this.updateUI();
                console.log(`✅ Rang changé vers : ${newRank}`);
                return true;
            } else {
                console.error(`❌ Rang invalide : ${newRank}`);
                console.log(`📋 Rangs disponibles : ${RANKS.join(', ')}`);
                return false;
            }
        };

        // Fonction globale pour afficher le rang actuel
        window.getRank = () => {
            console.log(`🎯 Rang actuel : ${this.currentRank}`);
            return this.currentRank;
        };

        // Fonction globale pour lister tous les rangs
        window.listRanks = () => {
            console.log(`📋 Tous les rangs : ${RANKS.join(', ')}`);
            return RANKS;
        };

        // Fonction globale pour obtenir des informations de debug
        window.debugInfo = () => {
            console.log('🔍 Informations de debug :');
            console.log(`- Rang actuel : ${this.currentRank}`);
            console.log(`- Or : ${this.gold}`);
            console.log(`- Troupes possédées : ${Object.keys(this.ownedUnits).length}`);
            console.log(`- Bonus débloqués : ${this.unlockedBonuses.length}`);
            console.log(`- Consommables : ${this.consumableManager.consumables.length}`);
            console.log(`- Combat en cours : ${this.currentCombat ? 'Oui' : 'Non'}`);
            if (this.currentCombat) {
                console.log(`  - Boss : ${this.currentCombat.isBossFight ? this.currentCombat.bossName : 'Non'}`);
                console.log(`  - Bonus vendu : ${this.bossManager.isBossMalusDisabled() ? 'Oui' : 'Non'}`);
            }
        };

        // Fonction globale pour ajouter de l'or
        window.addGoldDebug = (amount) => {
            this.addGold(amount);
            console.log(`💰 ${amount} or ajouté ! Nouveau total : ${this.gold}`);
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
            console.log(`🎁 Tous les bonus débloqués ! (${allBonusIds.length} bonus)`);
        };

        // Fonction globale pour ajouter toutes les troupes
        window.addAllTroops = () => {
            const allUnits = this.getAllAvailableTroops();
            allUnits.forEach(unit => {
                this.ownedUnits[unit.name] = (this.ownedUnits[unit.name] || 0) + 1;
            });
            this.updateUI();
            console.log(`⚔️ Toutes les troupes ajoutées ! (${allUnits.length} unités)`);
        };

        console.log('🐛 Fonctions de debug disponibles :');
        console.log('- setRank("rang") : Changer le rang');
        console.log('- getRank() : Afficher le rang actuel');
        console.log('- listRanks() : Lister tous les rangs');
        console.log('- debugInfo() : Informations de debug');
        console.log('- addGoldDebug(amount) : Ajouter de l\'or');
        console.log('- unlockAllBonuses() : Débloquer tous les bonus');
        console.log('- addAllTroops() : Ajouter toutes les troupes');
    }
} 