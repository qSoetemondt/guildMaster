// Gestionnaire d'animations pour GuildMaster
import { getTypeDisplayString } from '../utils/TypeUtils.js';
import { incrementDynamicBonusTrigger } from './UnitManager.js';

export class AnimationManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.animationSpeed = 1; // Vitesse d'animation par défaut
    }

    // === MÉTHODES DE GESTION D'ANIMATION DE COMBAT (DÉPLACÉES DEPUIS COMBATMANAGER) ===

    // Gestion de l'animation de combat
    handleCombatAnimation(troopsUsed, turnDamage) {
        // Jouer l'animation de combat
        this.playCombatAnimation(troopsUsed, turnDamage).then(() => {
            // Mettre à jour l'UI après l'animation
            this.gameState.updateUIAfterAnimation();
            
            // Vérifier si le combat est terminé
            this.gameState.checkCombatEnd();
        });
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
            null, // On ne passe plus equipmentBonuses car on les recalcule dans animateUnits
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
                if (bonus.positionMultiplier) {
                    bonusText += `×${bonus.positionMultiplier} multiplicateur 4ème position `;
                }
                if (bonus.target !== 'all' && bonus.target !== 'fourth_position') {
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
                } else if (['Relique Ancienne', 'Position Quatre'].includes(bonus.name)) {
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
                
                // Vérifier si cette synergie déclenche un bonus dynamique
                if (synergy.name === 'Formation Corps à Corps') {
                    await this.animateDynamicBonusIncrease('cac_cest_la_vie', 'formation_corps_a_corps');
                }
                
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
     * Animer l'augmentation d'un bonus dynamique
     * @param {string} bonusId - L'ID du bonus dynamique
     * @param {string} triggerId - L'ID du déclencheur
     */
    async animateDynamicBonusIncrease(bonusId, triggerId) {
        // Incrémenter le bonus
        incrementDynamicBonusTrigger(bonusId, triggerId, this.gameState);
        
        // Trouver le bonus d'équipement correspondant dans l'animation
        const bonusesContent = document.getElementById('bonuses-animation-content');
        if (bonusesContent) {
            // Chercher le bonus "Le CAC c'est la vie"
            const bonusElements = bonusesContent.querySelectorAll('.bonus-item');
            for (const bonusElement of bonusElements) {
                const bonusName = bonusElement.querySelector('.bonus-name');
                if (bonusName && bonusName.textContent.includes('Le CAC c\'est la vie')) {
                    // Créer une animation +1 sur ce bonus
                    const plusOneElement = document.createElement('div');
                    plusOneElement.className = 'bonus-increase-animation';
                    plusOneElement.textContent = '+1';
                    plusOneElement.style.cssText = `
                        position: absolute;
                        top: -20px;
                        right: -10px;
                        background: linear-gradient(135deg, #ffd700, #ffed4e);
                        color: #8b4513;
                        font-weight: bold;
                        font-size: 1rem;
                        padding: 4px 8px;
                        border-radius: 8px;
                        border: 2px solid #ffb347;
                        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
                        z-index: 10;
                        animation: bonusIncrease 0.8s ease-out;
                    `;
                    
                    bonusElement.style.position = 'relative';
                    bonusElement.appendChild(plusOneElement);
                    
                    // Mettre à jour directement le texte du bonus avec la nouvelle valeur
                    const bonusEffect = bonusElement.querySelector('.bonus-effect');
                    if (bonusEffect) {
                        // Récupérer la nouvelle valeur du bonus
                        const updatedEquipmentBonuses = this.gameState.calculateEquipmentBonuses();
                        const updatedBonus = updatedEquipmentBonuses.find(bonus => 
                            bonus.name === 'Le CAC c\'est la vie'
                        );
                        
                        if (updatedBonus) {
                            let bonusText = '';
                            if (updatedBonus.damage) {
                                bonusText += `+${updatedBonus.damage} dégâts `;
                            }
                            if (updatedBonus.multiplier) {
                                bonusText += `+${updatedBonus.multiplier} multiplicateur `;
                            }
                            if (updatedBonus.target !== 'all') {
                                bonusText += `(${updatedBonus.target})`;
                            }
                            bonusEffect.textContent = bonusText;
                        }
                    }
                    
                    // Supprimer l'animation après 0.8 secondes
                    setTimeout(() => {
                        if (plusOneElement.parentNode) {
                            plusOneElement.parentNode.removeChild(plusOneElement);
                        }
                    }, 800);
                    
                    break;
                }
            }
        }
        
        // Attendre la fin de l'animation
        await this.sleep(800);
    }

    /**
     * Mettre à jour l'affichage des bonus avec les nouvelles valeurs
     * @param {HTMLElement} bonusesContent - Le conteneur des bonus
     */
    async updateBonusDisplay(bonusesContent) {
        // Vider le conteneur des bonus
        bonusesContent.innerHTML = '';
        
        // Récupérer les bonus d'équipement avec les nouvelles valeurs
        const updatedEquipmentBonuses = this.gameState.calculateEquipmentBonuses();
        
        if (updatedEquipmentBonuses.length > 0) {
            for (let i = 0; i < updatedEquipmentBonuses.length; i++) {
                const bonus = updatedEquipmentBonuses[i];
                
                const bonusElement = document.createElement('div');
                bonusElement.className = 'bonus-item';
                
                let bonusText = '';
                if (bonus.damage) {
                    bonusText += `+${bonus.damage} dégâts `;
                }
                if (bonus.multiplier) {
                    bonusText += `+${bonus.multiplier} multiplicateur `;
                }
                if (bonus.positionMultiplier) {
                    bonusText += `×${bonus.positionMultiplier} multiplicateur 4ème position `;
                }
                if (bonus.target !== 'all' && bonus.target !== 'fourth_position') {
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
                } else if (['Relique Ancienne', 'Position Quatre'].includes(bonus.name)) {
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
                
                await this.sleep(100);
                bonusElement.classList.add('active');
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
        
        await this.sleep(300);
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
        // Variables cumulatives pour CE round
        let cumulativeDamage = 0;
        let cumulativeMultiplier = 0;
        // On part de la progression précédente
        let progressionTotal = previousDamage;

        for (let i = 0; i < troopsUsed.length; i++) {
            const troop = troopsUsed[i];
            
            // Calculer les dégâts et multiplicateur comme dans calculateTurnDamage
            let currentDamage = troop.damage;
            let currentMultiplier = troop.multiplier;
            
            // Appliquer les synergies
            const synergies = this.gameState.calculateSynergies(troopsUsed);
            synergies.forEach(synergy => {
                if (synergy.bonus.target === 'all' || this.gameState.hasTroopType(troop, synergy.bonus.target)) {
                    if (synergy.bonus.damage) currentDamage += synergy.bonus.damage;
                    if (synergy.bonus.multiplier) currentMultiplier += synergy.bonus.multiplier;
                }
            });
            
            // Appliquer les bonus d'équipement (sauf position)
            const equipmentBonuses = this.gameState.calculateEquipmentBonuses();
            equipmentBonuses.forEach(bonus => {
                if (bonus.type !== 'position_bonus') {
                    if (bonus.target === 'all' || this.gameState.hasTroopType(troop, bonus.target)) {
                        if (bonus.damage) currentDamage += bonus.damage;
                        if (bonus.multiplier) currentMultiplier += bonus.multiplier;
                    }
                }
            });
            
            // Appliquer les mécaniques de boss
            if (this.gameState.currentCombat.isBossFight) {
                currentDamage = this.gameState.bossManager.applyBossMechanics(currentDamage, troop);
                currentMultiplier = this.gameState.bossManager.applyBossMechanicsToMultiplier(currentMultiplier, troop);
            }
            
            // Création de l'élément d'unité avec l'ID correct
            const unitElement = document.createElement('div');
            unitElement.className = 'unit-slide';
            unitElement.id = `unit-${troop.id}`;
            
            // Créer le contenu HTML de l'unité
            const typeDisplay = getTypeDisplayString(troop.type);
            
            // Nom de l'unité et labels
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
                        <div class="unit-stat-value" id="unit-${troop.id}-damage">${troop.damage}</div>
                        <div class="unit-stat-label">Dégâts</div>
                    </div>
                    <div class="unit-stat-item">
                        <div class="unit-stat-value" id="unit-${troop.id}-multiplier">${troop.multiplier}</div>
                        <div class="unit-stat-label">Multiplicateur</div>
                    </div>
                </div>
            `;
            
            // Ajouter l'élément au conteneur avant les animations
            if (unitsContent) {
                unitsContent.appendChild(unitElement);
            }
            
            // Ajouter aussi aux conteneurs mobile
            const unitsContentMobile = document.getElementById('units-slider-content-mobile');
            if (unitsContentMobile) {
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
                            <div class="unit-stat-value" id="unit-${troop.id}-damage-mobile">${troop.damage}</div>
                            <div class="unit-stat-label">Dégâts</div>
                        </div>
                        <div class="unit-stat-item">
                            <div class="unit-stat-value" id="unit-${troop.id}-multiplier-mobile">${troop.multiplier}</div>
                            <div class="unit-stat-label">Multiplicateur</div>
                        </div>
                    </div>
                `;
                unitsContentMobile.appendChild(mobileUnitElement);
            }
            
            // Animation d'apparition de l'unité
            await this.sleep(200);
            unitElement.classList.add('active');
            
            // Animer les bonus d'équipement si ils ont été appliqués
            for (const bonus of equipmentBonuses) {
                if (bonus.type !== 'position_bonus') {
                    if (bonus.target === 'all' || this.gameState.hasTroopType(troop, bonus.target)) {
                        if (bonus.damage && bonus.damage > 0) {
                            await this.sleep(150);
                            this.showBonusAnimation(unitElement, `+${bonus.damage}`, 'damage', currentDamage);
                            this.updateUnitStat(unitElement, 'damage', currentDamage);
                        }
                        if (bonus.multiplier && bonus.multiplier > 0) {
                            await this.sleep(150);
                            this.showBonusAnimation(unitElement, `+${bonus.multiplier}`, 'multiplier', currentMultiplier);
                            this.updateUnitStat(unitElement, 'multiplier', currentMultiplier);
                        }
                    }
                }
            }

            // Animer les synergies si elles ont été appliquées
            for (const synergy of synergies) {
                if (synergy.bonus.target === 'all' || this.gameState.hasTroopType(troop, synergy.bonus.target)) {
                    if (synergy.bonus.damage && synergy.bonus.damage > 0) {
                        await this.sleep(150);
                        this.showBonusAnimation(unitElement, `+${synergy.bonus.damage}`, 'damage', currentDamage);
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                    }
                    if (synergy.bonus.multiplier && synergy.bonus.multiplier > 0) {
                        await this.sleep(150);
                        this.showBonusAnimation(unitElement, `+${synergy.bonus.multiplier}`, 'multiplier', currentMultiplier);
                        this.updateUnitStat(unitElement, 'multiplier', currentMultiplier);
                    }
                }
            }

            // Animer le bonus "Position Quatre" si c'est la 4ème unité
            const positionBonuses = this.gameState.calculateEquipmentBonuses().filter(bonus => bonus.type === 'position_bonus');
            if (positionBonuses.length > 0 && i === 3) { // 4ème position (index 3)
                for (const bonus of positionBonuses) {
                    if (bonus.target === 'fourth_position') {
                        await this.sleep(200);
                        // Appliquer le bonus de position
                        const oldMultiplier = currentMultiplier;
                        currentMultiplier = currentMultiplier * bonus.positionMultiplier;
                        this.showBonusAnimation(unitElement, `×${bonus.positionMultiplier}`, 'multiplier', currentMultiplier);
                        this.updateUnitStat(unitElement, 'multiplier', currentMultiplier);
                    }
                }
            }

            // Animer les mécaniques de boss si elles ont été appliquées
            if (this.gameState.currentCombat.isBossFight) {
                const mechanic = this.gameState.currentCombat.bossMechanic;
                
                // Animer les malus de boss
                if (mechanic.includes('corps à corps') && this.gameState.hasTroopType(troop, 'Corps à corps')) {
                    if (mechanic.includes('-50%')) {
                        await this.sleep(150);
                        this.showMalusAnimation(unitElement, '-50%', 'damage', currentDamage);
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                    }
                    if (mechanic.includes('-2')) {
                        await this.sleep(150);
                        this.showMalusAnimation(unitElement, '-2', 'damage', currentDamage);
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                    }
                }
                if (mechanic.includes('distance') && this.gameState.hasTroopType(troop, 'Distance')) {
                    if (mechanic.includes('-30%')) {
                        await this.sleep(150);
                        this.showMalusAnimation(unitElement, '-30%', 'damage', currentDamage);
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                    }
                }
                if (mechanic.includes('multiplicateurs')) {
                    await this.sleep(150);
                    this.showMalusAnimation(unitElement, '-50%', 'multiplier', currentMultiplier);
                    this.updateUnitStat(unitElement, 'multiplier', currentMultiplier);
                }
                if (mechanic.includes('magiques') && this.gameState.hasTroopType(troop, 'Magique')) {
                    await this.sleep(150);
                    this.showBonusAnimation(unitElement, '+50%', 'damage', currentDamage);
                    this.updateUnitStat(unitElement, 'damage', currentDamage);
                }
                
                // Effet spécial de Quilegan
                if (mechanic.includes("Bloque les relances, les bonus, les synergies et les dégâts des unités tant qu'aucun bonus n'est vendu")) {
                    if (!this.gameState.bossManager.isBossMalusDisabled()) {
                        // Appliquer le malus de Quilegan : mettre les dégâts à 0
                        currentDamage = 0;
                        currentMultiplier = 0;
                        this.showMalusAnimation(unitElement, 'BLOQUÉ', 'damage', currentDamage);
                        this.updateUnitStat(unitElement, 'damage', currentDamage);
                        this.updateUnitStat(unitElement, 'multiplier', currentMultiplier);
                    } else {
                        this.showBonusAnimation(unitElement, 'MALUS DÉSACTIVÉ', 'damage');
                    }
                }
            }

            // Mise à jour des totaux pour CE round
            cumulativeDamage += currentDamage;
            cumulativeMultiplier += currentMultiplier;

            // Calcul de la progression réelle (pour la barre)
            const progressionCourante = (cumulativeDamage * cumulativeMultiplier) + previousDamage;
            const targetDamage = this.gameState.currentCombat.targetDamage;
            const percentage = Math.min((progressionCourante / targetDamage) * 100, 100);

            // Mise à jour de la barre de progression
            const mainCounter = document.querySelector('.main-counter');
            if (mainCounter) {
                mainCounter.style.setProperty('--progress-width', `${percentage}%`);
                if (percentage > 100) {
                    mainCounter.classList.add('over-100');
                } else {
                    mainCounter.classList.remove('over-100');
                }
            }

            // Mise à jour des compteurs intermédiaires
            if (damageCounter) damageCounter.textContent = cumulativeDamage;
            if (multiplierCounter) multiplierCounter.textContent = cumulativeMultiplier;
            const damageText = 'dégâts';
            if (finalResult) finalResult.textContent = `= ${cumulativeDamage * cumulativeMultiplier} ${damageText}`;

            await this.sleep(500);
        }

        // Animation finale : afficher le résultat correct avec les valeurs calculées pendant l'animation
        await this.sleep(300);
        const finalCalculatedDamage = cumulativeDamage * cumulativeMultiplier;
        const damageText = 'dégâts';
        if (finalResult) finalResult.textContent = `= ${finalCalculatedDamage} ${damageText}`;

        // Mettre à jour les dégâts totaux avec les valeurs calculées pendant l'animation
        this.gameState.currentCombat.totalDamage = previousDamage + finalCalculatedDamage;

        // Mise à jour finale de la barre de progression avec le résultat calculé pendant l'animation
        const mainCounter = document.querySelector('.main-counter');
        if (mainCounter) {
            const targetDamage = this.gameState.currentCombat.targetDamage;
            const totalDamageWithPrevious = previousDamage + finalCalculatedDamage;
            const percentage = Math.min((totalDamageWithPrevious / targetDamage) * 100, 100);
            mainCounter.style.setProperty('--progress-width', `${percentage}%`);
            if (percentage > 100) {
                mainCounter.classList.add('over-100');
            } else {
                mainCounter.classList.remove('over-100');
            }
        }
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
        
        // Ne pas masquer les informations de boss ici - elles seront masquées lors du changement de combat
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
     * Mettre à jour les stats d'une unité dans l'animation
     * @param {HTMLElement} unitElement - L'élément de l'unité
     * @param {string} type - Le type de stat ('damage' ou 'multiplier')
     * @param {number} newValue - La nouvelle valeur
     */
    updateUnitStat(unitElement, type, newValue) {
        // Récupérer l'ID de l'unité depuis l'élément
        const troopId = unitElement.id.replace('unit-', '');
        
        // Sélectionner les éléments par ID spécifique
        const damageElement = document.getElementById(`unit-${troopId}-damage`);
        const multiplierElement = document.getElementById(`unit-${troopId}-multiplier`);
        
        let targetElement = null;
        if (type === 'damage' && damageElement) {
            targetElement = damageElement;
        } else if (type === 'multiplier' && multiplierElement) {
            targetElement = multiplierElement;
        }
        
        // Si les éléments ne sont pas trouvés par ID, essayer de les chercher dans le conteneur de l'unité
        if (!targetElement) {
            const statsContainer = unitElement.querySelector('.unit-stats-animated');
            if (statsContainer) {
                if (type === 'damage') {
                    targetElement = statsContainer.querySelector('.unit-stat-value');
                } else if (type === 'multiplier') {
                    const statItems = statsContainer.querySelectorAll('.unit-stat-value');
                    if (statItems.length > 1) {
                        targetElement = statItems[1]; // Le deuxième élément est le multiplicateur
                    }
                }
            }
        }
        
        if (targetElement) {
            targetElement.textContent = newValue;
        }
        
        // Mettre à jour aussi la version mobile
        const mobileDamageElement = document.getElementById(`unit-${troopId}-damage-mobile`);
        const mobileMultiplierElement = document.getElementById(`unit-${troopId}-multiplier-mobile`);
        
        if (type === 'damage' && mobileDamageElement) {
            mobileDamageElement.textContent = newValue;
        } else if (type === 'multiplier' && mobileMultiplierElement) {
            mobileMultiplierElement.textContent = newValue;
        }
    }

    /**
     * Afficher une animation de bonus sur une unité
     * @param {HTMLElement} unitElement - L'élément de l'unité
     * @param {string} bonusText - Le texte du bonus
     * @param {string} type - Le type de bonus ('damage' ou 'multiplier')
     * @param {number} newValue - La nouvelle valeur à afficher (optionnel)
     */
    showBonusAnimation(unitElement, bonusText, type, newValue = null) {
        if (!unitElement || !unitElement.parentNode) return;
        
        // Récupérer l'ID de l'unité depuis l'élément
        const troopId = unitElement.id.replace('unit-', '');
        
        // Sélectionner les éléments par ID spécifique
        const damageElement = document.getElementById(`unit-${troopId}-damage`);
        const multiplierElement = document.getElementById(`unit-${troopId}-multiplier`);
        
        let targetElement = null;
        if (type === 'damage' && damageElement) {
            targetElement = damageElement;
        } else if (type === 'multiplier' && multiplierElement) {
            targetElement = multiplierElement;
        }
        
        // Si les éléments ne sont pas trouvés par ID, essayer de les chercher dans le conteneur de l'unité
        if (!targetElement) {
            const statsContainer = unitElement.querySelector('.unit-stats-animated');
            if (statsContainer) {
                if (type === 'damage') {
                    targetElement = statsContainer.querySelector('.unit-stat-value');
                } else if (type === 'multiplier') {
                    const statItems = statsContainer.querySelectorAll('.unit-stat-value');
                    if (statItems.length > 1) {
                        targetElement = statItems[1]; // Le deuxième élément est le multiplicateur
                    }
                }
            }
        }
        
        if (targetElement) {
            // Mettre à jour la valeur si fournie
            if (newValue !== null) {
                this.updateUnitStat(unitElement, type, newValue);
            }
            
            // Définir les couleurs selon le type
            let backgroundColor, borderColor, shadowColor;
            if (type === 'damage') {
                backgroundColor = 'linear-gradient(135deg, #007bff, #0056b3)';
                borderColor = '#007bff';
                shadowColor = 'rgba(0, 123, 255, 0.4)';
            } else { // multiplier
                backgroundColor = 'linear-gradient(135deg, #dc3545, #c82333)';
                borderColor = '#dc3545';
                shadowColor = 'rgba(220, 53, 69, 0.4)';
            }
            
            const bonusElement = document.createElement('div');
            bonusElement.className = `bonus-animation ${type}`;
            bonusElement.textContent = bonusText;
            
            // Calculer la position par rapport à l'élément cible
            const targetRect = targetElement.getBoundingClientRect();
            const unitRect = unitElement.getBoundingClientRect();
            
            const relativeLeft = targetRect.left - unitRect.left + (targetRect.width / 2);
            const relativeTop = targetRect.top - unitRect.top - 35;
            
            bonusElement.style.cssText = `
                position: absolute;
                top: ${relativeTop}px;
                left: ${relativeLeft}px;
                transform: translateX(-50%);
                background: ${backgroundColor};
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 3px 10px ${shadowColor};
                border: 2px solid ${borderColor};
                white-space: nowrap;
                pointer-events: none;
                animation: bonusFloat 1s ease-out;
            `;
            
            // Ajouter l'animation CSS
            if (!document.getElementById('bonus-animation-style')) {
                const style = document.createElement('style');
                style.id = 'bonus-animation-style';
                style.textContent = `
                    @keyframes bonusFloat {
                        0% { opacity: 0; transform: translateX(-50%) translateY(0px); }
                        20% { opacity: 1; transform: translateX(-50%) translateY(-8px); }
                        80% { opacity: 1; transform: translateX(-50%) translateY(-15px); }
                        100% { opacity: 0; transform: translateX(-50%) translateY(-25px); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Ajouter la bulle au conteneur de l'unité
            unitElement.style.position = 'relative';
            unitElement.appendChild(bonusElement);
            
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
     * @param {number} newValue - La nouvelle valeur à afficher (optionnel)
     */
    showMalusAnimation(unitElement, malusText, type, newValue = null) {
        if (!unitElement || !unitElement.parentNode) return;
        
        // Récupérer l'ID de l'unité depuis l'élément
        const troopId = unitElement.id.replace('unit-', '');
        
        // Sélectionner les éléments par ID spécifique
        const damageElement = document.getElementById(`unit-${troopId}-damage`);
        const multiplierElement = document.getElementById(`unit-${troopId}-multiplier`);
        
        let targetElement = null;
        if (type === 'damage' && damageElement) {
            targetElement = damageElement;
        } else if (type === 'multiplier' && multiplierElement) {
            targetElement = multiplierElement;
        }
        
        // Si les éléments ne sont pas trouvés par ID, essayer de les chercher dans le conteneur de l'unité
        if (!targetElement) {
            const statsContainer = unitElement.querySelector('.unit-stats-animated');
            if (statsContainer) {
                if (type === 'damage') {
                    targetElement = statsContainer.querySelector('.unit-stat-value');
                } else if (type === 'multiplier') {
                    const statItems = statsContainer.querySelectorAll('.unit-stat-value');
                    if (statItems.length > 1) {
                        targetElement = statItems[1]; // Le deuxième élément est le multiplicateur
                    }
                }
            }
        }
        
        if (targetElement) {
            // Mettre à jour la valeur si fournie
            if (newValue !== null) {
                this.updateUnitStat(unitElement, type, newValue);
            }
            
            // Calculer la position par rapport à l'élément cible
            const targetRect = targetElement.getBoundingClientRect();
            const unitRect = unitElement.getBoundingClientRect();
            
            const relativeLeft = targetRect.left - unitRect.left + (targetRect.width / 2);
            const relativeTop = targetRect.top - unitRect.top - 35;
            
            const malusElement = document.createElement('div');
            malusElement.className = `malus-animation ${type}`;
            malusElement.textContent = malusText;
            malusElement.style.cssText = `
                position: absolute;
                top: ${relativeTop}px;
                left: ${relativeLeft}px;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #fd7e14, #e55a00);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 3px 10px rgba(253, 126, 20, 0.4);
                border: 2px solid #fd7e14;
                white-space: nowrap;
                pointer-events: none;
                animation: malusFloat 1s ease-out;
            `;
            
            // Ajouter l'animation CSS
            if (!document.getElementById('malus-animation-style')) {
                const style = document.createElement('style');
                style.id = 'malus-animation-style';
                style.textContent = `
                    @keyframes malusFloat {
                        0% { opacity: 0; transform: translateX(-50%) translateY(0px); }
                        20% { opacity: 1; transform: translateX(-50%) translateY(-8px); }
                        80% { opacity: 1; transform: translateX(-50%) translateY(-15px); }
                        100% { opacity: 0; transform: translateX(-50%) translateY(-25px); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Ajouter la bulle au conteneur de l'unité
            unitElement.style.position = 'relative';
            unitElement.appendChild(malusElement);
            
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
        

    }

    /**
     * Mettre à jour la barre de progression après chaque unité
     * @param {number} unitDamage - Les dégâts de l'unité
     * @param {number} unitMultiplier - Le multiplicateur de l'unité
     * @param {number} progressiveTotal - Le total progressif actuel
     */
    updateProgressBarAfterUnit(unitDamage, unitMultiplier, progressiveTotal) {
        // Calculer la contribution de cette unité au total
        const unitContribution = unitDamage * unitMultiplier;
        
        // Calculer le total actuel avec cette unité
        const currentTotal = progressiveTotal + unitContribution;
        
        // Mettre à jour la barre de progression
        const mainCounter = document.querySelector('.main-counter');
        if (mainCounter) {
            const targetDamage = this.gameState.currentCombat.targetDamage;
            const percentage = Math.min((currentTotal / targetDamage) * 100, 100);
            
            // Mettre à jour la largeur du background
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
     * Obtenir le délai d'animation ajusté selon la vitesse
     * @param {number} baseDelay - Le délai de base
     * @returns {number} - Le délai ajusté
     */
    getAnimationDelay(baseDelay) {
        return baseDelay / this.animationSpeed;
    }

    // === ANIMATIONS DE TRANSFORMATION ===

    /**
     * Jouer l'animation de transformation d'unité
     * @param {string} fromUnitName - Nom de l'unité de départ
     * @param {string} toUnitName - Nom de l'unité de destination
     * @param {GameState} gameState - L'état du jeu
     */
    playTransformAnimation(fromUnitName, toUnitName, gameState) {
        // Créer l'élément d'animation
        const animationElement = document.createElement('div');
        animationElement.className = 'transform-animation';
        animationElement.innerHTML = `
            <div class="transform-content">
                <div class="transform-from">${this.getUnitIcon(fromUnitName, gameState)} ${fromUnitName}</div>
                <div class="transform-arrow">➜</div>
                <div class="transform-to">${this.getUnitIcon(toUnitName, gameState)} ${toUnitName}</div>
            </div>
        `;
        
        document.body.appendChild(animationElement);
        
        // Animation CSS
        setTimeout(() => {
            animationElement.classList.add('show');
        }, 100);
        
        // Supprimer après l'animation
        setTimeout(() => {
            animationElement.remove();
        }, 2000);
    }

    /**
     * Obtenir l'icône d'une unité par son nom
     * @param {string} unitName - Nom de l'unité
     * @param {GameState} gameState - L'état du jeu
     * @returns {string} - L'icône de l'unité
     */
    getUnitIcon(unitName, gameState) {
        const allUnits = [...gameState.getBaseUnits(), ...gameState.getAllAvailableTroops()];
        const unit = allUnits.find(u => u.name === unitName);
        return unit ? unit.icon : '❓';
    }

    // === ANIMATIONS DE DUPLICATION ===

    /**
     * Jouer l'animation de duplication d'unité
     * @param {string} unitName - Nom de l'unité dupliquée
     * @param {GameState} gameState - L'état du jeu
     */
    playDuplicateAnimation(unitName, gameState) {
        // Créer l'élément d'animation
        const animationElement = document.createElement('div');
        animationElement.className = 'duplicate-animation';
        animationElement.innerHTML = `
            <div class="duplicate-content">
                <div class="duplicate-icon">🪞</div>
                <div class="duplicate-text">${this.getUnitIcon(unitName, gameState)} ${unitName}</div>
                <div class="duplicate-effect">+1</div>
            </div>
        `;
        
        document.body.appendChild(animationElement);
        
        // Animation CSS
        setTimeout(() => {
            animationElement.classList.add('show');
        }, 100);
        
        // Supprimer après l'animation
        setTimeout(() => {
            animationElement.remove();
        }, 2000);
    }
} 