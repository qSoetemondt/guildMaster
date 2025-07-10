// Classe GameState en ES6
import { NotificationManager } from './NotificationManager.js';
import { getRarityIcon, getRarityColor, getRarityDisplayName } from './RarityUtils.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { SaveManager } from './SaveManager.js';
import { ConsumableManager } from './ConsumableManager.js';
import { ShopManager } from './ShopManager.js';
import { RANKS, BOSS_RANKS, RANK_MULTIPLIERS, BASE_DAMAGE, DAMAGE_INCREMENT_PER_RANK } from './GameConstants.js';
import { BASE_UNITS, ALL_UNITS } from './UnitConstants.js';
import { BOSSES } from './BossConstants.js';
import { BossManager } from './BossManager.js';
import { DEFAULT_SYNERGY_LEVELS } from './SynergyConstants.js';
import { BONUS_DESCRIPTIONS, calculateBonusPrice, getBonusRarity } from './BonusConstants.js';
import { SYNERGY_DEFINITIONS, SPECIAL_SYNERGIES, calculateSynergyBonus, checkSynergyActivation } from './SynergyDefinitions.js';
import { getBaseUnits, getShopUnits, getAllAvailableTroops, getOwnedUnits, loadOwnedUnits, updateTroopsDisplay, addTroop, drawCombatTroops, maintainCombatTroops, isPermanentUnit, selectTroopForCombat, deselectTroopFromCombat, removeUsedTroopsFromCombat, hasTroopType, updateTroopsUI, createTroopCard, updateSynergies, calculateSynergies, calculateEquipmentBonuses, applyCombatBonuses } from './UnitManager.js';
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
        
        // Initialiser les gestionnaires
        this.notificationManager = new NotificationManager();
        this.saveManager = new SaveManager();
        this.consumableManager = new ConsumableManager();
        this.shopManager = new ShopManager();
        this.bossManager = new BossManager(this);
        
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
        this.BOSSES = BOSSES;
        
        // Fonction pour calculer les dégâts cibles selon le rang majeur
        this.calculateTargetDamageByRank = function(rank) {
            const rankIndex = this.RANKS.indexOf(rank);
            if (rankIndex === -1) return BASE_DAMAGE; // Valeur par défaut
            
            // Déterminer le rang majeur (F, E, D, C, B, A, S)
            let majorRank = 'F';
            if (rankIndex >= 3 && rankIndex <= 5) majorRank = 'E';      // E-, E, E+
            else if (rankIndex >= 6 && rankIndex <= 8) majorRank = 'D'; // D-, D, D+
            else if (rankIndex >= 9 && rankIndex <= 11) majorRank = 'C'; // C-, C, C+
            else if (rankIndex >= 12 && rankIndex <= 14) majorRank = 'B'; // B-, B, B+
            else if (rankIndex >= 15 && rankIndex <= 17) majorRank = 'A'; // A-, A, A+
            else if (rankIndex === 18) majorRank = 'S';                   // S
            
            const baseDamage = BASE_DAMAGE + (rankIndex * DAMAGE_INCREMENT_PER_RANK);
            return baseDamage * RANK_MULTIPLIERS[majorRank];
        };
        
        // Boss sélectionné pour l'affichage (mémorisé pour éviter les changements)
        this.displayBoss = null;
        
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
            
            // Réinitialiser le boss d'affichage pour le nouveau rang
            this.displayBoss = null;
            
            // Tirer de nouvelles troupes pour le nouveau rang
            this.drawCombatTroops();
            
            // Mettre à jour l'interface pour afficher le nouveau boss si nécessaire
            this.updateUI();
            
            console.log(`Rang changé: ${oldRank} → ${this.rank}`);
            this.showNotification(`Rang gagné ! Nouveau rang: ${this.rank}`, 'success');
        } else {
            console.log('Déjà au rang maximum');
        }
    }

    // Démarrer un nouveau combat
    startNewCombat() {
        // Nettoyer l'affichage du malus de boss avant de commencer un nouveau combat
        this.cleanBossMalusDisplay();
        
        const isBossFight = this.BOSS_RANKS.includes(this.rank);
        console.log(`Rang actuel: ${this.rank}, Boss ranks: ${this.BOSS_RANKS}, Is boss fight: ${isBossFight}`);
        
        if (isBossFight) {
            // Combat de boss - utiliser le boss d'affichage s'il existe, sinon en sélectionner un
            const selectedBoss = this.displayBoss || this.BOSSES[Math.floor(Math.random() * this.BOSSES.length)];
            this.currentCombat = {
                targetDamage: selectedBoss.targetDamage,
                totalDamage: 0,
                round: 0,
                maxRounds: 5,
                isActive: true,
                isBossFight: true,
                bossName: selectedBoss.name,
                bossMechanic: selectedBoss.mechanic
            };
            
            console.log(`Combat de boss démarré: ${selectedBoss.name}`);
            this.showNotification(`BOSS: ${selectedBoss.name} ! ${selectedBoss.mechanic}`, 'error');
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
            
            console.log(`Combat normal démarré, objectif: ${this.currentCombat.targetDamage}`);
           
        }
        
        // Réinitialiser le boss d'affichage quand on commence un combat
        this.displayBoss = null;
        
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

    // Exécuter un tour de combat
    executeCombatTurn() {
        if (!this.currentCombat.isActive || this.selectedTroops.length === 0) {
            return { success: false, message: 'Aucune troupe sélectionnée' };
        }

        // Copier les troupes sélectionnées pour l'animation
        const troopsUsed = [...this.selectedTroops];
        const turnDamage = this.calculateTurnDamage(troopsUsed);
        
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
        
        // Retirer les troupes utilisées
        this.selectedTroops = [];
        
        // Jouer l'animation de combat
        this.playCombatAnimation(troopsUsed, turnDamage).then(() => {
            // Mettre à jour l'UI après l'animation
            this.updateCombatProgressDisplay();
            this.updateCombatModalProgress();
            this.updateUI();
            this.updateTroopsUI();
            
            // Vérifier si le combat est terminé
            if (this.currentCombat.totalDamage >= this.currentCombat.targetDamage) {
                console.log('Victoire ! Appel de endCombat(true)');
                setTimeout(() => {
                    this.endCombat(true);
                }, 1000);
            } else if (this.currentCombat.round >= this.currentCombat.maxRounds) {
                console.log('Défaite ! Appel de endCombat(false)');
                setTimeout(() => {
                    this.endCombat(false);
                }, 1000);
            }
        });
        
        return { success: true, message: 'Animation de combat lancée', damage: turnDamage, total: this.currentCombat.totalDamage };
    }

    // Calculer les dégâts d'un tour
    calculateTurnDamage(troops) {
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        for (const troop of troops) {
            // Vérifier si la troupe a déjà été utilisée dans ce rang
            if (this.usedTroopsThisRank.includes(troop.id)) {
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
            
            // Appliquer les bonus d'équipement
            const equipmentBonuses = this.calculateEquipmentBonuses();
            equipmentBonuses.forEach(bonus => {
                if (bonus.target === 'all' || this.hasTroopType(troop, bonus.target)) {
                    if (bonus.damage) unitDamage += bonus.damage;
                    if (bonus.multiplier) unitMultiplier += bonus.multiplier;
                }
            });
            
            // Appliquer les mécaniques de boss si c'est un combat de boss
            if (this.currentCombat.isBossFight) {
                const mechanic = this.currentCombat.bossMechanic;
                
                if (mechanic.includes('corps à corps') && this.hasTroopType(troop, 'Corps à corps')) {
                    if (mechanic.includes('-50%')) {
                        unitDamage = Math.floor(unitDamage * 0.5);
                    }
                    if (mechanic.includes('-2')) {
                        unitDamage = Math.max(0, unitDamage - 2);
                    }
                }
                
                if (mechanic.includes('distance') && this.hasTroopType(troop, 'Distance')) {
                    if (mechanic.includes('-30%')) {
                        unitDamage = Math.floor(unitDamage * 0.7);
                    }
                }
                
                if (mechanic.includes('multiplicateurs')) {
                    unitMultiplier = Math.floor(unitMultiplier * 0.5);
                }
                
                if (mechanic.includes('magiques') && this.hasTroopType(troop, 'Magique')) {
                    unitDamage = Math.floor(unitDamage * 1.5);
                }
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
        
        return Math.round(finalDamage);
    }

    // Animation de combat
    async playCombatAnimation(troopsUsed, turnDamage) {
        const container = document.getElementById('combat-animation-container');
        const closeButton = document.getElementById('close-combat-animation');
        const damageCounter = document.getElementById('total-damage-counter');
        const multiplierCounter = document.getElementById('total-multiplier-counter');
        const finalResult = document.getElementById('final-result');
        const unitsContent = document.getElementById('units-slider-content');
        const synergiesContent = document.getElementById('synergies-animation-content');
        const bonusesContent = document.getElementById('bonuses-animation-content');
        const progressFill = document.querySelector('.combat-progress-fill');
        
        // Ajouter l'image de l'ennemi dans la popup
        const enemyImageContainer = document.getElementById('enemy-image-animation');
        if (enemyImageContainer) {
            let enemyImageSrc = 'assets/orcs.jpg';
            if (this.currentCombat.isBossFight) {
                enemyImageSrc = 'assets/orcs.jpg';
            } else {
                const enemyData = {
                    'F-': 'assets/gobelin.jpg',
                    'F': 'assets/orcs.jpg',
                    'F+': 'assets/orcs.jpg',
                    'E-': 'assets/orcs.jpg',
                    'E': 'assets/orcs.jpg',
                    'E+': 'assets/orcs.jpg',
                    'D-': 'assets/orcs.jpg',
                    'D': 'assets/orcs.jpg',
                    'D+': 'assets/orcs.jpg',
                    'C-': 'assets/orcs.jpg',
                    'C': 'assets/orcs.jpg',
                    'C+': 'assets/orcs.jpg',
                    'B-': 'assets/orcs.jpg',
                    'B': 'assets/orcs.jpg',
                    'B+': 'assets/orcs.jpg',
                    'A-': 'assets/orcs.jpg',
                    'A': 'assets/orcs.jpg',
                    'A+': 'assets/orcs.jpg',
                    'S': 'assets/orcs.jpg'
                };
                enemyImageSrc = enemyData[this.rank] || 'assets/orcs.jpg';
            }
            enemyImageContainer.src = enemyImageSrc;
        }
        
        // Afficher le conteneur d'animation
        container.style.display = 'flex';
        
        // Ajouter l'événement de fermeture
        const closeAnimation = () => {
            container.style.display = 'none';
            closeButton.removeEventListener('click', closeAnimation);
            
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
        
        // Réinitialiser tous les contenus
        damageCounter.textContent = '0';
        multiplierCounter.textContent = '0';
        finalResult.textContent = '= 0 dégâts';
        unitsContent.innerHTML = '';
        synergiesContent.innerHTML = '';
        bonusesContent.innerHTML = '';
        
        // Variables pour le compteur principal (toujours repartent à 0)
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        // Garder en mémoire les dégâts déjà réalisés pour le remplissage de la barre seulement
        const previousDamage = this.currentCombat.totalDamage - turnDamage; // Dégâts avant ce round
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
        
        // Réinitialiser aussi les conteneurs mobile
        const unitsContentMobile = document.getElementById('units-slider-content-mobile');
        const synergiesContentMobile = document.getElementById('synergies-animation-content-mobile');
        const bonusesContentMobile = document.getElementById('bonuses-animation-content-mobile');
        
        if (unitsContentMobile) unitsContentMobile.innerHTML = '';
        if (synergiesContentMobile) synergiesContentMobile.innerHTML = '';
        if (bonusesContentMobile) bonusesContentMobile.innerHTML = '';
        
        // Initialiser la barre de progression avec les dégâts précédents
        progressFill.style.width = `${previousPercentage}%`;
        
        // Variables pour les bonus d'équipement et synergies (ne s'accumulent pas dans le compteur)
        let equipmentDamage = 0;
        let equipmentMultiplier = 0;
        let synergyDamage = 0;
        let synergyMultiplier = 0;
        
        // Récupérer les bonus d'équipement pour les appliquer immédiatement
        const equipmentBonuses = this.calculateEquipmentBonuses();
        console.log('Bonus d\'équipement calculés:', equipmentBonuses); // Debug
        console.log('Bonus débloqués:', this.unlockedBonuses); // Debug
        
        // PHASE 0: Afficher le malus de boss en premier si c'est un combat de boss (seulement au premier round)
        if (this.currentCombat.isBossFight && this.currentCombat.round === 1) {
            await this.sleep(500);
            
            // Vérifier si le malus de boss existe déjà
            const existingBossMalus = document.querySelector('.boss-malus-container');
            if (existingBossMalus) {
                existingBossMalus.remove();
            }
            
            // Créer un encart spécial pour le malus de boss
            const bossMalusContainer = document.createElement('div');
            bossMalusContainer.className = 'boss-malus-container';
            bossMalusContainer.style.cssText = `
                background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                border: 3px solid #c44569;
                border-radius: 12px;
                padding: 15px;
                margin: 15px 0;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                color: white;
                text-align: center;
                position: relative;
                overflow: hidden;
            `;
            
            // Ajouter un effet de brillance
            const shine = document.createElement('div');
            shine.style.cssText = `
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                transform: rotate(45deg);
                animation: shine 2s infinite;
            `;
            bossMalusContainer.appendChild(shine);
            
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
            bossMalusContainer.appendChild(bossMalusContent);
            
            // Insérer le malus de boss en premier dans le conteneur d'animation
            const animationContainer = document.querySelector('.combat-animation');
            if (animationContainer) {
                const mainCounter = animationContainer.querySelector('.main-counter');
                if (mainCounter) {
                    animationContainer.insertBefore(bossMalusContainer, mainCounter);
                } else {
                    animationContainer.appendChild(bossMalusContainer);
                }
            }
            
            await this.sleep(200);
            bossMalusContainer.style.animation = 'bossMalusAppear 0.5s ease-out';
            
            await this.sleep(800);
        }
        
        // PHASE 1: Afficher les bonus d'équipement actifs
        if (equipmentBonuses.length > 0) {
            for (let i = 0; i < equipmentBonuses.length; i++) {
                const bonus = equipmentBonuses[i];
                
                const bonusElement = document.createElement('div');
                bonusElement.className = 'bonus-item';
                
                let bonusText = '';
                if (bonus.damage) {
                    bonusText += `+${bonus.damage} dégâts `;
                    equipmentDamage += bonus.damage;
                }
                if (bonus.multiplier) {
                    bonusText += `+${bonus.multiplier} multiplicateur `;
                    equipmentMultiplier += bonus.multiplier;
                }
                if (bonus.target !== 'all') {
                    bonusText += `(${bonus.target})`;
                }
                
                // Calculer le nombre d'occurrences de ce bonus
                const bonusCount = this.unlockedBonuses.filter(id => {
                    const bonusDescriptions = this.getBonusDescriptions();
                    const bonusDesc = bonusDescriptions[id];
                    return bonusDesc && bonusDesc.name === bonus.name;
                }).length;
                
                console.log(`Bonus ${bonus.name}: ${bonusCount} occurrences`); // Debug
                
                // Déterminer la rareté du bonus en fonction du nom
                let rarity = 'common';
                if (['Épée Aiguisée', 'Arc Renforcé', 'Grimoire Magique', 'Bonus Or', 'Bonus Corps à Corps', 'Bonus Distance', 'Bonus Magique'].includes(bonus.name)) {
                    rarity = 'common';
                } else if (['Amulette de Force', 'Cristal de Précision', 'Orbe Mystique', 'Potion de Force', 'Élixir de Puissance'].includes(bonus.name)) {
                    rarity = 'uncommon';
                } else if (['Armure Légendaire', 'Arc Divin', 'Baguette Suprême'].includes(bonus.name)) {
                    rarity = 'rare';
                } else if (['Relique Ancienne'].includes(bonus.name)) {
                    rarity = 'legendary';
                }
                
                const rarityIcon = getRarityIcon(rarity);
                const countDisplay = bonusCount > 1 ? ` <span class="bonus-count">×${bonusCount}</span>` : '';
                
                // Ajouter la classe de rareté à l'élément
                bonusElement.className = `bonus-item rarity-${rarity}`;
                
                bonusElement.innerHTML = `
                    <div class="bonus-name">${rarityIcon} ${bonus.name}${countDisplay}</div>
                    <div class="bonus-effect">${bonusText}</div>
                `;
                
                // Ajouter aux conteneurs desktop et mobile
                bonusesContent.appendChild(bonusElement);
                const bonusesContentMobile = document.getElementById('bonuses-animation-content-mobile');
                if (bonusesContentMobile) {
                    const mobileBonusElement = bonusElement.cloneNode(true);
                    bonusesContentMobile.appendChild(mobileBonusElement);
                }
                
                await this.sleep(200);
                bonusElement.classList.add('active');
                await this.sleep(300);
            }
        } else {
            const noBonusElement = document.createElement('div');
            noBonusElement.className = 'bonus-item active';
            noBonusElement.innerHTML = '<div class="bonus-name">Aucun bonus d\'équipement</div>';
            
            bonusesContent.appendChild(noBonusElement);
            const bonusesContentMobile = document.getElementById('bonuses-animation-content-mobile');
            if (bonusesContentMobile) {
                const mobileNoBonusElement = noBonusElement.cloneNode(true);
                bonusesContentMobile.appendChild(mobileNoBonusElement);
            }
        }
        
        await this.sleep(500);
        
        // PHASE 2: Afficher les synergies
        const synergies = this.calculateSynergies(troopsUsed);
        console.log('Synergies calculées:', synergies); // Debug
        
        if (synergies.length > 0) {
            for (let i = 0; i < synergies.length; i++) {
                const synergy = synergies[i];
                
                const synergyElement = document.createElement('div');
                synergyElement.className = 'synergy-item';
                synergyElement.innerHTML = `
                    <div class="synergy-name">${synergy.name}</div>
                    <div class="synergy-effect">${synergy.description}</div>
                `;
                
                // Ajouter aux conteneurs desktop et mobile
                synergiesContent.appendChild(synergyElement);
                const synergiesContentMobile = document.getElementById('synergies-animation-content-mobile');
                if (synergiesContentMobile) {
                    const mobileSynergyElement = synergyElement.cloneNode(true);
                    synergiesContentMobile.appendChild(mobileSynergyElement);
                }
                
                // Accumuler les bonus de synergie pour les appliquer aux troupes
                if (synergy.bonus.damage) {
                    synergyDamage += synergy.bonus.damage;
                }
                if (synergy.bonus.multiplier) {
                    synergyMultiplier += synergy.bonus.multiplier;
                }
                
                await this.sleep(200);
                synergyElement.classList.add('active');
                await this.sleep(400);
            }
        } else {
            const noSynergyElement = document.createElement('div');
            noSynergyElement.className = 'synergy-item active';
            noSynergyElement.innerHTML = '<div class="synergy-name">Aucune synergie active</div>';
            
            synergiesContent.appendChild(noSynergyElement);
            const synergiesContentMobile = document.getElementById('synergies-animation-content-mobile');
            if (synergiesContentMobile) {
                const mobileNoSynergyElement = noSynergyElement.cloneNode(true);
                synergiesContentMobile.appendChild(mobileNoSynergyElement);
            }
        }
        
        await this.sleep(500);
        
        // PHASE 3: Animer les unités une par une avec accumulation progressive
        for (let i = 0; i < troopsUsed.length; i++) {
            const troop = troopsUsed[i];
            
            // Créer l'élément d'unité avec stats de base
            const unitElement = document.createElement('div');
            unitElement.className = 'unit-slide';
            
            const typeDisplay = getTypeDisplayString(troop.type);
            
            unitElement.innerHTML = `
                <div class="unit-slide-info">
                    <div class="unit-slide-icon">${troop.icon}</div>
                    <div class="unit-slide-details">
                        <div class="unit-slide-name">${troop.name}</div>
                        <div class="unit-slide-types">${typeDisplay}</div>
                    </div>
                </div>
                <div class="unit-stats-animated">
                    <div class="unit-stat-item">
                        <div class="unit-stat-value" id="unit-${i}-damage">${troop.damage}</div>
                        <div class="unit-stat-label">Dégâts</div>
                    </div>
                    <div class="unit-stat-item">
                        <div class="unit-stat-value" id="unit-${i}-multiplier">${troop.multiplier}</div>
                        <div class="unit-stat-label">Multiplicateur</div>
                    </div>
                </div>
            `;
            
            // Ajouter aux conteneurs desktop et mobile
            unitsContent.appendChild(unitElement);
            const unitsContentMobile = document.getElementById('units-slider-content-mobile');
            if (unitsContentMobile) {
                // Pour mobile, utiliser l'ancien format
                const mobileUnitElement = document.createElement('div');
                mobileUnitElement.className = 'unit-slide';
                mobileUnitElement.innerHTML = `
                    <div class="unit-slide-info">
                        <div class="unit-slide-icon">${troop.icon}</div>
                        <div class="unit-slide-details">
                            <div class="unit-slide-name">${troop.name}</div>
                            <div class="unit-slide-types">${typeDisplay}</div>
                        </div>
                    </div>
                    <div class="unit-slide-stats">
                        <div class="unit-slide-damage">+<span class="combat-damage">${troop.damage}</span></div>
                        <div class="unit-slide-multiplier">×<span class="combat-multiplier">${troop.multiplier}</span></div>
                    </div>
                `;
                unitsContentMobile.appendChild(mobileUnitElement);
            }
            
            // Animer l'unité
            await this.sleep(300);
            unitElement.classList.add('active');
            
            // Variables pour suivre les stats actuelles
            let currentDamage = troop.damage;
            let currentMultiplier = troop.multiplier;
            
            // Appliquer les bonus d'équipement avec animations (desktop uniquement)
            for (const bonus of equipmentBonuses) {
                if (bonus.target === 'all' || this.hasTroopType(troop, bonus.target)) {
                    if (bonus.damage) {
                        await this.sleep(150);
                        currentDamage += bonus.damage;
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                        this.showBonusAnimation(unitElement, `+${bonus.damage}`, 'damage');
                    }
                    if (bonus.multiplier) {
                        await this.sleep(150);
                        currentMultiplier += bonus.multiplier;
                        this.updateUnitStat(unitElement, 'multiplier', currentMultiplier);
                        this.showBonusAnimation(unitElement, `+${bonus.multiplier}`, 'multiplier');
                    }
                }
            }
            
            // Appliquer les synergies avec animations (desktop uniquement)
            for (const synergy of synergies) {
                if (synergy.bonus.target === 'all' || this.hasTroopType(troop, synergy.bonus.target)) {
                    if (synergy.bonus.damage) {
                        await this.sleep(150);
                        currentDamage += synergy.bonus.damage;
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                        this.showBonusAnimation(unitElement, `+${synergy.bonus.damage}`, 'damage');
                    }
                    if (synergy.bonus.multiplier) {
                        await this.sleep(150);
                        currentMultiplier += synergy.bonus.multiplier;
                        this.updateUnitStat(unitElement, 'multiplier', currentMultiplier);
                        this.showBonusAnimation(unitElement, `+${synergy.bonus.multiplier}`, 'multiplier');
                    }
                }
            }
            
            // Appliquer les malus de boss avec animations (desktop uniquement)
            if (this.currentCombat.isBossFight) {
                const originalDamage = currentDamage;
                const originalMultiplier = currentMultiplier;
                
                // Appliquer les mécaniques de boss
                const mechanic = this.currentCombat.bossMechanic;
                
                if (mechanic.includes('corps à corps') && this.hasTroopType(troop, 'Corps à corps')) {
                    if (mechanic.includes('-50%')) {
                        await this.sleep(200);
                        currentDamage = Math.floor(currentDamage * 0.5);
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                        this.showMalusAnimation(unitElement, '-50%', 'damage');
                    }
                    if (mechanic.includes('-2')) {
                        await this.sleep(200);
                        currentDamage = Math.max(0, currentDamage - 2);
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                        this.showMalusAnimation(unitElement, '-2', 'damage');
                    }
                }
                
                if (mechanic.includes('distance') && this.hasTroopType(troop, 'Distance')) {
                    if (mechanic.includes('-30%')) {
                        await this.sleep(200);
                        currentDamage = Math.floor(currentDamage * 0.7);
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                        this.showMalusAnimation(unitElement, '-30%', 'damage');
                    }
                }
                
                if (mechanic.includes('multiplicateurs')) {
                    await this.sleep(200);
                    currentMultiplier = Math.floor(currentMultiplier * 0.5);
                    this.updateUnitStat(unitElement, 'multiplier', currentMultiplier);
                    this.showMalusAnimation(unitElement, '-50%', 'multiplier');
                }
                
                if (mechanic.includes('magiques') && this.hasTroopType(troop, 'Magique')) {
            await this.sleep(200);
                    currentDamage = Math.floor(currentDamage * 1.5);
                    this.updateUnitStat(unitElement, 'damage', currentDamage);
                    this.showBonusAnimation(unitElement, '+50%', 'damage');
                }
            }
            
            // Accumuler les dégâts et multiplicateurs finaux
            totalDamage += currentDamage;
            totalMultiplier += currentMultiplier;
            
            // Mettre à jour le compteur principal
            damageCounter.textContent = totalDamage;
            multiplierCounter.textContent = totalMultiplier;
            finalResult.textContent = `= ${Math.round(totalDamage * totalMultiplier)} dégâts`;
            
            // Mettre à jour le background du main-counter en fonction du pourcentage de dégâts
            const mainCounter = document.querySelector('.main-counter');
            if (mainCounter) {
                const currentDamage = Math.round(totalDamage * totalMultiplier);
                const targetDamage = this.currentCombat.targetDamage;
                // Ajouter les dégâts précédents aux nouveaux dégâts pour le calcul du pourcentage
                const totalDamageWithPrevious = previousDamage + currentDamage;
                const percentage = Math.min((totalDamageWithPrevious / targetDamage) * 100, 100);
                
                // Mettre à jour la largeur du background
                mainCounter.style.setProperty('--progress-width', `${percentage}%`);
                
                // Ajouter la classe over-100 si on dépasse 100%
                if (percentage > 100) {
                    mainCounter.classList.add('over-100');
                } else {
                    mainCounter.classList.remove('over-100');
                }
            }
            
            // Mettre à jour la barre de progression
            const progress = (i + 1) / troopsUsed.length * 100;
            progressFill.style.width = `${progress}%`;
            
            await this.sleep(500);
        }
        
        // PHASE 4: Finalisation (les mécaniques de boss sont déjà appliquées dans les calculs précédents)
        await this.sleep(200);
        
        // Animation finale
        await this.sleep(300);
        
        // Animation de victoire si le combat est gagné
        if (this.currentCombat.totalDamage >= this.currentCombat.targetDamage) {
            this.playVictoryAnimation();
        }
        
        // L'animation reste affichée jusqu'à ce que l'utilisateur la ferme manuellement
        // Pas de fermeture automatique
    }
    
    // Animation de victoire
    playVictoryAnimation() {
        // Créer l'élément de victoire principal
        const victoryElement = document.createElement('div');
        victoryElement.className = 'victory-animation';
        victoryElement.textContent = '🎉 VICTOIRE ! 🎉';
        document.body.appendChild(victoryElement);
        
        // Créer le conteneur de particules
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'victory-particles';
        document.body.appendChild(particlesContainer);
        
        // Créer des particules
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'victory-particle';
                
                // Position aléatoire autour du centre
                const angle = (Math.PI * 2 * i) / 20;
                const distance = 100 + Math.random() * 100;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                particle.style.setProperty('--x', `${x}px`);
                particle.style.setProperty('--y', `${y}px`);
                particle.style.left = '50%';
                particle.style.top = '50%';
                
                particlesContainer.appendChild(particle);
                
                // Supprimer la particule après l'animation
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 1500);
            }, i * 50);
        }
        
        // Supprimer les éléments après l'animation
        setTimeout(() => {
            if (victoryElement.parentNode) {
                victoryElement.parentNode.removeChild(victoryElement);
            }
            if (particlesContainer.parentNode) {
                particlesContainer.parentNode.removeChild(particlesContainer);
            }
        }, 2000);
    }
    
    // Fonction utilitaire pour les délais
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Afficher une animation de bonus sur une unité
    showBonusAnimation(unitElement, bonusText, type) {
        // Trouver l'élément de stat spécifique
        const damageElement = unitElement.querySelector('.unit-stat-item:first-child');
        const multiplierElement = unitElement.querySelector('.unit-stat-item:last-child');
        
        let targetElement = null;
        if (type === 'damage' && damageElement) {
            targetElement = damageElement;
        } else if (type === 'multiplier' && multiplierElement) {
            targetElement = multiplierElement;
        }
        
        if (targetElement) {
            const bonusElement = document.createElement('div');
            bonusElement.className = `bonus-animation ${type}`;
            bonusElement.textContent = bonusText;
            bonusElement.style.position = 'absolute';
            bonusElement.style.top = '-25px';
            bonusElement.style.left = '50%';
            bonusElement.style.transform = 'translateX(-50%)';
            
            targetElement.style.position = 'relative';
            targetElement.appendChild(bonusElement);
            
            // Ajouter l'effet de brillance à l'unité
            unitElement.classList.add('bonus-applied');
            setTimeout(() => {
                unitElement.classList.remove('bonus-applied');
            }, 500);
            
            // Supprimer l'élément après l'animation
            setTimeout(() => {
                if (bonusElement.parentNode) {
                    bonusElement.parentNode.removeChild(bonusElement);
                }
            }, 1000);
        }
    }
    
    // Afficher une animation de malus sur une unité
    showMalusAnimation(unitElement, malusText, type) {
        // Trouver l'élément de stat spécifique
        const damageElement = unitElement.querySelector('.unit-stat-item:first-child');
        const multiplierElement = unitElement.querySelector('.unit-stat-item:last-child');
        
        let targetElement = null;
        if (type === 'damage' && damageElement) {
            targetElement = damageElement;
        } else if (type === 'multiplier' && multiplierElement) {
            targetElement = multiplierElement;
        }
        
        if (targetElement) {
            const malusElement = document.createElement('div');
            malusElement.className = `malus-animation ${type}`;
            malusElement.textContent = malusText;
            malusElement.style.position = 'absolute';
            malusElement.style.top = '-25px';
            malusElement.style.left = '50%';
            malusElement.style.transform = 'translateX(-50%)';
            
            targetElement.style.position = 'relative';
            targetElement.appendChild(malusElement);
            
            // Ajouter l'effet de tremblement à l'unité
            unitElement.classList.add('malus-applied');
            setTimeout(() => {
                unitElement.classList.remove('malus-applied');
            }, 500);
            
            // Supprimer l'élément après l'animation
            setTimeout(() => {
                if (malusElement.parentNode) {
                    malusElement.parentNode.removeChild(malusElement);
                }
            }, 1000);
        }
    }
    
    // Mettre à jour les stats d'une unité avec animation
    updateUnitStat(unitElement, statType, newValue) {
        // Trouver l'élément de stat spécifique
        const damageElement = unitElement.querySelector('.unit-stat-item:first-child .unit-stat-value');
        const multiplierElement = unitElement.querySelector('.unit-stat-item:last-child .unit-stat-value');
        
        if (statType === 'damage' && damageElement) {
            damageElement.textContent = newValue;
            damageElement.classList.add('updated');
            setTimeout(() => damageElement.classList.remove('updated'), 500);
        } else if (statType === 'multiplier' && multiplierElement) {
            multiplierElement.textContent = newValue;
            multiplierElement.classList.add('updated');
            setTimeout(() => multiplierElement.classList.remove('updated'), 500);
        }
    }
    


    // Appliquer les mécaniques de boss
    applyBossMechanics(damage, troop) {
        const mechanic = this.currentCombat.bossMechanic;
        
        if (mechanic.includes('corps à corps') && this.hasTroopType(troop, 'Corps à corps')) {
            if (mechanic.includes('-50%')) {
                return Math.floor(damage * 0.5);
            }
            if (mechanic.includes('-2')) {
                return Math.max(0, damage - 2);
            }
        }
        
        if (mechanic.includes('distance') && this.hasTroopType(troop, 'Distance')) {
            if (mechanic.includes('-30%')) {
                return Math.floor(damage * 0.7);
            }
        }
        
        if (mechanic.includes('multiplicateurs')) {
            return Math.floor(damage * 0.5);
        }
        
        if (mechanic.includes('magiques') && this.hasTroopType(troop, 'Magique')) {
            return Math.floor(damage * 1.5);
        }
        
        return damage;
    }

    // Terminer le combat
    endCombat(victory) {
        console.log(`endCombat appelé avec victory=${victory}`);
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
            console.log('Debug endCombat - baseReward:', baseReward, 'isBossFight:', this.currentCombat.isBossFight);
            this.addGold(baseReward);
            
            // Bonus de richesse
            const wealthBonus = this.calculateWealthBonus();
            console.log('Debug endCombat - wealthBonus:', wealthBonus);
            this.addGold(wealthBonus);
            
            // Calculer les bonus d'or des bonus d'équipement
            const equipmentGoldBonus = this.calculateEquipmentGoldBonus();
            console.log('Debug endCombat - equipmentGoldBonus:', equipmentGoldBonus);
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
            
            console.log('Victoire traitée - gainRank et showVictorySummary appelés');
        } else {
            this.showNotification('Défaite !', 'error');
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
        this.cleanBossMalusDisplay();

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

    // Nettoyer l'affichage du malus de boss
    cleanBossMalusDisplay() {
        // Nettoyer le malus de boss dans l'animation de combat
        const bossMalusContainer = document.querySelector('.boss-malus-container');
        if (bossMalusContainer) {
            bossMalusContainer.remove();
        }
        
        // Nettoyer le malus de boss dans la modal de combat
        const bossMalusModal = document.querySelector('.boss-malus-modal');
        if (bossMalusModal) {
            bossMalusModal.remove();
        }
        
        // Nettoyer le malus de boss dans la progression du combat
        const bossMechanic = document.querySelector('.boss-mechanic');
        if (bossMechanic) {
            bossMechanic.remove();
        }
        
        // Nettoyer les éléments de malus de boss dans le log de combat
        const combatLog = document.getElementById('combat-log');
        if (combatLog) {
            const bossMalusInLog = combatLog.querySelector('.boss-malus-modal');
            if (bossMalusInLog) {
                bossMalusInLog.remove();
            }
        }
        
        console.log('Affichage du malus de boss nettoyé');
    }

    // Afficher l'encadré de victoire
    showVictorySummary(baseReward, wealthBonus, equipmentGoldBonus) {
        console.log('showVictorySummary appelé avec:', {baseReward, wealthBonus, equipmentGoldBonus});
        const totalGold = baseReward + wealthBonus + equipmentGoldBonus;
        
        // Créer l'encadré de victoire
        const victoryBox = document.createElement('div');
        victoryBox.className = 'victory-summary-box';
        victoryBox.innerHTML = `
            <div class="victory-summary-content">
                <h3>🎉 Victoire !</h3>
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
                <div class="victory-actions">
                    <button class="btn primary victory-continue-btn">Continuer vers le magasin</button>
                </div>
            </div>
        `;
        
        // Ajouter l'encadré à la modal de combat
        const combatModal = document.getElementById('combat-modal');
        if (combatModal) {
            const modalBody = combatModal.querySelector('.modal-body');
            if (modalBody) {
                // Supprimer l'ancien encadré de victoire s'il existe
                const oldVictoryBox = modalBody.querySelector('.victory-summary-box');
                if (oldVictoryBox) {
                    oldVictoryBox.remove();
                }
                
                // Ajouter le nouvel encadré
                modalBody.appendChild(victoryBox);
                
                // Animation d'apparition
                setTimeout(() => {
                    victoryBox.classList.add('show');
                    console.log('Animation de victoire appliquée');
                }, 100);
                
                // Ajouter l'événement pour le bouton "Continuer"
                const continueBtn = victoryBox.querySelector('.victory-continue-btn');
                if (continueBtn) {
                    continueBtn.addEventListener('click', () => {
                        // Fermer la modal de combat
                        const combatModal = document.getElementById('combat-modal');
                        if (combatModal) {
                            combatModal.style.display = 'none';
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
                    });
                }
                
                console.log('Encadré de victoire ajouté à la modal de combat');
            } else {
                console.error('Modal body non trouvé dans la modal de combat');
            }
        } else {
            console.error('Modal de combat non trouvée');
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
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
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
                        <button class="btn primary" onclick="gameState.newGame()">Nouvelle Partie</button>
                        <button class="btn secondary" onclick="this.closest('.modal').remove()">Fermer</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(summaryModal);
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
        
        // Bonus d'or uniquement
        if (bonusCounts['gold_bonus']) {
            totalBonus = 25 * bonusCounts['gold_bonus'];
        }
        
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

    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour les informations de base
        document.getElementById('current-rank').textContent = this.rank;
        document.getElementById('gold-amount').textContent = this.gold;
        
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

    // Mettre à jour la modal de combat
    updateCombatModal() {
        const combatTarget = document.getElementById('combat-target');
        const combatProgress = document.getElementById('combat-progress');
        const modalHeader = document.querySelector('#combat-modal .modal-header h3');
        const combatLog = document.getElementById('combat-log');
        const enemyImageModal = document.getElementById('enemy-image-modal');
        
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
        
        // Mettre à jour l'image dans la modal
        if (enemyImageModal) {
            if (this.currentCombat.isBossFight) {
                enemyImageModal.src = 'assets/orcs.jpg';
            } else {
                // Utiliser la même logique que dans updateCombatInfo
                const enemyData = {
                    'F-': { image: 'assets/gobelin.jpg' },
                    'F': { image: 'assets/orcs.jpg' },
                    'F+': { image: 'assets/orcs.jpg' },
                    'E-': { image: 'assets/orcs.jpg' },
                    'E': { image: 'assets/orcs.jpg' },
                    'E+': { image: 'assets/orcs.jpg' },
                    'D-': { image: 'assets/orcs.jpg' },
                    'D': { image: 'assets/orcs.jpg' },
                    'D+': { image: 'assets/orcs.jpg' },
                    'C-': { image: 'assets/orcs.jpg' },
                    'C': { image: 'assets/orcs.jpg' },
                    'C+': { image: 'assets/orcs.jpg' },
                    'B-': { image: 'assets/orcs.jpg' },
                    'B': { image: 'assets/orcs.jpg' },
                    'B+': { image: 'assets/orcs.jpg' },
                    'A-': { image: 'assets/orcs.jpg' },
                    'A': { image: 'assets/orcs.jpg' },
                    'A+': { image: 'assets/orcs.jpg' },
                    'S': { image: 'assets/orcs.jpg' }
                };
                
                const enemyInfo = enemyData[this.rank] || { image: 'assets/orcs.jpg' };
                enemyImageModal.src = enemyInfo.image;
            }
        }
        
        if (combatLog) {
            combatLog.innerHTML = '';
            
            // Ajouter les informations initiales du combat
            if (this.currentCombat.isBossFight) {
                // Créer un encart spécial pour le malus de boss en premier
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
                bossMalusContainer.appendChild(shine);
                
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
                bossMalusContainer.appendChild(bossMalusContent);
                
                // Insérer le malus de boss en premier dans le log
                combatLog.appendChild(bossMalusContainer);
                
                // Ajouter l'objectif après le malus
                this.addCombatLog(`Objectif: ${this.currentCombat.targetDamage} dégâts`, 'info');
            } else {
                this.addCombatLog(`Combat contre ${this.getEnemyName()} !`, 'info');
            this.addCombatLog(`Objectif: ${this.currentCombat.targetDamage} dégâts`, 'info');
            }
        }
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
        const enemyNames = {
            'F-': ['Gobelin', 'Loup', 'Bandit'],
            'F': ['Orc', 'Troll', 'Géant'],
            'F+': ['Dragonnet', 'Démon Mineur', 'Hydre'],
            'E-': ['Gargouille', 'Minotaure', 'Basilic'],
            'E': ['Liche', 'Dragon', 'Démon'],
            'E+': ['Dragon Ancien', 'Démon Suprême', 'Titan'],
            'D-': ['Seigneur des Ombres', 'Golem de Pierre', 'Hydre Ancienne'],
            'D': ['Dragon Légendaire', 'Démon Primordial', 'Titan de Guerre'],
            'D+': ['Seigneur du Chaos', 'Dragon Divin', 'Titan Suprême'],
            'C-': ['Déité Mineure', 'Dragon Cosmique', 'Titan Primordial'],
            'C': ['Déité Majeure', 'Dragon Éternel', 'Titan Divin'],
            'C+': ['Déité Suprême', 'Dragon Primordial', 'Titan Cosmique'],
            'B-': ['Entité Primordiale', 'Dragon Absolu', 'Titan Éternel'],
            'B': ['Entité Divine', 'Dragon Suprême', 'Titan Absolu'],
            'B+': ['Entité Cosmique', 'Dragon Primordial', 'Titan Suprême'],
            'A-': ['Être Primordial', 'Dragon Divin', 'Titan Cosmique'],
            'A': ['Être Divin', 'Dragon Absolu', 'Titan Éternel'],
            'A+': ['Être Cosmique', 'Dragon Suprême', 'Titan Absolu'],
            'S': ['Entité Absolue', 'Dragon Primordial', 'Titan Divin']
        };
        
        const names = enemyNames[this.rank] || enemyNames['F-'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    // Mettre à jour l'affichage de la progression du combat
    updateCombatProgressDisplay() {
        const combatProgressContainer = document.getElementById('combat-progress-container');
        
        // Afficher la barre pour tous les combats, y compris les boss
        if (this.currentCombat.isBossFight) {
            if (combatProgressContainer) combatProgressContainer.remove();
        }
        if (this.currentCombat.isActive) {
            if (!combatProgressContainer) {
                // Créer le conteneur de progression s'il n'existe pas
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
                
                // Titre simple
                const title = document.createElement('h4');
                title.style.cssText = `
                    color: ${this.currentCombat.isBossFight ? '#856404' : '#2d3436'};
                    margin-bottom: 10px;
                    font-size: 1.1rem;
                `;
                title.textContent = this.currentCombat.isBossFight ? 
                    `BOSS: ${this.currentCombat.bossName}` : 'Progression du Combat';
                
                // Ajouter la mécanique du boss si c'est un combat de boss
                if (this.currentCombat.isBossFight && this.currentCombat.bossMechanic) {
                    const mechanicText = document.createElement('div');
                    mechanicText.className = 'boss-mechanic';
                    mechanicText.style.cssText = `
                        color: #856404;
                        font-size: 0.9rem;
                        font-style: italic;
                        margin-bottom: 10px;
                        padding: 5px;
                        background: rgba(255, 193, 7, 0.2);
                        border-radius: 4px;
                    `;
                    mechanicText.textContent = `Mécanique: ${this.currentCombat.bossMechanic}`;
                    newContainer.appendChild(mechanicText);
                }
                
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
                newContainer.appendChild(title);
                newContainer.appendChild(progressBar);
                newContainer.appendChild(progressText);
                
                // Ajouter l'image de l'ennemi sous la barre de progression
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
                    const enemyData = {
                        'F-': 'assets/gobelin.jpg',
                        'F': 'assets/orcs.jpg',
                        'F+': 'assets/orcs.jpg',
                        'E-': 'assets/orcs.jpg',
                        'E': 'assets/orcs.jpg',
                        'E+': 'assets/orcs.jpg',
                        'D-': 'assets/orcs.jpg',
                        'D': 'assets/orcs.jpg',
                        'D+': 'assets/orcs.jpg',
                        'C-': 'assets/orcs.jpg',
                        'C': 'assets/orcs.jpg',
                        'C+': 'assets/orcs.jpg',
                        'B-': 'assets/orcs.jpg',
                        'B': 'assets/orcs.jpg',
                        'B+': 'assets/orcs.jpg',
                        'A-': 'assets/orcs.jpg',
                        'A': 'assets/orcs.jpg',
                        'A+': 'assets/orcs.jpg',
                        'S': 'assets/orcs.jpg'
                    };
                    enemyImage.src = enemyData[this.rank] || 'assets/orcs.jpg';
                }
                
                newContainer.appendChild(enemyImage);
                
                // Insérer avant les troupes sélectionnées
                const troopsSelected = document.querySelector('.troops-selected');
                if (troopsSelected) {
                    troopsSelected.parentNode.insertBefore(newContainer, troopsSelected);
                }
            } else {
                // Mettre à jour l'affichage existant
                const title = combatProgressContainer.querySelector('h4');
                const progressFill = combatProgressContainer.querySelector('#combat-progress-fill');
                const progressText = combatProgressContainer.querySelector('div:nth-last-child(2)'); // Avant l'image
                const enemyImage = combatProgressContainer.querySelector('img');
                
                if (title) {
                    title.textContent = this.currentCombat.isBossFight ? 
                        `BOSS: ${this.currentCombat.bossName}` : 'Progression du Combat';
                }
                
                // Mettre à jour l'image si elle existe
                if (enemyImage) {
                    if (this.BOSS_RANKS.includes(this.rank)) {
                        enemyImage.src = 'assets/orcs.jpg';
                    } else {
                        const enemyData = {
                            'F-': 'assets/gobelin.jpg',
                            'F': 'assets/orcs.jpg',
                            'F+': 'assets/orcs.jpg',
                            'E-': 'assets/orcs.jpg',
                            'E': 'assets/orcs.jpg',
                            'E+': 'assets/orcs.jpg',
                            'D-': 'assets/orcs.jpg',
                            'D': 'assets/orcs.jpg',
                            'D+': 'assets/orcs.jpg',
                            'C-': 'assets/orcs.jpg',
                            'C': 'assets/orcs.jpg',
                            'C+': 'assets/orcs.jpg',
                            'B-': 'assets/orcs.jpg',
                            'B': 'assets/orcs.jpg',
                            'B+': 'assets/orcs.jpg',
                            'A-': 'assets/orcs.jpg',
                            'A': 'assets/orcs.jpg',
                            'A+': 'assets/orcs.jpg',
                            'S': 'assets/orcs.jpg'
                        };
                        enemyImage.src = enemyData[this.rank] || 'assets/orcs.jpg';
                    }
                }
                
                // Mettre à jour ou créer la mécanique du boss
                if (this.currentCombat.isBossFight && this.currentCombat.bossMechanic) {
                    // Chercher l'élément mécanique existant
                    const existingMechanic = combatProgressContainer.querySelector('.boss-mechanic');
                    
                    if (existingMechanic) {
                        // Mettre à jour l'élément existant
                        existingMechanic.textContent = `Mécanique: ${this.currentCombat.bossMechanic}`;
                    } else {
                        // Créer un nouvel élément
                        const newMechanicText = document.createElement('div');
                        newMechanicText.className = 'boss-mechanic';
                        newMechanicText.style.cssText = `
                            color: #856404;
                            font-size: 0.9rem;
                            font-style: italic;
                            margin-bottom: 10px;
                            padding: 5px;
                            background: rgba(255, 193, 7, 0.2);
                            border-radius: 4px;
                        `;
                        newMechanicText.textContent = `Mécanique: ${this.currentCombat.bossMechanic}`;
                        combatProgressContainer.insertBefore(newMechanicText, title.nextSibling);
                    }
                }
                
                if (progressFill) {
                    const percentage = Math.min((this.currentCombat.totalDamage / this.currentCombat.targetDamage) * 100, 100);
                    progressFill.style.width = `${percentage}%`;
                }
                
                if (progressText) {
                    progressText.innerHTML = `
                        ${this.currentCombat.totalDamage} / ${this.currentCombat.targetDamage} dégâts 
                        (Tour ${this.currentCombat.round}/${this.currentCombat.maxRounds})
                    `;
                }
            }
        } else {
            // Supprimer l'affichage si le combat n'est pas actif
            if (combatProgressContainer) {
                combatProgressContainer.remove();
            }
        }
    }

    updateTroopsUI() {
        updateTroopsUI(this);
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
                // Utiliser le boss mémorisé ou en sélectionner un nouveau si pas encore fait
                if (!this.displayBoss) {
                    this.displayBoss = this.BOSSES[Math.floor(Math.random() * this.BOSSES.length)];
                }
                selectedBoss = this.displayBoss;
                targetDamage = selectedBoss.targetDamage;
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
            // Noms d'ennemis et images basés sur le rang
            const enemyData = {
                'F-': { name: 'Troupes de gobelin', image: 'assets/gobelin.jpg' },
                'F': { name: 'Bandits', image: 'assets/orcs.jpg' },
                'F+': { name: 'Orcs', image: 'assets/orcs.jpg' },
                'E-': { name: 'Trolls', image: 'assets/orcs.jpg' },
                'E': { name: 'Géants', image: 'assets/orcs.jpg' },
                'E+': { name: 'Dragons', image: 'assets/orcs.jpg' },
                'D-': { name: 'Démons', image: 'assets/orcs.jpg' },
                'D': { name: 'Archidémons', image: 'assets/orcs.jpg' },
                'D+': { name: 'Seigneurs de guerre', image: 'assets/orcs.jpg' },
                'C-': { name: 'Gardiens anciens', image: 'assets/orcs.jpg' },
                'C': { name: 'Légendes vivantes', image: 'assets/orcs.jpg' },
                'C+': { name: 'Entités primordiales', image: 'assets/orcs.jpg' },
                'B-': { name: 'Créatures mythiques', image: 'assets/orcs.jpg' },
                'B': { name: 'Êtres divins', image: 'assets/orcs.jpg' },
                'B+': { name: 'Anciens dieux', image: 'assets/orcs.jpg' },
                'A-': { name: 'Entités cosmiques', image: 'assets/orcs.jpg' },
                'A': { name: 'Créateurs de mondes', image: 'assets/orcs.jpg' },
                'A+': { name: 'Maîtres du temps', image: 'assets/orcs.jpg' },
                'S': { name: 'Entités absolues', image: 'assets/orcs.jpg' }
            };
            
            const enemyInfo = enemyData[this.rank] || { name: 'Ennemis puissants', image: 'assets/orcs.jpg' };
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
            if (bossMechanicText) bossMechanicText.textContent = selectedBoss ? selectedBoss.mechanic : 'Mécanique spéciale de boss';
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
        updateActiveBonuses(this);
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
} 