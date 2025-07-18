// UIManager.js - Gestion centralisée de l'interface utilisateur
import { updateActiveBonuses } from './ShopManager.js';
import { getEnemyData, getEnemyImage } from './constants/combat/GameConstants.js';
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { getRarityDisplayName, getRarityColor, getRarityIcon } from './constants/game/RarityUtils.js';
import { ModalManager } from './ModalManager.js';
import { calculateBonusPrice } from './constants/shop/BonusConstants.js';

export class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // Mise à jour complète de l'interface
    updateUI() {
        // Mettre à jour les informations de base
        document.getElementById('current-rank').textContent = this.gameState.rank;
        document.getElementById('gold-amount').textContent = this.gameState.gold;
        
        // Mettre à jour le nom de la guilde dans l'input
        const guildNameInput = document.getElementById('guild-name-input');
        if (guildNameInput) {
            guildNameInput.value = this.gameState.guildName;
        }
        
        // Mettre à jour l'affichage des troupes dans le header
        this.updateTroopsDisplay();
        
        // Mettre à jour les troupes disponibles pour le combat
        this.gameState.combatManager.updateTroopsUI();
        
        // Mettre à jour les synergies
        this.gameState.combatManager.updateSynergies();
        
        // Mettre à jour les informations de combat
        this.updateCombatModalBasicElements();
        
        // Mettre à jour les bonus actifs
        this.updateActiveBonuses();
        
        // Mettre à jour l'affichage des sections
        this.updateSectionDisplay();

        // Mettre à jour l'affichage des consommables
        this.updateConsumablesDisplay();
        
        // Mettre à jour l'affichage du prochain combat
        this.updateNextCombatDisplay();
        
        // Mettre à jour l'affichage des informations de boss
        this.updateBossInfoDisplay();
        
        // Mettre à jour l'affichage des éléments de boss dans combat-progress-container
        this.updateCombatProgressBossInfo();
        
        // S'assurer que le nom de l'ennemi est toujours à jour
        this.ensureEnemyNameDisplay();
        
        // Nettoyer l'affichage des boss seulement si ce n'est pas un combat de boss actif
        if (!this.gameState.BOSS_RANKS.includes(this.gameState.rank) && !this.gameState.currentCombat.isActive) {
            this.cleanBossDisplay();
        }
    }

    // Mettre à jour la jauge de dégâts pour les boss
    updateBossDamageGauge() {
        const bossGauge = document.getElementById('boss-damage-gauge');
        const bossDamageFill = document.getElementById('boss-damage-fill');
        const bossDamageCurrent = document.getElementById('boss-damage-current');
        const bossDamageTarget = document.getElementById('boss-damage-target');
        
        if (this.gameState.currentCombat.isActive && this.gameState.currentCombat.isBossFight) {
            if (bossGauge) bossGauge.style.display = 'block';
            if (bossDamageCurrent) bossDamageCurrent.textContent = this.gameState.currentCombat.totalDamage;
            if (bossDamageTarget) bossDamageTarget.textContent = this.gameState.currentCombat.targetDamage;
            if (bossDamageFill) {
                const percentage = Math.min((this.gameState.currentCombat.totalDamage / this.gameState.currentCombat.targetDamage) * 100, 100);
                bossDamageFill.style.width = `${percentage}%`;
            }
        } else {
            if (bossGauge) bossGauge.style.display = 'none';
        }
    }

    // Mettre à jour l'affichage des troupes
    updateTroopsUIDisplay() {
        // Utiliser le système de tri si un tri est actif
        if (this.gameState.unitSorter && this.gameState.unitSorter.currentSort !== 'none') {
            this.gameState.unitSorter.applySort(this.gameState);
        } else {
            // Implémentation directe sans récursion
            const availableContainer = document.getElementById('available-troops');
            if (!availableContainer) {
                console.error('Containers non trouvés');
                return;
            }
            availableContainer.innerHTML = '';
            
            // Afficher toutes les troupes disponibles (combat + achetées)
            const allAvailableTroops = [...this.gameState.combatTroops, ...this.gameState.availableTroops];
            
            allAvailableTroops.forEach((troop, index) => {
                // Vérifier si cette troupe est sélectionnée
                const isSelected = this.gameState.selectedTroops.some(selectedTroop => selectedTroop.id === troop.id);
                const troopCard = this.createTroopCard(troop, index, isSelected);
                availableContainer.appendChild(troopCard);
            });

            // Mettre à jour les titres des sections (sans le nombre de troupes disponibles)
            const availableTitle = availableContainer.parentElement.querySelector('h4');
            
            if (availableTitle) {
                availableTitle.textContent = `Troupes Disponibles`;
            }
        }
        
        // Mettre à jour l'affichage du bouton de relance
        if (this.gameState.unitSorter) {
            this.gameState.unitSorter.updateRerollButton();
        }
    }

    // Mettre à jour les synergies
    updateSynergiesDisplay() {
        const synergiesContainer = document.getElementById('synergies-display');
        if (!synergiesContainer) {
            console.warn('Container synergies-display non trouvé');
            return;
        }

        // Vider le conteneur AVANT d'ajouter de nouveaux éléments
        synergiesContainer.innerHTML = '';

        // Utiliser UNIQUEMENT les troupes sélectionnées pour les synergies
        let troopsToAnalyze = this.gameState.selectedTroops;
        
        // Si aucune troupe n'est sélectionnée, afficher un message
        if (troopsToAnalyze.length === 0) {
            synergiesContainer.innerHTML = '<p class="no-synergies">Sélectionnez des unités pour voir les synergies</p>';
            return;
        }

        const synergies = this.gameState.calculateSynergies(troopsToAnalyze);
        
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

    // Mettre à jour les bonus actifs
    updateActiveBonuses() {
        updateActiveBonuses(this.gameState, this.gameState.shopManager);
    }

    // Gérer l'affichage des sections
    updateSectionDisplay() {
        const preCombatSection = document.getElementById('pre-combat-section');
        const combatSection = document.getElementById('combat-section');

        if (!preCombatSection || !combatSection) return;

        if (this.gameState.currentCombat.isActive) {
            // Combat en cours : afficher la section des troupes
            preCombatSection.style.display = 'none';
            combatSection.style.display = 'block';
        } else {
            // Pas de combat : afficher la section avant combat
            preCombatSection.style.display = 'block';
            combatSection.style.display = 'none';
            
            // Mettre à jour le magasin avant combat
            this.gameState.shopManager.updatePreCombatShop(this.gameState);
            
            // Mettre à jour l'affichage du prochain combat
            this.updateNextCombatDisplay();
        }
    }
    
    // Mettre à jour l'affichage du prochain combat
    updateNextCombatDisplay() {
        // Mettre à jour les informations de base du prochain combat
        const isBossFight = this.gameState.BOSS_RANKS.includes(this.gameState.rank);
        let selectedBoss = null;
        let targetDamage = 0;
        
        if (isBossFight) {
            selectedBoss = this.gameState.displayBoss || this.gameState.bossManager.selectBossForRank(this.gameState.rank);
            targetDamage = this.gameState.bossManager.calculateBossTargetDamageByRank(selectedBoss, this.gameState.rank);
        } else {
            targetDamage = this.gameState.calculateTargetDamageByRank(this.gameState.rank);
        }
        
        // Mettre à jour l'objectif
        const combatTargetDisplay = document.getElementById('combat-target-display');
        if (combatTargetDisplay) {
            combatTargetDisplay.textContent = targetDamage;
        }
        
        // Mettre à jour le nom de l'ennemi
        let enemyNameText = 'Troupes de gobelin';
        if (isBossFight) {
            enemyNameText = selectedBoss ? selectedBoss.name : 'Boss';
        } else {
            const enemyInfo = getEnemyData(this.gameState.rank);
            enemyNameText = enemyInfo.name;
        }
        
        const combatEnemyName = document.getElementById('combat-enemy-name');
        if (combatEnemyName) {
            combatEnemyName.textContent = enemyNameText;
        }
        
        // Mettre à jour l'image de l'ennemi
        const enemyImage = document.getElementById('enemy-image');
        if (enemyImage) {
            if (isBossFight) {
                enemyImage.src = 'assets/orcs.jpg';
            } else {
                const enemyInfo = getEnemyData(this.gameState.rank);
                enemyImage.src = enemyInfo.image;
            }
        }
        
        // Mettre à jour l'affichage des informations de boss
        // Supprimé car déjà appelé dans updateUI()
    }

    // Afficher les troupes dans le header
    updateTroopsDisplay() {
        const troopsContainer = document.getElementById('troops-display');
        if (!troopsContainer) return;

        troopsContainer.innerHTML = '';

        // Créer un pool complet de toutes les troupes disponibles
        const allTroops = this.createFullTroopPool();

        // Grouper les troupes par nom
        const troopsByType = this.groupTroopsByType(allTroops);

        // Ajuster les compteurs pour les unités de base transformées
        this.adjustTransformedUnitsCount(troopsByType);

        // Créer les icônes pour chaque type de troupe
        const troopElements = this.createTroopIcons(troopsByType);
        
        // Ajouter les éléments au conteneur
        troopElements.forEach(element => {
            troopsContainer.appendChild(element);
        });
    }

    // Mettre à jour l'affichage des consommables
    updateConsumablesDisplay() {
        const consumablesContainer = document.getElementById('consumables-display');
        if (!consumablesContainer) {
            return;
        }

        consumablesContainer.innerHTML = '';

        if (this.gameState.consumableManager.consumables.length === 0) {
            return;
        }

        // Grouper les consommables par type
        const consumableCounts = {};
        this.gameState.consumableManager.consumables.forEach(consumable => {
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
            // Ajouter la classe de rareté si disponible
            const rarityClass = template.rarity ? `rarity-${template.rarity}` : '';
            consumableElement.className = `consumable-icon-header ${rarityClass}`;
            consumableElement.textContent = template.icon;
            consumableElement.setAttribute('data-count', count);
            
            // Ajouter la rareté au tooltip
            const rarityText = template.rarity ? `\n⭐ ${getRarityDisplayName(template.rarity)}` : '';
            consumableElement.title = `${template.name} (${count}) - ${template.description}${rarityText}`;
            
            // Ajouter l'événement de clic pour utiliser le consommable
            consumableElement.addEventListener('click', () => {
                this.gameState.consumableManager.useConsumable(template.id, this.gameState);
            });
            
            consumablesContainer.appendChild(consumableElement);
        });
    }

    // Mettre à jour l'interface après animation
    updateUIAfterAnimation() {
        this.gameState.updateCombatProgressDisplay();
        this.updateUI();
        // updateTroopsUI() est déjà appelé dans updateUI()
    }

    // Créer une carte de troupe
    createTroopCard(troop, index, isSelected) {
        const card = document.createElement('div');
        const isUsed = this.gameState.usedTroopsThisCombat.includes(troop.id);
        
        // Appliquer les classes CSS
        card.className = this.createTroopCardClasses(troop, isSelected, isUsed);
        
        // Appliquer le style de rareté
        this.applyRarityStyling(card, troop);
        
        // Générer le HTML
        card.innerHTML = this.generateTroopCardHTML(troop, isUsed);
        
        // Attacher les événements
        this.attachTroopCardEvents(card, troop, index, isSelected, isUsed);

        return card;
    }

    // Mettre à jour le nom de la guilde
    updateGuildName(newName) {
        this.gameState.guildName = newName;
        
        // Mettre à jour l'affichage
        const guildNameInput = document.getElementById('guild-name-input');
        if (guildNameInput) {
            guildNameInput.value = newName;
        }
        
        // Sauvegarder automatiquement
        this.gameState.save();
    }

    // Afficher une notification
    showNotification(message, type = 'info') {
        this.gameState.notificationManager.showNotification(message, type);
    }

        // Mettre à jour l'affichage des informations de boss
    updateBossInfoDisplay() {
        const isBossFight = this.gameState.BOSS_RANKS.includes(this.gameState.rank);
        let selectedBoss = null;
        
        if (isBossFight) {
            selectedBoss = this.gameState.displayBoss || this.gameState.bossManager.selectBossForRank(this.gameState.rank);
        }
        
        // Éléments à mettre à jour
        const preCombatBossInfo = document.getElementById('pre-combat-boss-info');
        
        if (!preCombatBossInfo) {
            console.warn('UIManager.updateBossInfoDisplay(): pre-combat-boss-info non trouvé dans le HTML');
            return;
        }
        
        // Afficher les informations de boss seulement si c'est un combat de boss ET que le combat n'est pas actif
        // (pour la préparation au combat)
        if (isBossFight && selectedBoss && !this.gameState.currentCombat.isActive) {
            this.showBossInfo(preCombatBossInfo, selectedBoss);
        } else {
            // Masquer dans tous les autres cas
            this.hideBossInfo(preCombatBossInfo);
        }
    }
    
    // Afficher les informations de boss pour un élément
    showBossInfo(element, boss) {
        if (!element) return;
        
        const bossName = element.querySelector('.boss-name');
        const bossMechanic = element.querySelector('.boss-mechanic');
        
        // Ne pas changer le nom du boss, garder "Malus de boss"
        // if (bossName) {
        //     bossName.textContent = boss.name;
        // }
        
        if (bossMechanic) {
            bossMechanic.textContent = boss.mechanic;
        }
        
        element.style.display = 'block';
    }
    
    // Masquer les informations de boss pour un élément
    hideBossInfo(element) {
        if (!element) return;
        element.style.display = 'none';
    }
    
    // Masquer toutes les informations de boss (appelé après un combat)
    hideAllBossInfo() {
        const preCombatBossInfo = document.getElementById('pre-combat-boss-info');
        this.hideBossInfo(preCombatBossInfo);
        
        // Masquer aussi les éléments de boss dans le conteneur de progression
        const combatProgressContainer = document.getElementById('combat-progress-container');
        if (combatProgressContainer) {
            const bossInfoElements = combatProgressContainer.querySelectorAll('.boss-info');
            bossInfoElements.forEach(element => {
                element.style.display = 'none';
            });
            // Éléments de boss masqués dans combat-progress-container
        }
        
        // Nettoyer tous les éléments de boss dans l'interface
        this.cleanBossDisplay();
    }
    
    // Mettre à jour l'affichage des éléments de boss dans combat-progress-container
    updateCombatProgressBossInfo() {
        const combatProgressContainer = document.getElementById('combat-progress-container');
        if (!combatProgressContainer) return;
        
        const bossInfoElements = combatProgressContainer.querySelectorAll('.boss-info');
        
        // Si c'est un combat de boss actif, s'assurer que les éléments sont visibles
        if (this.gameState.currentCombat.isActive && this.gameState.currentCombat.isBossFight) {
            bossInfoElements.forEach(element => {
                element.style.display = 'block';
            });
        }
    }
    
    // Nettoyer tous les éléments d'affichage de boss (remplace cleanBossMalusDisplay)
    cleanBossDisplay() {
        // Nettoyer le malus de boss dans la modal de combat
        const bossMalusModal = document.querySelector('.boss-malus-modal');
        if (bossMalusModal) {
            bossMalusModal.style.display = 'none';
        }
        
        // Nettoyer les éléments de malus de boss dans le log de combat
        const combatLog = document.getElementById('combat-log');
        if (combatLog) {
            const bossMalusInLog = combatLog.querySelector('.boss-malus-modal');
            if (bossMalusInLog) {
                bossMalusInLog.style.display = 'none';
            }
        }
        
        // Nettoyer l'affichage du statut de Quilegan
        const quileganStatus = document.getElementById('quilegan-status');
        if (quileganStatus) {
            quileganStatus.style.display = 'none';
        }
    }
    
    // Nettoyer spécifiquement le boss-malus-container (appelé lors du changement de combat)
    cleanBossMalusContainer() {
        const bossMalusContainer = document.querySelector('.boss-malus-container');
        if (bossMalusContainer) {
            bossMalusContainer.style.display = 'none';
        }
    }
    
    // S'assurer que le nom de l'ennemi est toujours affiché correctement
    ensureEnemyNameDisplay() {
        const combatEnemyName = document.getElementById('combat-enemy-name');
        if (!combatEnemyName) return;
        
        const isBossFight = this.gameState.BOSS_RANKS.includes(this.gameState.rank);
        let enemyNameText = 'Troupes de gobelin';
        
        if (isBossFight) {
            const selectedBoss = this.gameState.displayBoss || this.gameState.bossManager.selectBossForRank(this.gameState.rank);
            enemyNameText = selectedBoss ? selectedBoss.name : 'Boss';
        } else {
            const enemyInfo = getEnemyData(this.gameState.rank);
            enemyNameText = enemyInfo.name;
        }
        
        combatEnemyName.textContent = enemyNameText;
    }
    
    // Créer l'élément de mécanique de boss (pour ProgressManager)
    createBossMechanicElement() {
        if (!this.gameState.currentCombat.isBossFight || !this.gameState.currentCombat.bossMechanic) {
            return null;
        }
        
        const bossMechanicElement = document.createElement('div');
        bossMechanicElement.className = 'boss-info';
        bossMechanicElement.style.cssText = `
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 10px;
            border-radius: 8px;
            margin: 10px 0;
            border: 2px solid #e74c3c;
            box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
            font-size: 0.9rem;
            line-height: 1.4;
            font-style: italic;
            color: #ecf0f1;
        `;
        
        bossMechanicElement.textContent = this.gameState.currentCombat.bossMechanic;
        
        return bossMechanicElement;
    }
    
    // Mettre à jour les éléments de base de la modal de combat
    updateCombatModalBasicElements() {
        // Récupérer les éléments de base
        const targetDisplay = document.getElementById('combat-target');
        const enemyName = document.getElementById('enemy-name');
        const enemyImage = document.getElementById('enemy-image');
        const enemyImageModal = document.getElementById('enemy-image-modal');
        const combatLog = document.getElementById('combat-log');
        
        if (!targetDisplay) {
            console.warn('UIManager: Élément target-display non trouvé');
            return;
        }
        
        // Déterminer si c'est un combat de boss
        const isBossFight = this.gameState.currentCombat && this.gameState.currentCombat.isActive ? 
            this.gameState.currentCombat.isBossFight : 
            this.gameState.BOSS_RANKS.includes(this.gameState.rank);
        
        let selectedBoss = null;
        let targetDamage = 0;
        
        if (this.gameState.currentCombat && this.gameState.currentCombat.isActive) {
            // Combat actif en cours
            targetDamage = this.gameState.currentCombat.targetDamage;
            if (isBossFight) {
                selectedBoss = {
                    name: this.gameState.currentCombat.bossName,
                    mechanic: this.gameState.currentCombat.bossMechanic,
                    targetDamage: this.gameState.currentCombat.targetDamage
                };
            }
        } else {
            // Calculer l'objectif pour le prochain combat
            if (isBossFight) {
                selectedBoss = this.gameState.displayBoss || this.gameState.bossManager.selectBossForRank(this.gameState.rank);
                targetDamage = this.gameState.bossManager.calculateBossTargetDamageByRank(selectedBoss, this.gameState.rank);
            } else {
                targetDamage = this.gameState.calculateTargetDamageByRank(this.gameState.rank);
            }
        }

        targetDisplay.textContent = targetDamage;
        
        // Mettre à jour aussi l'affichage dans la section next-combat-info
        const combatTargetDisplay = document.getElementById('combat-target-display');
        if (combatTargetDisplay) {
            combatTargetDisplay.textContent = targetDamage;
        }

        // Déterminer le nom de l'ennemi et l'image correspondante
        let enemyNameText = 'Troupes de gobelin';
        let enemyImageSrc = 'assets/gobelin.jpg';
        
        if (isBossFight) {
            enemyNameText = selectedBoss ? selectedBoss.name : 'Boss';
            enemyImageSrc = 'assets/orcs.jpg'; // Image pour les boss
        } else {
            // Utiliser les données centralisées des ennemis
            const enemyInfo = getEnemyData(this.gameState.rank);
            enemyNameText = enemyInfo.name;
            enemyImageSrc = enemyInfo.image;
        }
        
        if (enemyName) enemyName.textContent = enemyNameText;
        
        // Mettre à jour aussi le nom de l'ennemi dans la section next-combat-info
        const combatEnemyName = document.getElementById('combat-enemy-name');
        if (combatEnemyName) {
            combatEnemyName.textContent = enemyNameText;
        }
        
        // Mettre à jour les images
        if (enemyImage) enemyImage.src = enemyImageSrc;
        if (enemyImageModal) enemyImageModal.src = enemyImageSrc;


    }

    // === MÉTHODES DE CRÉATION D'ÉLÉMENTS DOM POUR PROGRESSMANAGER ===
    
    // Créer le conteneur de progression de combat
    createCombatProgressContainer() {
        const newContainer = document.createElement('div');
        newContainer.id = 'combat-progress-container';
        newContainer.className = 'combat-progress-container';
        newContainer.style.cssText = `
            background: ${this.gameState.currentCombat.isBossFight ? '#fff3cd' : '#f8f9fa'};
            border: 2px solid ${this.gameState.currentCombat.isBossFight ? '#ffc107' : '#dee2e6'};
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        `;
        
        return newContainer;
    }

    // Créer le titre de progression de combat
    createCombatProgressTitle() {
        const title = document.createElement('h4');
        title.style.cssText = `
            color: ${this.gameState.currentCombat.isBossFight ? '#856404' : '#2d3436'};
            margin-bottom: 10px;
            font-size: 1.1rem;
        `;
        title.textContent = this.gameState.currentCombat.isBossFight ? 
            `BOSS: ${this.gameState.currentCombat.bossName}` : 'Progression du Combat';
        
        return title;
    }

    // Créer la barre de progression
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
            background: ${this.gameState.currentCombat.isBossFight ? 'linear-gradient(45deg, #ffc107, #ff8c00)' : 'linear-gradient(45deg, #74b9ff, #0984e3)'};
            transition: width 0.3s ease;
            width: 0%;
        `;
        
        const progressText = document.createElement('div');
        progressText.style.cssText = `
            text-align: center;
            font-weight: 600;
            color: ${this.gameState.currentCombat.isBossFight ? '#856404' : '#2d3436'};
            font-size: 1rem;
        `;
        progressText.innerHTML = `
            ${this.gameState.currentCombat.totalDamage} / ${this.gameState.currentCombat.targetDamage} dégâts 
            (Tour ${this.gameState.currentCombat.round}/${this.gameState.currentCombat.maxRounds})
        `;
        
        progressBar.appendChild(progressFill);
        
        return { progressBar, progressText };
    }

    // Créer l'image de l'ennemi
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
        if (this.gameState.BOSS_RANKS.includes(this.gameState.rank)) {
            enemyImage.src = 'assets/orcs.jpg';
        } else {
            enemyImage.src = getEnemyImage(this.gameState.rank);
        }
        
        return enemyImage;
    }

    // Créer l'affichage complet de progression de combat
    createCombatProgressDisplay() {
        const newContainer = this.createCombatProgressContainer();
        const title = this.createCombatProgressTitle();
        const { progressBar, progressText } = this.createProgressBar();
        const enemyImage = this.createEnemyImage();
        
        // Vérifier si Quilegan est actif et créer l'indicateur
        const quileganIndicator = this.gameState.bossManager.createQuileganIndicator();
        
        if (quileganIndicator) {
            // Ajouter l'indicateur en premier dans le conteneur
            newContainer.appendChild(quileganIndicator);
        }
        
        // Ajouter la mécanique de boss si c'est un combat de boss
        if (this.gameState.currentCombat.isBossFight) {
            const bossMechanicElement = this.createBossMechanicElement();
            if (bossMechanicElement) {
                newContainer.appendChild(bossMechanicElement);
            }
        }
        
        // Assembler les éléments
        newContainer.appendChild(title);
        newContainer.appendChild(progressBar);
        newContainer.appendChild(progressText);
        newContainer.appendChild(enemyImage);
        
        return newContainer;
    }

    // Insérer le conteneur de progression dans l'interface
    insertCombatProgressContainer(newContainer) {
        // Essayer plusieurs sélecteurs pour trouver l'élément d'insertion
        let insertionPoint = document.getElementById('troops-selected') || 
                           document.querySelector('.troops-selected') ||
                           document.querySelector('.troops-container');
        
        if (insertionPoint && insertionPoint.parentNode) {
            insertionPoint.parentNode.insertBefore(newContainer, insertionPoint);
        } else {
            // Fallback : insérer dans le body si aucun point d'insertion n'est trouvé
            document.body.appendChild(newContainer);
        }
    }

    // Mettre à jour l'affichage existant de progression de combat
    updateExistingCombatProgress() {
        const combatProgressContainer = document.getElementById('combat-progress-container');
        if (!combatProgressContainer) return;
        
        const title = combatProgressContainer.querySelector('h4');
        const progressFill = combatProgressContainer.querySelector('#combat-progress-fill');
        const progressText = combatProgressContainer.querySelector('div:nth-last-child(2)'); // Avant l'image
        const enemyImage = combatProgressContainer.querySelector('img');
        
        // Vérifier si Quilegan est actif et mettre à jour l'indicateur
        const isQuileganActive = this.gameState.currentCombat && 
                                 this.gameState.currentCombat.isBossFight && 
                                 this.gameState.currentCombat.bossName === 'Quilegan';
        
        if (isQuileganActive) {
            let quileganIndicator = combatProgressContainer.querySelector('.quilegan-progress-indicator');
            
            if (!quileganIndicator) {
                // Créer l'indicateur s'il n'existe pas
                quileganIndicator = document.createElement('div');
                quileganIndicator.className = 'quilegan-progress-indicator';
                combatProgressContainer.insertBefore(quileganIndicator, combatProgressContainer.firstChild);
            }
            
            // Mettre à jour l'indicateur
            quileganIndicator.style.cssText = `
                background: ${this.gameState.bossManager.isBossMalusDisabled() ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #e74c3c, #c0392b)'};
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                margin-bottom: 10px;
                font-weight: bold;
                text-align: center;
                border: 2px solid ${this.gameState.bossManager.isBossMalusDisabled() ? '#28a745' : '#e74c3c'};
                font-size: 0.9rem;
            `;
            
            quileganIndicator.innerHTML = `
                🎯 <strong>Quilegan:</strong> ${this.gameState.bossManager.isBossMalusDisabled() ? 'MÉCANIQUE DÉSACTIVÉE' : 'MÉCANIQUE ACTIVE'}
                <br><small>${this.gameState.bossManager.isBossMalusDisabled() ? 'Bonus vendu - malus désactivé' : 'Bloque les relances, bonus, synergies et dégâts tant qu\'aucun bonus n\'est vendu'}</small>
            `;
        } else {
            // Supprimer l'indicateur s'il existe mais que Quilegan n'est plus actif
            const existingIndicator = combatProgressContainer.querySelector('.quilegan-progress-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Supprimer la mécanique de boss si ce n'est plus un combat de boss
            if (!this.gameState.currentCombat.isBossFight) {
                const existingBossMechanic = combatProgressContainer.querySelector('.boss-info');
                if (existingBossMechanic) {
                    existingBossMechanic.remove();
                }
            } else {
                // Ajouter la mécanique de boss si c'est un combat de boss et qu'elle n'existe pas déjà
                const existingBossMechanic = combatProgressContainer.querySelector('.boss-info');
                if (!existingBossMechanic) {
                    const bossMechanicElement = this.createBossMechanicElement();
                    if (bossMechanicElement) {
                        // Insérer la mécanique après l'indicateur Quilegan ou au début
                        const firstChild = combatProgressContainer.firstChild;
                        combatProgressContainer.insertBefore(bossMechanicElement, firstChild);
                    }
                }
            }
        }
        
        // Mettre à jour le titre
        if (title) {
            title.textContent = this.gameState.currentCombat.isBossFight ? 
                `BOSS: ${this.gameState.currentCombat.bossName}` : 'Progression du Combat';
        }
        
        // Mettre à jour la barre de progression
        if (progressFill) {
            const percentage = Math.min((this.gameState.currentCombat.totalDamage / this.gameState.currentCombat.targetDamage) * 100, 100);
            progressFill.style.width = `${percentage}%`;
        }
        
        // Mettre à jour le texte de progression
        if (progressText) {
            progressText.innerHTML = `
                ${this.gameState.currentCombat.totalDamage} / ${this.gameState.currentCombat.targetDamage} dégâts 
                (Tour ${this.gameState.currentCombat.round}/${this.gameState.currentCombat.maxRounds})
            `;
        }
        
        // Mettre à jour l'image de l'ennemi
        if (enemyImage) {
            if (this.gameState.BOSS_RANKS.includes(this.gameState.rank)) {
                enemyImage.src = 'assets/orcs.jpg';
            } else {
                enemyImage.src = getEnemyImage(this.gameState.rank);
            }
        }
    }

    // === MÉTHODES DE GESTION UI DU MAGASIN ===

    // Ouvrir la modal de vente de bonus
    openSellBonusesModal(gameState) {
        const modal = document.getElementById('sell-bonuses-modal');
        const bonusesList = document.getElementById('sell-bonuses-list');
        const totalGoldGain = document.getElementById('total-gold-gain');
        
        if (!modal || !bonusesList) {
            console.error('Modal de vente de bonus non trouvée');
            return;
        }
        
        // Vider la liste
        bonusesList.innerHTML = '';
        
        // Compter les occurrences de chaque bonus
        const bonusCounts = {};
        gameState.unlockedBonuses.forEach(bonusId => {
            bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
        });
        
        const bonusDescriptions = gameState.getBonusDescriptions();
        let totalGain = 0;
        
        // Créer les éléments pour chaque bonus
        Object.keys(bonusCounts).forEach(bonusId => {
            const bonus = bonusDescriptions[bonusId];
            if (bonus) {
                const count = bonusCounts[bonusId];
                const buyPrice = calculateBonusPrice(bonusId);
                const sellPrice = Math.floor(buyPrice / 2);
                const totalPrice = sellPrice * count;
                totalGain += totalPrice;
                
                // Calculer la description dynamique pour les bonus dynamiques
                let dynamicDescription = bonus.description;
                if (bonusId === 'cac_cest_la_vie' && bonus.effects) {
                    let totalValue = 0;
                    let triggerCount = 0;
                    let baseValue = 0;
                    
                    bonus.effects.forEach(effect => {
                        if (effect.condition === 'base') {
                            // Valeur de base + améliorations d'achat
                            baseValue = effect.value;
                            if (gameState.dynamicBonusStates && 
                                gameState.dynamicBonusStates[bonusId] && 
                                gameState.dynamicBonusStates[bonusId]['base']) {
                                baseValue += gameState.dynamicBonusStates[bonusId]['base'];
                            }
                            totalValue += baseValue;
                        }
                        else if (effect.condition === 'synergy_trigger') {
                            // Récupérer le compteur depuis les états sauvegardés
                            if (gameState.dynamicBonusStates && 
                                gameState.dynamicBonusStates[bonusId] && 
                                gameState.dynamicBonusStates[bonusId][effect.triggerSynergy]) {
                                triggerCount = gameState.dynamicBonusStates[bonusId][effect.triggerSynergy];
                            } else {
                                triggerCount = effect.triggerCount || 0;
                            }
                            totalValue += effect.value * triggerCount;
                        }
                    });
                    
                    dynamicDescription = `Augmente les multiplicateurs de +${totalValue} des unités de corps à corps. +1 bonus supplémentaire à chaque activation de Formation Corps à Corps. (Actuellement : +${triggerCount} activations)`;
                }
                else if (bonusId === 'economie_dune_vie' && bonus.effects) {
                    let totalValue = 0;
                    let combatCount = 0;
                    let baseValue = 0;
                    
                    bonus.effects.forEach(effect => {
                        if (effect.condition === 'base') {
                            // Valeur de base + améliorations d'achat
                            baseValue = effect.value;
                            if (gameState.dynamicBonusStates && 
                                gameState.dynamicBonusStates[bonusId] && 
                                gameState.dynamicBonusStates[bonusId]['base']) {
                                baseValue += gameState.dynamicBonusStates[bonusId]['base'];
                            }
                            totalValue += baseValue;
                        }
                        else if (effect.condition === 'end_of_combat') {
                            // Récupérer le compteur depuis les états sauvegardés
                            if (gameState.dynamicBonusStates && 
                                gameState.dynamicBonusStates[bonusId] && 
                                gameState.dynamicBonusStates[bonusId]['end_of_combat']) {
                                combatCount = gameState.dynamicBonusStates[bonusId]['end_of_combat'];
                            } else {
                                combatCount = effect.triggerCount || 0;
                            }
                            totalValue += effect.value * combatCount;
                        }
                    });
                    
                    dynamicDescription = `Ce bonus donne +${totalValue} d'or par combat. Il augmente de +2 d'or par combat terminé. (Actuellement : +${combatCount} combats terminés)`;
                }
                
                const bonusElement = document.createElement('div');
                bonusElement.className = 'sell-bonus-item';
                bonusElement.innerHTML = `
                    <div class="sell-bonus-info">
                        <div class="sell-bonus-name">
                            ${bonus.icon} ${bonus.name}
                        </div>
                        <div class="sell-bonus-description">${dynamicDescription}</div>
                        <div class="sell-bonus-count">Quantité disponible : ${count}</div>
                    </div>
                    <div class="sell-bonus-controls">
                        <div class="sell-quantity-controls">
                            <button class="quantity-btn minus" data-bonus-id="${bonusId}" title="Diminuer">-</button>
                            <input type="number" class="sell-quantity-input" value="0" min="0" max="${count}" data-bonus-id="${bonusId}" data-price="${sellPrice}">
                            <button class="quantity-btn plus" data-bonus-id="${bonusId}" title="Augmenter">+</button>
                        </div>
                        <div class="sell-bonus-price">
                            <div class="sell-bonus-price-value">${sellPrice}💰 par unité</div>
                            <div class="sell-bonus-price-total">Total : <span class="total-price">0💰</span></div>
                        </div>
                    </div>
                `;
                
                // Ajouter les événements pour les contrôles de quantité
                const minusBtn = bonusElement.querySelector('.quantity-btn.minus');
                const plusBtn = bonusElement.querySelector('.quantity-btn.plus');
                const quantityInput = bonusElement.querySelector('.sell-quantity-input');
                const totalPriceSpan = bonusElement.querySelector('.total-price');
                
                // Fonction pour mettre à jour le prix total
                const updateTotalPrice = () => {
                    const quantity = parseInt(quantityInput.value) || 0;
                    const totalPrice = quantity * sellPrice;
                    totalPriceSpan.textContent = `${totalPrice}💰`;
                    
                    // Mettre à jour l'apparence de l'élément
                    bonusElement.classList.toggle('has-quantity', quantity > 0);
                    
                    // Mettre à jour l'état des boutons
                    minusBtn.disabled = quantity <= 0;
                    plusBtn.disabled = quantity >= count;
                    
                    this.updateSellBonusesSummary();
                };
                
                // Événements pour les boutons + et -
                minusBtn.addEventListener('click', () => {
                    const currentValue = parseInt(quantityInput.value) || 0;
                    if (currentValue > 0) {
                        quantityInput.value = currentValue - 1;
                        updateTotalPrice();
                    }
                });
                
                plusBtn.addEventListener('click', () => {
                    const currentValue = parseInt(quantityInput.value) || 0;
                    if (currentValue < count) {
                        quantityInput.value = currentValue + 1;
                        updateTotalPrice();
                    }
                });
                
                // Événement pour l'input direct
                quantityInput.addEventListener('input', updateTotalPrice);
                
                bonusesList.appendChild(bonusElement);
            }
        });
        
        // Mettre à jour le total initial
        totalGoldGain.textContent = '0💰';
        
        // Ajouter les boutons d'action
        this.addSellBonusesActions(modal, gameState);
        
        // Afficher la modal via ModalManager
        ModalManager.showModal('sell-bonuses-modal');
    }

    // Ajouter les boutons d'action à la modal
    addSellBonusesActions(modal, gameState) {
        // Supprimer les anciens boutons s'ils existent
        const existingActions = modal.querySelector('.sell-bonuses-actions');
        if (existingActions) {
            existingActions.remove();
        }
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'sell-bonuses-actions';
        actionsDiv.innerHTML = `
            <button class="btn secondary" id="cancel-sell-all">Annuler</button>
            <button class="btn primary" id="confirm-sell-all">Vendre Sélectionnés</button>
        `;
        
        modal.querySelector('.modal-body').appendChild(actionsDiv);
        
        // Gérer les événements
        actionsDiv.querySelector('#cancel-sell-all').addEventListener('click', () => {
            ModalManager.hideModal('sell-bonuses-modal');
        });
        
        actionsDiv.querySelector('#confirm-sell-all').addEventListener('click', () => {
            gameState.shopManager.executeSellBonuses(gameState);
        });
    }

    // === MÉTHODES DE GESTION UI DES TROUPES ===

    // Créer un pool complet de toutes les troupes disponibles
    createFullTroopPool() {
        const fullTroopPool = [];
        
        // Utiliser ownedUnits pour les quantités réelles des unités de base
        this.gameState.getBaseUnits().forEach(unit => {
            const quantity = this.gameState.ownedUnits[unit.name] || unit.quantity || 0;
            if (quantity > 0) {
                for (let i = 0; i < quantity; i++) {
                    fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
                }
            }
        });

        // Ajouter les unités spéciales achetées via ownedUnits
        this.gameState.getShopUnits().forEach(unit => {
            const quantity = this.gameState.ownedUnits[unit.name] || 0;
            if (quantity > 0) {
                for (let i = 0; i < quantity; i++) {
                    fullTroopPool.push({...unit, id: `${unit.name}_${Date.now()}_${i}_${Math.random()}`});
                }
            }
        });

        // Ajouter les troupes déjà dans availableTroops (unités transformées, etc.)
        return [
            ...fullTroopPool,
            ...this.gameState.availableTroops
        ];
    }

    // Grouper les troupes par type
    groupTroopsByType(allTroops) {
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

    // Ajuster les compteurs pour les unités transformées
    adjustTransformedUnitsCount(troopsByType) {
        if (!this.gameState.transformedBaseUnits) {
            this.gameState.transformedBaseUnits = {};
            return;
        }
        
        Object.keys(this.gameState.transformedBaseUnits).forEach(unitName => {
            if (troopsByType[unitName]) {
                troopsByType[unitName].count = Math.max(0, troopsByType[unitName].count - this.gameState.transformedBaseUnits[unitName]);
            }
        });
    }

    // Créer une icône de troupe avec tooltip
    createTroopIcon(troopName, troopData) {
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

    // Créer toutes les icônes de troupes
    createTroopIcons(troopsByType) {
        const troopElements = [];
        
        Object.keys(troopsByType).forEach(troopName => {
            const troopData = troopsByType[troopName];
            if (troopData.count > 0) {
                const troopElement = this.createTroopIcon(troopName, troopData);
                troopElements.push(troopElement);
            }
        });
        
        return troopElements;
    }

    // Créer les classes CSS pour les cartes de troupes
    createTroopCardClasses(troop, isSelected, isUsed) {
        const classes = ['unit-card'];
        if (isSelected) classes.push('selected');
        if (isUsed) classes.push('used');
        if (troop.rarity) classes.push(`rarity-${troop.rarity}`);
        return classes.join(' ');
    }

    // Appliquer le style de rareté
    applyRarityStyling(card, troop) {
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

    // Générer le HTML de la carte
    generateTroopCardHTML(troop, isUsed) {
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

    // Attacher les événements de la carte
    attachTroopCardEvents(card, troop, troopId, isSelected, isUsed) {
        card.addEventListener('click', () => {
            if (isUsed) {
                this.gameState.notificationManager.showUnitUsedError('Cette troupe a déjà été utilisée dans ce rang !');
                return;
            }
            
            if (isSelected) {
                // Trouver l'index dans selectedTroops pour la désélection
                const selectedIndex = this.gameState.selectedTroops.findIndex(t => t.id === troop.id);
                if (selectedIndex !== -1) {
                    this.gameState.deselectTroopFromCombat(selectedIndex);
                }
            } else {
                // Utiliser l'ID de la troupe pour la sélection
                this.gameState.selectTroopById(troop.id);
            }
        });
    }

    // Afficher toutes les troupes avec transformations (pour ConsumableManager)
    showAllTroopsWithTransformations() {
        const troopsList = document.getElementById('all-troops-list');
        const troopsModal = document.getElementById('troops-modal');
        
        if (!troopsList || !troopsModal) return;

        troopsList.innerHTML = '';

        // Créer un pool complet de toutes les troupes disponibles (quantité configurable)
        const fullTroopPool = [];
        this.gameState.getBaseUnits().forEach(unit => {
            const quantity = unit.quantity || 5; // Valeur par défaut si non définie
            for (let i = 0; i < quantity; i++) {
                fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
            }
        });

        // Ajouter seulement les troupes achetées dans le magasin (pas les troupes de base)
        const allTroops = [
            ...fullTroopPool,
            ...this.gameState.availableTroops
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



        // Créer les éléments pour chaque type de troupe
        Object.keys(troopsByType).forEach(troopName => {
            const troopData = troopsByType[troopName];
            if (troopData.count > 0) {
                const troopElement = this.createTroopListItem(troopName, troopData);
                troopsList.appendChild(troopElement);
            }
        });

        // Afficher la modal
        ModalManager.showModal('troops-modal');
    }

    // Créer un élément de liste de troupe avec boutons de transformation
    createTroopListItem(troopName, troopData) {
        const troopElement = document.createElement('div');
        troopElement.className = 'troop-list-item';
        
        const typeDisplay = getTypeDisplayString(troopData.type);
        const rarityHTML = troopData.rarity ? 
            `<div class="unit-rarity" style="color: ${getRarityColor(troopData.rarity)}; font-weight: 600; margin-top: 5px; font-size: 0.8rem;">
                ${getRarityIcon(troopData.rarity)} ${getRarityDisplayName(troopData.rarity)}
            </div>` : '';
        
        troopElement.innerHTML = `
            <div class="troop-info">
                <div class="troop-icon">${troopData.icon}</div>
                <div class="troop-details">
                    <div class="troop-name">${troopName}</div>
                    <div class="troop-stats"><span class="troop-damage">${troopData.damage}</span> × <span class="troop-multiplier">${troopData.multiplier}</span></div>
                    <div class="troop-type">${typeDisplay}</div>
                    ${rarityHTML}
                </div>
                <div class="troop-count">${troopData.count}</div>
            </div>
            <div class="troop-actions">
                ${this.generateTransformButton(troopName, troopData.count)}
            </div>
        `;
        
        return troopElement;
    }

    // Générer le bouton de transformation approprié
    generateTransformButton(troopName, availableCount) {
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
            const hasTransform = this.gameState.consumableManager.consumables.some(c => c.type === consumableType);
            if (hasTransform && troopName !== transformInfo.target) {
                return `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="${transformInfo.target}" title="Transformer en ${transformInfo.target}">
                    ${transformInfo.icon} Transformer
                </button>`;
            }
        }

        return '';
    }

    // === GESTION DU MODE TRANSFORMATION ===

    // Activer le mode transformation avec curseur personnalisé
    activateTransformMode(consumable, gameState) {
        // Stocker le consommable de transformation actif
        gameState.consumableManager.activeTransformConsumable = consumable;
        
        // Changer le curseur avec l'icône du consommable
        this.setTransformCursor(consumable, gameState);
        
        // Ajouter les événements de clic sur les troupes du header
        this.addTransformClickListeners(gameState);
        
        // Afficher une notification
        const targetUnitName = consumable.targetUnit || 'Épéiste';
    }
    
    // Changer le curseur avec l'icône du consommable
    setTransformCursor(consumable, gameState) {
        // Utiliser un curseur en forme de cible/sélecteur très visible
        document.body.style.cursor = `16 16, crosshair`;
        
        // Ajouter une classe pour le style du curseur
        document.body.classList.add('transform-mode');
        
        // Ajouter des effets visuels pour indiquer le mode transformation
        this.addTransformModeVisuals(consumable, gameState);
    }
    
    // Ajouter des effets visuels pour le mode transformation
    addTransformModeVisuals(consumable, gameState) {
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
                <button class="transform-cancel" onclick="gameState.consumableManager.cancelTransformMode(gameState)">✕</button>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Ajouter un gestionnaire d'événements pour fermer avec Échap
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.cancelTransformMode(gameState);
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
    cancelTransformMode(gameState = null) {
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
        if (gameState) {
            gameState.consumableManager.activeTransformConsumable = null;
        } else {
            // Fallback pour les appels depuis le HTML
            if (window.gameState && window.gameState.consumableManager) {
                window.gameState.consumableManager.activeTransformConsumable = null;
            }
        }
    }
    
    // Ajouter les événements de clic sur les troupes du header
    addTransformClickListeners(gameState) {
        const troopsContainer = document.getElementById('troops-display');
        if (!troopsContainer) return;
        
        // Supprimer les anciens listeners
        this.removeTransformClickListeners(gameState);
        
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
    removeTransformClickListeners(gameState) {
        const troopsContainer = document.getElementById('troops-display');
        if (!troopsContainer) return;
        
        const troopIcons = troopsContainer.querySelectorAll('.troop-icon-header');
        troopIcons.forEach(icon => {
            icon.removeEventListener('click', this.handleTroopTransformClick);
        });
    }
    
    // Gérer le clic sur une troupe pour la transformation
    handleTroopTransformClick(troopIcon, gameState) {
        if (!gameState.consumableManager.activeTransformConsumable) return;
        
        const troopName = troopIcon.getAttribute('data-troop-name');
        const targetUnitName = gameState.consumableManager.activeTransformConsumable.targetUnit || 'Épéiste';
        
        // Vérifier si l'unité peut être transformée
        if (!this.canTransformUnit(troopName, gameState)) {
            gameState.notificationManager.showConsumableError(`Impossible de transformer cette unité !`);
            return;
        }
        
        // Afficher la modal de confirmation
        this.showTransformConfirmationModal(troopName, targetUnitName, gameState);
        
        // Annuler le mode transformation après avoir affiché la modal
        this.cancelTransformMode(gameState);
    }
    
    // Vérifier si une unité peut être transformée
    canTransformUnit(troopName, gameState) {
        // Vérifier si l'utilisateur a un consommable de transformation approprié
        const transformConsumables = gameState.consumableManager.consumables.filter(c =>
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
        const fromIcon = this.getUnitIcon(fromUnitName, gameState);
        const toIcon = this.getUnitIcon(toUnitName, gameState);
        
        // Textes de la modal
        const modalTitle = 'Confirmation de transformation';
        const confirmText = `Êtes-vous sûr de vouloir transformer une unité <strong>${fromUnitName}</strong> en <strong>${toUnitName}</strong> ?`;
        const irreversibleText = 'Cette action est irréversible.';
        const cancelText = 'Annuler';
        const confirmButtonText = 'Confirmer';
        
        // Créer le contenu de la modal
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
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
                        <p>${confirmText}</p>
                        <p>${irreversibleText}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="gameState.uiManager.cancelTransformMode()">${cancelText}</button>
                    <button class="btn btn-primary" onclick="gameState.uiManager.confirmTransform('${fromUnitName}', '${toUnitName}')">${confirmButtonText}</button>
                </div>
            </div>
        `;
        
        // Créer la modal
        const modal = document.createElement('div');
        modal.id = 'transform-confirmation-modal';
        modal.className = 'modal';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Afficher la modal avec la classe active
        modal.classList.add('active');
        
        // Gestionnaire de fermeture
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300); // Attendre la fin de l'animation
            });
        }
    }
    
    // Confirmer la transformation
    confirmTransform(fromUnitName, toUnitName) {
        // Fermer la modal
        const modal = document.getElementById('transform-confirmation-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300); // Attendre la fin de l'animation
        }
        
        // Effectuer la transformation
        this.gameState.consumableManager.transformUnitFromModal(fromUnitName, toUnitName, this.gameState);
    }
    
    // Obtenir l'icône d'une unité par son nom
    getUnitIcon(unitName, gameState) {
        const allUnits = [...gameState.getBaseUnits(), ...gameState.getAllAvailableTroops()];
        const unit = allUnits.find(u => u.name === unitName);
        return unit ? unit.icon : '❓';
    }

    // Récupérer l'icône d'un consommable
    getConsumableIcon(consumableType) {
        const consumableData = this.gameState.consumableManager.CONSUMABLES_TYPES[consumableType];
        return consumableData ? consumableData.icon : '❓';
    }

    // Afficher la modal d'amélioration de synergie
    showSynergyUpgradeModal() {
        // Créer le contenu de la modal
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💎 Améliorer une Synergie</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Sélectionnez une synergie à améliorer :</p>
                    <div id="synergy-upgrade-list"></div>
                </div>
            </div>
        `;

        // Créer la modal si elle n'existe pas
        let modal = document.getElementById('synergy-upgrade-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'synergy-upgrade-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = modalContent;
        
        // Afficher la liste des synergies disponibles
        this.updateSynergyUpgradeList();
        
        // Afficher la modal via ModalManager
        ModalManager.showModal('synergy-upgrade-modal');
    }
    
    // Mettre à jour la liste des synergies pour l'amélioration
    updateSynergyUpgradeList() {
        const container = document.getElementById('synergy-upgrade-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const synergyNames = Object.keys(this.gameState.synergyLevels);
        
        synergyNames.forEach(synergyName => {
            const currentLevel = this.gameState.synergyLevels[synergyName];
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
                this.gameState.consumableManager.upgradeSynergy(synergyName, this.gameState);
            });
            
            container.appendChild(synergyElement);
        });
    }

    // Créer un élément d'item du magasin
    createShopItemElement(item, gameState) {
        const itemElement = document.createElement('div');
        
        // Ajouter la classe de rareté
        const rarityClass = item.rarity ? `rarity-${item.rarity}` : '';
        itemElement.className = `shop-item ${rarityClass}`;
        
        // Vérifier la disponibilité
        const availability = gameState.shopManager.checkItemAvailability(item, gameState);
        
        // Griser si pas disponible
        if (!availability.isAvailable) {
            itemElement.style.opacity = '0.5';
        }
        
        // Créer le HTML selon le type d'item
        if (item.type === 'unit') {
            itemElement.innerHTML = this.createUnitItemHTML(item);
        } else {
            itemElement.innerHTML = this.createBonusConsumableItemHTML(item);
        }
        
        // Ajouter l'événement d'achat si disponible
        if (availability.isAvailable) {
            this.attachPurchaseEvent(itemElement, item, gameState);
        }
        
        return itemElement;
    }

    // Créer le HTML pour un item d'unité
    createUnitItemHTML(item) {
        const rarityHTML = item.rarity ? 
            `<div class="item-rarity" style="color: ${getRarityColor(item.rarity)}; font-weight: 600; margin-top: 5px; font-size: 0.8rem;">
                ${getRarityIcon(item.rarity)} ${getRarityDisplayName(item.rarity)}
            </div>` : '';
        
        // Nom de l'unité
        const unitName = item.name;
        
        return `
            <div class="item-type-tag" data-type="${item.type}">${this.getItemTypeTag(item.type)}</div>
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${unitName}</div>
            <div class="item-stats"><span class="item-damage">${item.damage}</span> × <span class="item-multiplier">${item.multiplier}</span></div>
            <div class="item-type">${getTypeDisplayString(item.unitType)}</div>
            ${rarityHTML}
            <div class="item-price">${item.price}💰</div>
        `;
    }

    // Créer le HTML pour un item de bonus/consommable
    createBonusConsumableItemHTML(item) {
        const rarityHTML = item.rarity ? 
            `<div class="item-rarity" style="color: ${getRarityColor(item.rarity)}; font-weight: 600; margin-top: 5px; font-size: 0.8rem;">
                ${getRarityIcon(item.rarity)} ${getRarityDisplayName(item.rarity)}
            </div>` : '';
        
        // Nom et description de l'item
        const itemName = item.name;
        const itemDescription = item.description;
        
        return `
            <div class="item-type-tag" data-type="${item.type}">${this.getItemTypeTag(item.type)}</div>
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${itemName}</div>
            <div class="item-description">${itemDescription}</div>
            ${rarityHTML}
            <div class="item-price">${item.price}💰</div>
        `;
    }

    // Attacher l'événement d'achat à un élément d'item
    attachPurchaseEvent(itemElement, item, gameState) {
        itemElement.addEventListener('click', () => {
            if (gameState.shopManager.spendGold(gameState, item.price)) {
                if (item.type === 'unit') {
                    // Utiliser la nouvelle méthode pour acheter l'unité
                    const success = gameState.shopManager.purchaseUnit(item.name, gameState);
                    if (success) {
                        // Ajouter à la liste des unités achetées dans cette session
                        gameState.shopManager.currentShopPurchasedUnits.push(item.name);
                    }
                } else if (item.type === 'consumable') {
                    // Ajouter le consommable à l'inventaire
                    gameState.addConsumable(item.consumableType);
                    // Ajouter à la liste des consomables achetés dans cette session
                    gameState.shopManager.currentShopPurchasedConsumables.push(item.consumableType);
                } else {
                    gameState.unlockBonus(item.bonusId);
                    // Ajouter le bonus à la liste des bonus achetés dans cette session
                    gameState.shopManager.currentShopPurchasedBonuses.push(item.bonusId);
                }
                gameState.updateUI();
                gameState.updateActiveBonuses(); // Forcer la mise à jour des bonus actifs
            }
        });
    }

    // Mettre à jour le résumé de vente des bonus
    updateSellBonusesSummary() {
        const quantityInputs = document.querySelectorAll('.sell-quantity-input');
        const totalGoldGain = document.getElementById('total-gold-gain');
        
        let totalGain = 0;
        quantityInputs.forEach(input => {
            const quantity = parseInt(input.value) || 0;
            const price = parseInt(input.dataset.price);
            totalGain += price * quantity;
        });
        
        totalGoldGain.textContent = `${totalGain}💰`;
    }

    // Obtenir le tag de type d'item
    getItemTypeTag(itemType) {
        switch (itemType) {
            case 'unit': return 'Unité';
            case 'bonus': return 'Bonus';
            case 'consumable': return 'Cons.';
            default: return '';
        }
    }

    // === MÉTHODES DE GESTION UI DU COMBAT ===

    // Mettre à jour la modal de combat
    updateCombatModal() {
        this.updateCombatModalBasicElements();
        this.updateBossDamageGauge();
        this.gameState.createInitialCombatLog();
    }
} 