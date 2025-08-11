// CombatManager.js - Gestion centralisée du combat
import { ModalManager } from './ModalManager.js';
import { getEnemyData, getEnemyImage, getEnemyName } from './constants/combat/GameConstants.js';
import { drawCombatTroops, maintainCombatTroops, selectTroopForCombat, deselectTroopFromCombat, removeUsedTroopsFromCombat, isPermanentUnit, calculateSynergies, hasTroopType, calculateEquipmentBonuses, applyCombatBonuses } from './UnitManager.js';
import { incrementDynamicBonus } from '../utils/DynamicBonusUtils.js';

export class CombatManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // Validation et préparation du tour de combat
    validateCombatTurn() {
        if (!this.gameState.currentCombat.isActive || this.gameState.selectedTroops.length === 0) {
            return { valid: false, message: 'Aucune troupe sélectionnée' };
        }
        return { valid: true };
    }

    // Préparation des troupes pour le tour
    prepareTroopsForTurn() {
        // Copier les troupes sélectionnées pour l'animation
        const troopsUsed = [...this.gameState.selectedTroops];
        const turnDamage = this.gameState.calculateTurnDamage(troopsUsed);
        
        return { troopsUsed, turnDamage };
    }

    // Mise à jour des statistiques de combat
    updateCombatStatistics(troopsUsed, turnDamage) {
        // Debug: Afficher les unités disponibles à chaque round
        this.debugAvailableUnits();
        
        // Mettre à jour les dégâts totaux
        this.gameState.currentCombat.totalDamage += turnDamage;
        this.gameState.currentCombat.round++;
        
        // Déléguer vers StatisticsManager
        this.gameState.statisticsManager.updateCombatStatistics(troopsUsed, turnDamage);
        
        // Mettre à jour le combat-log avec les dégâts du tour
        this.gameState.updateCombatModalProgress();
    }

    // Gestion des troupes après le tour
    handleTroopsAfterTurn() {
        // Retirer les troupes utilisées
        this.gameState.selectedTroops = [];
    }

    // Vérification de fin de combat
    checkCombatEnd() {
        if (this.gameState.currentCombat.totalDamage >= this.gameState.currentCombat.targetDamage) {
            setTimeout(() => {
                this.gameState.endCombat(true);
            }, 1000);
            return true;
        }
        
        if (this.gameState.currentCombat.round >= this.gameState.currentCombat.maxRounds) {
            setTimeout(() => {
                this.gameState.endCombat(false);
            }, 1000);
            return true;
        }
        
        return false;
    }

    // Mise à jour de l'UI après animation
    updateUIAfterAnimation() {
        this.gameState.updateCombatProgressDisplay();
        this.gameState.uiManager.updateUIAfterAnimation();
    }

    // Exécution d'un tour de combat
    executeCombatTurn() {
        // Log détaillé pour debug round 1
        if (this.gameState.currentCombat.round === 0) {
            console.log('[DEBUG] Début du premier round');
            console.log('selectedTroops:', this.gameState.selectedTroops);
            console.log('combatTroops:', this.gameState.combatTroops);
            console.log('usedTroopsThisCombat:', this.gameState.usedTroopsThisCombat);
        }
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
            total: this.gameState.currentCombat.totalDamage 
        };
    }

    // Debug: Afficher les unités disponibles
    debugAvailableUnits() {
        // Méthode de debug silencieuse
    }

    // Gestion de l'animation de combat
    handleCombatAnimation(troopsUsed, turnDamage) {
        this.gameState.animationManager.handleCombatAnimation(troopsUsed, turnDamage);
    }

    // Initialisation de l'animation de combat
    initializeCombatAnimation() {
        return this.gameState.animationManager.initializeCombatAnimation();
    }

    // Configuration de l'événement de fermeture
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
            this.updateUIAfterAnimation();
            
            // Vérifier si le combat est terminé après fermeture
            if (this.gameState.currentCombat.totalDamage >= this.gameState.currentCombat.targetDamage) {
                setTimeout(() => {
                    this.gameState.endCombat(true);
                }, 500);
            } else if (this.gameState.currentCombat.round >= this.gameState.currentCombat.maxRounds) {
                setTimeout(() => {
                    this.gameState.endCombat(false);
                }, 500);
            }
        };
        closeButton.addEventListener('click', closeAnimation);
    }

    // Réinitialisation des compteurs
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

    // Initialisation du compteur principal
    initializeMainCounter(previousDamage) {
        const previousPercentage = Math.min((previousDamage / this.gameState.currentCombat.targetDamage) * 100, 100);
        
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
        if (!this.gameState.currentCombat.isActive) return;

        this.gameState.currentCombat.isActive = false;
        this.gameState.currentCombat.round = 0;

        // Mettre à jour les statistiques de combat via StatisticsManager
        this.gameState.statisticsManager.updateEndCombatStatistics(victory);
        if (!victory) {
            // Afficher le récapitulatif de partie en cas de défaite
            this.gameState.showGameSummary();
        }

        if (victory) {
            // Vérifier si c'est une victoire contre Quilegan (fin du jeu normal)
            const isQuileganVictory = this.gameState.currentCombat.isBossFight && 
                                    this.gameState.currentCombat.bossName === 'Quilegan' &&
                                    !this.gameState.isInfiniteMode;
            
            if (isQuileganVictory) {
                // Afficher la popup de fin de jeu
                this.showGameCompletionModal();
                return;
            }
            
            // Récompense de base augmentée (+18%)
            const baseReward = this.gameState.currentCombat.isBossFight ? 89 : 59;
            this.gameState.addGold(baseReward);
            
            // Bonus de richesse
            const wealthBonus = this.gameState.calculateWealthBonus();
            this.gameState.addGold(wealthBonus);
            
            // Incrémenter les compteurs de fin de combat pour les bonus dynamiques AVANT de calculer les bonus d'or
            this.gameState.incrementEndOfCombatCounters();
            
            // Calculer les bonus d'or des bonus d'équipement (après l'incrémentation)
            const equipmentGoldBonus = this.gameState.calculateEquipmentGoldBonus();
            this.gameState.addGold(equipmentGoldBonus);
            
            // Monter de rang après victoire
            if (this.gameState.isInfiniteMode) {
                this.gameState.gainInfiniteRank();
            } else {
                this.gameState.gainRank();
            }
            
            // Appliquer les bonus de base après combat
            this.gameState.applyCombatBonuses();
            
            // S'assurer que la modal de combat est affichée
            ModalManager.showModal('combat-modal', { preventClose: true });
            
            // Mettre à jour les informations de boss dans next-combat-info après l'ouverture de la modal
            setTimeout(() => {
                let isBossFight = false;
                let selectedBoss = null;
                let isQuilegan = false;
                let shouldDisable = false;
                
                if (this.gameState.isInfiniteMode) {
                    isBossFight = this.gameState.isInfiniteBossFight();
                } else {
                    isBossFight = this.gameState.BOSS_RANKS.includes(this.gameState.rank);
                }
                
                if (isBossFight) {
                    selectedBoss = this.gameState.displayBoss || this.gameState.bossManager.selectBossForRank(this.gameState.rank);
                    isQuilegan = selectedBoss && selectedBoss.name === 'Quilegan';
                    shouldDisable = isQuilegan && this.gameState.bossManager.isBossMalusDisabled();
                }
                
                // La gestion de l'affichage de la mécanique de boss est maintenant centralisée dans UIManager
                // UIManager.updateNextCombatDisplay() sera appelée via updateUI()
            }, 100); // Petit délai pour s'assurer que la modal est complètement ouverte
            
            // Afficher l'encadré de victoire avec le détail des récompenses
            this.showVictorySummary(baseReward, wealthBonus, equipmentGoldBonus);
        } else {
            this.gameState.notificationManager.showDefeat();
        }

        // Vider les troupes après combat
        this.gameState.combatTroops = [];
        this.gameState.selectedTroops = [];
        this.gameState.usedTroopsThisCombat = [];

        // Réinitialiser le magasin pour qu'il se régénère
        this.gameState.shopManager.resetShop();
        
        // Réinitialiser le coût de rafraîchissement après chaque combat
        this.gameState.shopManager.shopRefreshCount = 0;
        this.gameState.shopManager.shopRefreshCost = 10;

        // Nettoyage de l'affichage délégué à UIManager

        this.gameState.updateUI();
        
        // Tirer de nouvelles troupes pour le prochain combat
        this.gameState.drawCombatTroops();
        
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
                ModalManager.hideModal('combat-modal', { force: true });
            }, 3000);
        }
    }

    // Créer le contenu des récompenses
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
                <p class="rank-progression">Vous passez au rang : <strong>${this.gameState.rank}</strong></p>
            </div>
        `;
    }

    // Créer l'encadré de victoire
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

    // Insérer l'encadré dans la modal
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

    // Animer l'apparition de l'encadré
    animateVictoryBox(victoryBox) {
        setTimeout(() => {
            victoryBox.classList.add('show');
        }, 100);
    }

    // Attacher les événements du bouton continuer
    attachVictoryContinueEvent(victoryBox) {
        const continueBtn = victoryBox.querySelector('.victory-continue-btn');
        if (!continueBtn) return;

        continueBtn.addEventListener('click', () => {
            this.handleVictoryContinue();
        });
    }

    // Gérer la continuation vers le magasin
    handleVictoryContinue() {
        // Fermer la modal de combat
        ModalManager.hideModal('combat-modal', { force: true });

        // Ouvrir le magasin
        setTimeout(() => {
            // Initialiser le magasin
            this.gameState.shopManager.updatePreCombatShop(this.gameState);
        }, 500);
    }

    // Configurer la modal de victoire
    configureVictoryModal() {
        const combatModal = document.getElementById('combat-modal');
        if (combatModal) {
            // Empêcher la fermeture avec Échap pour la modal de victoire
            combatModal.setAttribute('data-victory-modal', 'true');
        }
    }

    // Afficher le résumé de victoire
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

    
        }
    }

    // Calculer les dégâts d'un tour (NOUVELLE LOGIQUE)
    calculateTurnDamage(troops) {
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        // 1. Appliquer les bonus/malus à chaque unité
        for (let i = 0; i < troops.length; i++) {
            const troop = troops[i];
            
            // Vérifier si la troupe a déjà été utilisée dans ce rang
            if (this.gameState.usedTroopsThisCombat.includes(troop.id)) {
                continue; // Passer cette troupe
            }

            let unitDamage = troop.damage;
            let unitMultiplier = troop.multiplier;
            
            // Appliquer les bonus d'équipement (sauf les bonus de position)
            const equipmentBonuses = this.gameState.calculateEquipmentBonuses();
            equipmentBonuses.forEach(bonus => {
                if (bonus.type !== 'position_bonus') {
                    if (bonus.target === 'all' || this.gameState.hasTroopType(troop, bonus.target)) {
                        if (bonus.damage) unitDamage += bonus.damage;
                        if (bonus.multiplier) unitMultiplier += bonus.multiplier;
                    }
                }
            });
            
            // Appliquer les mécaniques de boss (après les bonus)
            if (this.gameState.currentCombat.isBossFight) {
                unitDamage = this.gameState.bossManager.applyBossMechanics(unitDamage, troop);
                unitMultiplier = this.gameState.bossManager.applyBossMechanicsToMultiplier(unitMultiplier, troop);
            }
            
            // Appliquer le bonus "Position Quatre" si c'est la 4ème unité
            const positionBonuses = this.gameState.calculateEquipmentBonuses().filter(bonus => bonus.type === 'position_bonus');
            if (positionBonuses.length > 0 && i === 3) { // 4ème position (index 3)
                positionBonuses.forEach(bonus => {
                    if (bonus.target === 'fourth_position') {
                        unitMultiplier = unitMultiplier * bonus.positionMultiplier;
                    }
                });
            }
            
            // Accumuler les dégâts et multiplicateurs
            totalDamage += unitDamage;
            totalMultiplier += unitMultiplier;
            
            // Marquer la troupe comme utilisée dans ce rang
            this.gameState.usedTroopsThisCombat.push(troop.id);
        }
        
        // 2. Appliquer les synergies sur le total (une seule fois)
        const synergies = this.gameState.calculateSynergies(troops);
        synergies.forEach(synergy => {
            if (synergy.bonus.target === 'all') {
                if (synergy.bonus.damage) totalDamage += synergy.bonus.damage;
                if (synergy.bonus.multiplier) totalMultiplier += synergy.bonus.multiplier;
            }
        });

        // 3. Retirer les troupes utilisées du pool de combat
        this.gameState.removeUsedTroopsFromCombat(troops);
        
        // 4. Calculer le total final
        let finalDamage = totalDamage * totalMultiplier;
        
        // 5. Appliquer le malus de Quilegan à la fin (après tous les calculs)
        if (this.gameState.currentCombat && this.gameState.currentCombat.isBossFight && 
            this.gameState.currentCombat.bossMechanic.includes('Bloque les relances, les bonus, les synergies et les dégâts des unités tant qu\'aucun bonus n\'est vendu')) {
            if (!this.gameState.bossManager.isBossMalusDisabled()) {
                finalDamage = 0;
            }
        }
        
        return Math.round(finalDamage);
    }

    // Gestion des troupes de combat
    drawCombatTroops() {
        drawCombatTroops(this.gameState);
    }

    maintainCombatTroops() {
        maintainCombatTroops(this.gameState);
    }

    selectTroopForCombat(troopIndex) {
        return selectTroopForCombat(troopIndex, this.gameState);
    }

    selectTroopById(troopId) {
        // Trouver la troupe par son ID dans toutes les troupes disponibles
        const allAvailableTroops = [...this.gameState.combatTroops, ...this.gameState.availableTroops];
        const troopIndex = allAvailableTroops.findIndex(troop => troop.id === troopId);
        
        if (troopIndex !== -1) {
            return selectTroopForCombat(troopIndex, this.gameState);
        } else {
            console.warn(`Troupe avec l'ID ${troopId} non trouvée`);
            return false;
        }
    }

    deselectTroopFromCombat(troopIndex) {
        return deselectTroopFromCombat(troopIndex, this.gameState);
    }

    removeUsedTroopsFromCombat(troopsUsed) {
        return removeUsedTroopsFromCombat(troopsUsed, this.gameState);
    }

    isPermanentUnit(troop) {
        return isPermanentUnit(troop);
    }

    calculateSynergies(troops = null) {
        return calculateSynergies(troops, this.gameState);
    }

    hasTroopType(troop, targetType) {
        return hasTroopType(troop, targetType);
    }

    calculateEquipmentBonuses() {
        return calculateEquipmentBonuses(this.gameState);
    }

    applyCombatBonuses() {
        return applyCombatBonuses(this.gameState);
    }

    incrementEndOfCombatCounters() {
        // Liste des bonus qui ont des compteurs de fin de combat
        const endOfCombatBonuses = ['economie_dune_vie', 'position_quatre', 'premiere_position'];
        
        endOfCombatBonuses.forEach(bonusId => {
            if (this.gameState.unlockedBonuses.includes(bonusId)) {
                incrementDynamicBonus(bonusId, 'end_of_combat', this.gameState, 1);
            }
        });
    }

    // Méthodes d'interface utilisateur liées au combat
    updateCombatModal() {
        this.gameState.uiManager.updateCombatModal();
    }

    updateTroopsUI() {
        this.gameState.uiManager.updateTroopsUIDisplay();
    }

    // updateCombatInfo() supprimée car fait doublon avec updateCombatModalBasicElements

    updateSynergies() {
        this.gameState.uiManager.updateSynergiesDisplay();
    }

    updateCombatProgressDisplay() {
        this.gameState.progressManager.updateCombatProgressDisplay();
    }

    // Mettre à jour la progression dans la modal de combat
    updateCombatModalProgress() {
        const combatProgress = document.getElementById('combat-progress');
        const combatLog = document.getElementById('combat-log');
        
        if (combatProgress) {
            const percentage = Math.min((this.gameState.currentCombat.totalDamage / this.gameState.currentCombat.targetDamage) * 100, 100);
            combatProgress.style.width = `${percentage}%`;
        }
        
        if (combatLog) {
            // Afficher le détail du dernier round avec le bon calcul
            if (this.gameState.currentCombat.roundDetails && this.gameState.currentCombat.roundDetails.length > 0) {
                const lastRound = this.gameState.currentCombat.roundDetails[this.gameState.currentCombat.roundDetails.length - 1];
                this.addCombatLog(`Tour ${lastRound.round}: ${lastRound.damage}/${this.gameState.currentCombat.targetDamage} dégâts`, 'synergy');
            }
            // Vérifier si c'est la victoire ou la défaite
            if (this.gameState.currentCombat.totalDamage >= this.gameState.currentCombat.targetDamage) {
                this.addCombatLog('🎉 VICTOIRE !', 'victory');
            } else if (this.gameState.currentCombat.round >= this.gameState.currentCombat.maxRounds) {
                this.addCombatLog('💀 DÉFAITE !', 'defeat');
            }
        }
    }

    addCombatLog(message, type = 'info') {
        const combatLog = document.getElementById('combat-log');
        if (!combatLog) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        combatLog.appendChild(logEntry);
        combatLog.scrollTop = combatLog.scrollHeight;
    }

    updateBossDamageGauge() {
        this.gameState.updateBossDamageGauge();
    }

    // Méthode déléguée vers GameState pour ajouter un message au log de combat
    addCombatLog(message, type = 'info') {
        return this.gameState.addCombatLog(message, type);
    }

    createInitialCombatLog() {
        const combatLog = document.getElementById('combat-log');
        if (!combatLog) return;
        
        combatLog.innerHTML = '';
        
        // Ajouter les informations initiales du combat
        if (this.gameState.currentCombat.isBossFight) {
            // Créer un encart spécial pour le malus de boss en premier
            const bossMalusContainer = this.createBossMalusContainer();
            
            // Insérer le malus de boss en premier dans le log
            combatLog.appendChild(bossMalusContainer);
            
            // Ajouter l'objectif après le malus
            this.addCombatLog(`Objectif: ${this.gameState.currentCombat.targetDamage} dégâts`, 'info');
        } else {
            this.addCombatLog(`Combat contre ${this.getEnemyName()} !`, 'info');
            this.addCombatLog(`Objectif: ${this.gameState.currentCombat.targetDamage} dégâts`, 'info');
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
        bossName.textContent = this.gameState.currentCombat.bossName;
        
        const bossEffect = document.createElement('div');
        bossEffect.style.cssText = `
            font-size: 1rem;
            font-style: italic;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        bossEffect.textContent = this.gameState.currentCombat.bossMechanic;
        
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

    // Obtenir le nom de l'ennemi
    getEnemyName() {
        return this.gameState.currentCombat.isBossFight ? 
               this.gameState.currentCombat.bossName : 
               getEnemyName(this.gameState.rank);
    }

    // Afficher la popup de fin de jeu après victoire contre Quilegan
    showGameCompletionModal() {
        // Créer la modal de fin de jeu
        const modal = document.createElement('div');
        modal.className = 'modal game-completion-modal';
        modal.id = 'game-completion-modal';
        
        modal.innerHTML = `
            <div class="modal-content game-completion-content">
                <div class="game-completion-header">
                    <h2>🎉 Félicitations ! 🎉</h2>
                    <p>Vous avez atteint les sommets et vaincu Quilegan !</p>
                </div>
                
                <div class="game-completion-body">
                    <div class="completion-message">
                        <p>Vous avez terminé le jeu principal avec succès !</p>
                        <p>Votre guilde est maintenant légendaire dans tout le royaume.</p>
                    </div>
                    
                    <div class="completion-stats">
                        <h3>Statistiques de votre aventure :</h3>
                        <ul>
                            <li>🏆 Rang final : ${this.gameState.rank}</li>
                            <li>💰 Or gagné : ${this.gameState.statisticsManager.gameStats.goldEarned}</li>
                            <li>⚔️ Combats gagnés : ${this.gameState.statisticsManager.gameStats.combatsWon}</li>
                            <li>🎯 Unités achetées : ${this.gameState.statisticsManager.gameStats.unitsPurchased}</li>
                        </ul>
                    </div>
                </div>
                
                <div class="game-completion-actions">
                    <button id="continue-infinite" class="btn btn-primary">
                        🚀 Continuer en Mode Infini
                    </button>
                    <button id="new-game" class="btn btn-secondary">
                        🎮 Nouvelle Partie
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter la modal au DOM
        document.body.appendChild(modal);
        
        // Afficher la modal
        modal.style.display = 'flex';
        
        // Gérer les événements des boutons
        document.getElementById('continue-infinite').addEventListener('click', () => {
            this.gameState.startInfiniteMode();
            this.gameState.startNewCombat();
            this.gameState.updateUI();
            this.gameState.updateTroopsUI();
            // Fermer la popin en supprimant l'élément du DOM
            const modal = document.getElementById('game-completion-modal');
            if (modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.getElementById('new-game').addEventListener('click', () => {
            this.gameState.saveManager.newGame(this.gameState);
            this.gameState.updateUI();
            this.gameState.updateTroopsUI();
            // Fermer la popin en supprimant l'élément du DOM
            const modal = document.getElementById('game-completion-modal');
            if (modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Ajout : expose une méthode pour obtenir le vrai total du compteur après animation
    getLastRoundTotalDamage() {
        // Retourne le totalDamage du combat courant (compteur global)
        return this.gameState.currentCombat.totalDamage;
    }
} 