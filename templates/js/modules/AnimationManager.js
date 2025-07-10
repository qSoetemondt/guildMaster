// Gestionnaire d'animations pour GuildMaster
import { getTypeDisplayString } from './UnitConstants.js';

export class AnimationManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.animationSpeed = 1; // Vitesse d'animation par défaut
    }

    // === ANIMATIONS DE COMBAT ===

    /**
     * Jouer l'animation complète de combat
     * @param {Array} troopsUsed - Les troupes utilisées
     * @param {number} turnDamage - Les dégâts du tour
     */
    async playCombatAnimation(troopsUsed, turnDamage) {
        // Initialisation
        const elements = this.initializeCombatAnimation();
        this.setupAnimationCloseEvent(elements.closeButton);
        
        // Réinitialisation des compteurs
        this.resetAnimationCounters(
            elements.damageCounter, 
            elements.multiplierCounter, 
            elements.finalResult, 
            elements.unitsContent, 
            elements.synergiesContent, 
            elements.bonusesContent
        );
        
        // Variables pour le compteur principal (toujours repartent à 0)
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        // Garder en mémoire les dégâts déjà réalisés pour le remplissage de la barre seulement
        const previousDamage = this.gameState.currentCombat.totalDamage - turnDamage; // Dégâts avant ce round
        this.initializeMainCounter(previousDamage);
        
        // Variables pour les bonus d'équipement et synergies (ne s'accumulent pas dans le compteur)
        let equipmentDamage = 0;
        let equipmentMultiplier = 0;
        let synergyDamage = 0;
        let synergyMultiplier = 0;
        
        // PHASE 0: Afficher le malus de boss en premier si c'est un combat de boss (seulement au premier round)
        await this.animateBossMalus();
        
        // PHASE 1: Afficher les bonus d'équipement actifs
        const equipmentBonuses = await this.animateEquipmentBonuses(elements.bonusesContent);
        
        // PHASE 2: Afficher les synergies
        const synergies = await this.animateSynergies(elements.synergiesContent, troopsUsed);
        
        // PHASE 3: Animer les unités une par une avec accumulation progressive
        await this.animateUnits(
            troopsUsed, 
            equipmentBonuses, 
            synergies, 
            elements.damageCounter, 
            elements.multiplierCounter, 
            elements.finalResult, 
            elements.unitsContent, 
            previousDamage,
            turnDamage
        );
        
        // PHASE 4: Finalisation
        await this.finalizeCombatAnimation();
    }

    /**
     * Initialiser l'animation de combat
     * @returns {Object} - Les éléments DOM nécessaires
     */
    initializeCombatAnimation() {
        const container = document.getElementById('combat-animation-container');
        const closeButton = document.getElementById('close-combat-animation');
        const damageCounter = document.getElementById('total-damage-counter');
        const multiplierCounter = document.getElementById('total-multiplier-counter');
        const finalResult = document.getElementById('final-result');
        const unitsContent = document.getElementById('units-slider-content');
        const synergiesContent = document.getElementById('synergies-animation-content');
        const bonusesContent = document.getElementById('bonuses-animation-content');
        
        // Afficher le conteneur d'animation
        container.style.display = 'flex';
        
        // Afficher le bouton de fermeture
        const closeSection = document.getElementById('combat-close-section');
        if (closeSection) {
            closeSection.style.display = 'block';
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

    /**
     * Configurer l'événement de fermeture de l'animation
     * @param {HTMLElement} closeButton - Le bouton de fermeture
     */
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
            this.gameState.updateCombatProgressDisplay();
            this.gameState.updateUI();
            this.gameState.updateTroopsUI();
            
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

    /**
     * Réinitialiser les compteurs d'animation
     */
    resetAnimationCounters(damageCounter, multiplierCounter, finalResult, unitsContent, synergiesContent, bonusesContent) {
        // Réinitialiser les compteurs
        if (damageCounter) damageCounter.textContent = '0';
        if (multiplierCounter) multiplierCounter.textContent = '0';
        if (finalResult) finalResult.textContent = '= 0 dégâts';
        
        // Vider les conteneurs
        if (unitsContent) unitsContent.innerHTML = '';
        if (synergiesContent) synergiesContent.innerHTML = '';
        if (bonusesContent) bonusesContent.innerHTML = '';
        
        // Vider aussi les conteneurs mobile
        const unitsContentMobile = document.getElementById('units-slider-content-mobile');
        const synergiesContentMobile = document.getElementById('synergies-animation-content-mobile');
        const bonusesContentMobile = document.getElementById('bonuses-animation-content-mobile');
        
        if (unitsContentMobile) unitsContentMobile.innerHTML = '';
        if (synergiesContentMobile) synergiesContentMobile.innerHTML = '';
        if (bonusesContentMobile) bonusesContentMobile.innerHTML = '';
    }

    /**
     * Initialiser le compteur principal
     * @param {number} previousDamage - Les dégâts précédents
     */
    initializeMainCounter(previousDamage) {
        const mainCounter = document.querySelector('.main-counter');
        if (mainCounter) {
            const targetDamage = this.gameState.currentCombat.targetDamage;
            const percentage = Math.min((previousDamage / targetDamage) * 100, 100);
            mainCounter.style.setProperty('--progress-width', `${percentage}%`);
            
            // Ajouter la classe over-100 si on dépasse 100%
            if (percentage > 100) {
                mainCounter.classList.add('over-100');
            } else {
                mainCounter.classList.remove('over-100');
            }
        }
    }

    /**
     * Animer le malus de boss
     */
    async animateBossMalus() {
        if (!this.gameState.currentCombat.isBossFight) {
            return;
        }
        
        // Supprimer l'ancien malus s'il existe
        const existingBossMalus = document.querySelector('.boss-malus-container');
        if (existingBossMalus) {
            existingBossMalus.remove();
        }
        
        // Vérifier si le malus est désactivé (mécanique réutilisable)
        const isMalusDisabled = this.gameState.bossManager.isBossMalusDisabled();
        
        // Créer un encart spécial pour le malus de boss
        const bossMalusContainer = document.createElement('div');
        bossMalusContainer.className = 'boss-malus-container';
        
        // Appliquer le style selon l'état du malus
        if (isMalusDisabled) {
            bossMalusContainer.style.cssText = `
                background: linear-gradient(135deg, #28a745, #20c997);
                border: 3px solid #28a745;
                border-radius: 10px;
                padding: 10px;
                margin: 10px 0;
                box-shadow: 0 3px 12px rgba(40, 167, 69, 0.3);
                color: white;
                text-align: center;
                position: relative;
                overflow: hidden;
            `;
        } else {
            bossMalusContainer.style.cssText = `
                background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                border: 3px solid #c44569;
                border-radius: 10px;
                padding: 10px;
                margin: 10px 0;
                box-shadow: 0 3px 12px rgba(255, 107, 107, 0.3);
                color: white;
                text-align: center;
                position: relative;
                overflow: hidden;
            `;
        }
        
        // Ajouter un effet de brillance seulement si le malus est actif
        if (!isMalusDisabled) {
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
        }
        
        const bossMalusContent = document.createElement('div');
        bossMalusContent.style.cssText = `
            position: relative;
            z-index: 1;
        `;
        
        const bossTitle = document.createElement('div');
        bossTitle.style.cssText = `
            font-size: 1rem;
            font-weight: bold;
            margin-bottom: 6px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        `;
        bossTitle.textContent = isMalusDisabled ? '✅ MALUS DE BOSS DÉSACTIVÉ ✅' : '⚠️ MALUS DE BOSS ⚠️';
        
        const bossName = document.createElement('div');
        bossName.style.cssText = `
            font-size: 0.9rem;
            font-weight: bold;
            margin-bottom: 6px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        bossName.textContent = this.gameState.currentCombat.bossName;
        
        const bossEffect = document.createElement('div');
        bossEffect.style.cssText = `
            font-size: 0.85rem;
            font-style: italic;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        if (isMalusDisabled) {
            bossEffect.textContent = `${this.gameState.currentCombat.bossMechanic} - DÉSACTIVÉ`;
        } else {
            bossEffect.textContent = this.gameState.currentCombat.bossMechanic;
        }
        
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

    /**
     * Animer les bonus d'équipement
     * @param {HTMLElement} bonusesContent - Le conteneur des bonus
     * @returns {Array} - Les bonus d'équipement
     */
    async animateEquipmentBonuses(bonusesContent) {
        const equipmentBonuses = this.gameState.calculateEquipmentBonuses();

        if (equipmentBonuses.length > 0) {
            for (let i = 0; i < equipmentBonuses.length; i++) {
                const bonus = equipmentBonuses[i];
                
                const bonusElement = document.createElement('div');
                bonusElement.className = 'bonus-item';
                
                let bonusText = '';
                if (bonus.damage) {
                    bonusText += `+${bonus.damage} dégâts `;
                }
                if (bonus.multiplier) {
                    bonusText += `+${bonus.multiplier} multiplicateur `;
                }
                if (bonus.target !== 'all') {
                    bonusText += `(${bonus.target})`;
                }
                
                // Calculer le nombre d'occurrences de ce bonus
                const bonusCount = this.gameState.unlockedBonuses.filter(id => {
                    const bonusDescriptions = this.gameState.getBonusDescriptions();
                    const bonusDesc = bonusDescriptions[id];
                    return bonusDesc && bonusDesc.name === bonus.name;
                }).length;
                
                const countDisplay = bonusCount > 1 ? ` <span class="bonus-count">×${bonusCount}</span>` : '';
                
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
                
                // Ajouter la classe de rareté à l'élément
                bonusElement.className = `bonus-item rarity-${rarity}`;
                
                bonusElement.innerHTML = `
                    <div class="bonus-name">${bonus.name}${countDisplay}</div>
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
        return equipmentBonuses;
    }

    /**
     * Animer les synergies
     * @param {HTMLElement} synergiesContent - Le conteneur des synergies
     * @param {Array} troopsUsed - Les troupes utilisées
     * @returns {Array} - Les synergies
     */
    async animateSynergies(synergiesContent, troopsUsed) {
        const synergies = this.gameState.calculateSynergies(troopsUsed);
        
        if (synergies.length > 0) {
            for (let i = 0; i < synergies.length; i++) {
                const synergy = synergies[i];
                
                const synergyElement = document.createElement('div');
                synergyElement.className = 'synergy-item';
                
                let synergyText = '';
                if (synergy.bonus.damage) {
                    synergyText += `+${synergy.bonus.damage} dégâts `;
                }
                if (synergy.bonus.multiplier) {
                    synergyText += `+${synergy.bonus.multiplier} multiplicateur `;
                }
                if (synergy.bonus.target !== 'all') {
                    synergyText += `(${synergy.bonus.target})`;
                }
                
                synergyElement.innerHTML = `
                    <div class="synergy-name">${synergy.name}</div>
                    <div class="synergy-effect">${synergyText}</div>
                `;
                
                // Ajouter aux conteneurs desktop et mobile
                synergiesContent.appendChild(synergyElement);
                const synergiesContentMobile = document.getElementById('synergies-animation-content-mobile');
                if (synergiesContentMobile) {
                    const mobileSynergyElement = synergyElement.cloneNode(true);
                    synergiesContentMobile.appendChild(mobileSynergyElement);
                }
                
                await this.sleep(200);
                synergyElement.classList.add('active');
                await this.sleep(300);
            }
        } else {
            const noSynergyElement = document.createElement('div');
            noSynergyElement.className = 'synergy-item active';
            noSynergyElement.innerHTML = '<div class="synergy-name">Aucune synergie</div>';
            
            synergiesContent.appendChild(noSynergyElement);
            const synergiesContentMobile = document.getElementById('synergies-animation-content-mobile');
            if (synergiesContentMobile) {
                const mobileNoSynergyElement = noSynergyElement.cloneNode(true);
                synergiesContentMobile.appendChild(mobileNoSynergyElement);
            }
        }
        
        await this.sleep(500);
        return synergies;
    }

    /**
     * Animer les unités
     * @param {Array} troopsUsed - Les troupes utilisées
     * @param {Array} equipmentBonuses - Les bonus d'équipement
     * @param {Array} synergies - Les synergies
     * @param {HTMLElement} damageCounter - Le compteur de dégâts
     * @param {HTMLElement} multiplierCounter - Le compteur de multiplicateur
     * @param {HTMLElement} finalResult - Le résultat final
     * @param {HTMLElement} unitsContent - Le conteneur des unités
     * @param {number} previousDamage - Les dégâts précédents
     * @param {number} finalTurnDamage - Les dégâts finaux du tour
     */
    async animateUnits(troopsUsed, equipmentBonuses, synergies, damageCounter, multiplierCounter, finalResult, unitsContent, previousDamage, finalTurnDamage) {
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        console.log(`🐛 Animation: Utilisation des dégâts finaux passés = ${finalTurnDamage}`);
        
        // Log pour Quilegan
        if (this.gameState.currentCombat && this.gameState.currentCombat.isBossFight && 
            this.gameState.currentCombat.bossMechanic.includes('Bloque les relances, les bonus et les synergies tant qu\'aucun bonus n\'est vendu')) {
            console.log(`🐛 Animation Quilegan: bonusSoldThisCombat = ${this.gameState.bossManager.isBossMalusDisabled()}`);
        }
        
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
                    <div class="unit-stats-animated">
                        <div class="unit-stat-item">
                            <div class="unit-stat-value" id="unit-${i}-damage-mobile">${troop.damage}</div>
                            <div class="unit-stat-label">Dégâts</div>
                        </div>
                        <div class="unit-stat-item">
                            <div class="unit-stat-value" id="unit-${i}-multiplier-mobile">${troop.multiplier}</div>
                            <div class="unit-stat-label">Multiplicateur</div>
                        </div>
                    </div>
                `;
                unitsContentMobile.appendChild(mobileUnitElement);
            }
            
            await this.sleep(200);
            unitElement.classList.add('active');
            
            // Animer les bonus d'équipement pour cette unité
            for (const bonus of equipmentBonuses) {
                if (bonus.target === 'all' || this.gameState.hasTroopType(troop, bonus.target)) {
                    if (bonus.damage) {
                        this.showBonusAnimation(unitElement, `+${bonus.damage}`, 'damage');
                        totalDamage += bonus.damage;
                    }
                    if (bonus.multiplier) {
                        this.showBonusAnimation(unitElement, `+${bonus.multiplier}`, 'multiplier');
                        totalMultiplier += bonus.multiplier;
                    }
                }
            }
            
            // Animer les synergies pour cette unité
            for (const synergy of synergies) {
                if (synergy.bonus.target === 'all' || this.gameState.hasTroopType(troop, synergy.bonus.target)) {
                    if (synergy.bonus.damage) {
                        this.showBonusAnimation(unitElement, `+${synergy.bonus.damage}`, 'damage');
                        totalDamage += synergy.bonus.damage;
                    }
                    if (synergy.bonus.multiplier) {
                        this.showBonusAnimation(unitElement, `+${synergy.bonus.multiplier}`, 'multiplier');
                        totalMultiplier += synergy.bonus.multiplier;
                    }
                }
            }
            
            // Appliquer les mécaniques de boss
            if (this.gameState.currentCombat.isBossFight) {
                const mechanic = this.gameState.currentCombat.bossMechanic;
                
                // Mécaniques de malus
                if (mechanic.includes('corps à corps') && this.gameState.hasTroopType(troop, 'Corps à corps')) {
                    if (mechanic.includes('-50%')) {
                        this.showMalusAnimation(unitElement, '-50%', 'damage');
                    }
                    if (mechanic.includes('-2')) {
                        this.showMalusAnimation(unitElement, '-2', 'damage');
                    }
                }
                
                if (mechanic.includes('distance') && this.gameState.hasTroopType(troop, 'Distance')) {
                    if (mechanic.includes('-30%')) {
                        this.showMalusAnimation(unitElement, '-30%', 'damage');
                    }
                }
                
                if (mechanic.includes('multiplicateurs')) {
                    this.showMalusAnimation(unitElement, '-50%', 'multiplier');
                }
                
                // Mécaniques de bonus
                if (mechanic.includes('magiques') && this.gameState.hasTroopType(troop, 'Magique')) {
                    this.showBonusAnimation(unitElement, '+50%', 'damage');
                }
                
                // Effet spécial de Quilegan
                if (mechanic.includes('Bloque les relances, les bonus et les synergies tant qu\'aucun bonus n\'est vendu')) {
                    if (!this.gameState.bossManager.isBossMalusDisabled()) {
                        this.showMalusAnimation(unitElement, 'BLOQUÉ', 'damage');
                    } else {
                        this.showBonusAnimation(unitElement, 'MALUS DÉSACTIVÉ', 'damage');
                    }
                }
            }
            
            // Mettre à jour les compteurs
            if (damageCounter) {
                damageCounter.textContent = totalDamage;
            }
            if (multiplierCounter) {
                multiplierCounter.textContent = totalMultiplier;
            }
            
            // Animation de l'unité terminée
            await this.sleep(500);
        }
        
        // Animation finale : afficher le résultat correct
        await this.sleep(300);
        finalResult.textContent = `= ${finalTurnDamage} dégâts`;
        
        // Mise à jour finale de la barre de progression avec le résultat correct
        const mainCounter = document.querySelector('.main-counter');
        if (mainCounter) {
            const targetDamage = this.gameState.currentCombat.targetDamage;
            const totalDamageWithPrevious = previousDamage + finalTurnDamage;
            const percentage = Math.min((totalDamageWithPrevious / targetDamage) * 100, 100);
            
            // Mettre à jour la largeur du background avec le résultat final
            mainCounter.style.setProperty('--progress-width', `${percentage}%`);
            
            // Ajouter la classe over-100 si on dépasse 100%
            if (percentage > 100) {
                mainCounter.classList.add('over-100');
            } else {
                mainCounter.classList.remove('over-100');
            }
        }
        
        console.log(`🐛 Animation finale: Affichage du résultat correct = ${finalTurnDamage}`);
    }

    /**
     * Finaliser l'animation de combat
     */
    async finalizeCombatAnimation() {
        // PHASE 4: Finalisation (les mécaniques de boss sont déjà appliquées dans les calculs précédents)
        await this.sleep(200);
        
        // Animation finale
        await this.sleep(300);
        
        // Vérifier si c'est une victoire
        if (this.gameState.currentCombat.totalDamage >= this.gameState.currentCombat.targetDamage) {
            this.playVictoryAnimation();
        }
    }

    // === ANIMATIONS DE VICTOIRE ===

    /**
     * Jouer l'animation de victoire
     */
    playVictoryAnimation() {
        // Créer l'écran de victoire
        const victoryScreen = document.createElement('div');
        victoryScreen.className = 'victory-screen';
        
        // Créer le contenu de victoire
        const victoryContent = document.createElement('div');
        victoryContent.className = 'victory-content';
        
        // Titre principal
        const victoryTitle = document.createElement('div');
        victoryTitle.className = 'victory-title';
        victoryTitle.textContent = 'VICTOIRE !';
        
        // Sous-titre
        const victorySubtitle = document.createElement('div');
        victorySubtitle.className = 'victory-subtitle';
        victorySubtitle.textContent = 'Combat remporté avec succès !';
        
        // Ajouter les éléments
        victoryContent.appendChild(victoryTitle);
        victoryContent.appendChild(victorySubtitle);
        victoryScreen.appendChild(victoryContent);
        
        // Créer les étoiles flottantes
        const starsContainer = document.createElement('div');
        starsContainer.className = 'victory-stars';
        
        // Ajouter des étoiles aléatoires avec délai ajusté selon la vitesse
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const star = document.createElement('div');
                star.className = 'victory-star';
                star.textContent = '⭐';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 2 + 's';
                starsContainer.appendChild(star);
            }, this.getAnimationDelay(i * 200));
        }
        
        victoryScreen.appendChild(starsContainer);
        document.body.appendChild(victoryScreen);
        
        // Supprimer l'écran après 3 secondes (ajusté selon la vitesse)
        setTimeout(() => {
            if (victoryScreen.parentNode) {
                victoryScreen.parentNode.removeChild(victoryScreen);
            }
        }, this.getAnimationDelay(3000));
    }

    /**
     * Animer l'encadré de victoire
     * @param {HTMLElement} victoryBox - L'encadré de victoire
     */
    animateVictoryBox(victoryBox) {
        setTimeout(() => {
            victoryBox.classList.add('show');
        }, 100);
    }

    // === ANIMATIONS D'UNITÉS ===

    /**
     * Afficher une animation de bonus sur une unité
     * @param {HTMLElement} unitElement - L'élément de l'unité
     * @param {string} bonusText - Le texte du bonus
     * @param {string} type - Le type de bonus ('damage' ou 'multiplier')
     */
    showBonusAnimation(unitElement, bonusText, type) {
        const damageElement = unitElement.querySelector('.unit-stat-value:first-child');
        const multiplierElement = unitElement.querySelector('.unit-stat-value:last-child');
        
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

    /**
     * Afficher une animation de malus sur une unité
     * @param {HTMLElement} unitElement - L'élément de l'unité
     * @param {string} malusText - Le texte du malus
     * @param {string} type - Le type de malus ('damage' ou 'multiplier')
     */
    showMalusAnimation(unitElement, malusText, type) {
        const damageElement = unitElement.querySelector('.unit-stat-value:first-child');
        const multiplierElement = unitElement.querySelector('.unit-stat-value:last-child');
        
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

    // === UTILITAIRES ===

    /**
     * Fonction utilitaire pour les délais
     * @param {number} ms - Le délai en millisecondes
     * @returns {Promise} - Une promesse qui se résout après le délai
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, this.getAnimationDelay(ms)));
    }

    /**
     * Changer la vitesse d'animation
     * @param {number} speed - La vitesse d'animation
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
        
        // Mettre à jour l'affichage des boutons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-speed="${speed}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        console.log(`Vitesse d'animation changée: ${speed}x`);
    }

    /**
     * Obtenir le délai d'animation ajusté selon la vitesse
     * @param {number} baseDelay - Le délai de base
     * @returns {number} - Le délai ajusté
     */
    getAnimationDelay(baseDelay) {
        return baseDelay / this.animationSpeed;
    }
} 