// Classe GameState en ES6
export class GameState {
    constructor() {
        this.rank = 'F-';
        this.rankProgress = 0;
        this.rankTarget = 100;
        this.gold = 100;
        this.availableTroops = [];
        this.selectedTroops = [];
        this.combatTroops = []; // Troupes tirées pour le combat
        this.usedTroopsThisRank = []; // Troupes utilisées dans ce rang
        this.combatHistory = [];
        this.isFirstTime = true;
        this.unlockedBonuses = []; // Bonus débloqués via le magasin
        
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
        
        // Initialiser le magasin
        this.currentShopItems = null;
        
        // Progression des rangs
        this.RANKS = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];
        
        // Rangs qui déclenchent des combats de boss
        this.BOSS_RANKS = ['F+', 'E+', 'D+', 'C+', 'B+', 'A+', 'S'];
        
        // Définition des unités de base
        this.BASE_UNITS = [
            { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, icon: '⚔️' },
            { name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3, icon: '🏹' },
            { name: 'Magicien Bleu', type: ['Distance', 'Magique'], damage: 3, multiplier: 4, icon: '🔵' },
            { name: 'Lancier', type: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, icon: '🔱' }
        ];
        


        // Boss disponibles
        this.BOSSES = [
            { name: 'Golem de Pierre', mechanic: 'Les unités corps à corps font -50% de dégâts', targetDamage: 4000, icon: '🗿' },
            { name: 'Dragon de Glace', mechanic: 'Les unités distance font -30% de dégâts', targetDamage: 5000, icon: '❄️' },
            { name: 'Liche', mechanic: 'Les unités corps à corps font -2 dégâts', targetDamage: 4500, icon: '💀' },
            { name: 'Titan', mechanic: 'Les multiplicateurs sont réduits de moitié', targetDamage: 6000, icon: '🏔️' },
            { name: 'Démon', mechanic: 'Les unités magiques font +50% de dégâts', targetDamage: 5500, icon: '👹' }
        ];
        
        // Tirer les premières troupes pour le combat
        this.drawCombatTroops();
    }

    addProgress(amount) {
        this.rankProgress += amount;
        
        if (this.rankProgress >= this.rankTarget) {
            this.rankProgress = 0;
            this.promoteRank();
        }
        
        this.updateUI();
    }

    promoteRank() {
        const currentIndex = this.RANKS.indexOf(this.rank);
        if (currentIndex < this.RANKS.length - 1) {
            this.rank = this.RANKS[currentIndex + 1];
            this.rankTarget = this.calculateRankTarget();
            
            this.gold += 50;
            
            // this.showNotification(`Promotion ! Nouveau rang: ${this.rank}`, 'success');
        }
    }

    // Gagner un rang après chaque combat
    gainRank() {
        const currentIndex = this.RANKS.indexOf(this.rank);
        if (currentIndex < this.RANKS.length - 1) {
            const oldRank = this.rank;
            this.rank = this.RANKS[currentIndex + 1];
            this.gold += 25;
            
            // Réinitialiser les troupes utilisées pour le nouveau rang
            this.usedTroopsThisRank = [];
            
            // Tirer de nouvelles troupes pour le nouveau rang
            this.drawCombatTroops();
            
            console.log(`Rang changé: ${oldRank} → ${this.rank}`);
            // this.showNotification(`Rang gagné ! Nouveau rang: ${this.rank}`, 'success');
        }
    }

    // Démarrer un nouveau combat
    startNewCombat() {
        const isBossFight = this.BOSS_RANKS.includes(this.rank);
        console.log(`Rang actuel: ${this.rank}, Boss ranks: ${this.BOSS_RANKS}, Is boss fight: ${isBossFight}`);
        
        if (isBossFight) {
            // Combat de boss
            const randomBoss = this.BOSSES[Math.floor(Math.random() * this.BOSSES.length)];
            this.currentCombat = {
                targetDamage: randomBoss.targetDamage,
                totalDamage: 0,
                round: 0,
                maxRounds: 5,
                isActive: true,
                isBossFight: true,
                bossName: randomBoss.name,
                bossMechanic: randomBoss.mechanic
            };
            
            console.log(`Combat de boss démarré: ${randomBoss.name}`);
            this.showNotification(`BOSS: ${randomBoss.name} ! ${randomBoss.mechanic}`, 'error');
        } else {
            // Combat normal
            this.currentCombat = {
                targetDamage: 2000 + (this.RANKS.indexOf(this.rank) * 500), // Augmenté x10 pour le nouveau système
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
        
        // Toujours tirer de nouvelles troupes pour un nouveau combat
        this.drawCombatTroops();
        
        // Mettre à jour la modal de combat
        this.updateCombatModal();
        
        this.updateUI();
        
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
                setTimeout(() => {
                    this.endCombat(true);
                }, 1000);
            } else if (this.currentCombat.round >= this.currentCombat.maxRounds) {
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
        
        // Appliquer les mécaniques de boss si nécessaire
        if (this.currentCombat.isBossFight) {
            // Pour les boss, on applique les mécaniques sur le total final
            // On peut ajuster le total en fonction des mécaniques
            // Pour l'instant, on garde le calcul simple
        }
        
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
        progressFill.style.width = '0%';
        
        // Variables pour le compteur principal
        let totalDamage = 0;
        let totalMultiplier = 0;
        
        // Variables pour les bonus d'équipement et synergies (ne s'accumulent pas dans le compteur)
        let equipmentDamage = 0;
        let equipmentMultiplier = 0;
        let synergyDamage = 0;
        let synergyMultiplier = 0;
        
        // Récupérer les bonus d'équipement pour les appliquer immédiatement
        const equipmentBonuses = this.calculateEquipmentBonuses();
        console.log('Bonus d\'équipement calculés:', equipmentBonuses); // Debug
        console.log('Bonus débloqués:', this.unlockedBonuses); // Debug
        
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
                
                bonusElement.innerHTML = `
                    <div class="bonus-name">${bonus.name}</div>
                    <div class="bonus-effect">${bonusText}</div>
                `;
                
                bonusesContent.appendChild(bonusElement);
                
                await this.sleep(200);
                bonusElement.classList.add('active');
                await this.sleep(300);
            }
        } else {
            const noBonusElement = document.createElement('div');
            noBonusElement.className = 'bonus-item active';
            noBonusElement.innerHTML = '<div class="bonus-name">Aucun bonus d\'équipement</div>';
            bonusesContent.appendChild(noBonusElement);
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
                
                synergiesContent.appendChild(synergyElement);
                
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
        }
        
        await this.sleep(500);
        
        // PHASE 3: Animer les unités une par une avec accumulation progressive
        for (let i = 0; i < troopsUsed.length; i++) {
            const troop = troopsUsed[i];
            
            // Calculer les dégâts de base de cette unité
            let unitDamage = troop.damage;
            let unitMultiplier = troop.multiplier;
            
            // Appliquer les bonus d'équipement sur cette unité
            equipmentBonuses.forEach(bonus => {
                if (bonus.target === 'all' || this.hasTroopType(troop, bonus.target)) {
                    if (bonus.damage) unitDamage += bonus.damage;
                    if (bonus.multiplier) unitMultiplier += bonus.multiplier;
                }
            });
            
            // Appliquer les synergies sur cette unité
            synergies.forEach(synergy => {
                if (synergy.bonus.target === 'all' || this.hasTroopType(troop, synergy.bonus.target)) {
                    if (synergy.bonus.damage) unitDamage += synergy.bonus.damage;
                    if (synergy.bonus.multiplier) unitMultiplier += synergy.bonus.multiplier;
                }
            });
            
            // Créer l'élément d'unité
            const unitElement = document.createElement('div');
            unitElement.className = 'unit-slide';
            
            const typeDisplay = Array.isArray(troop.type) ? troop.type.join(' / ') : troop.type;
            
            unitElement.innerHTML = `
                <div class="unit-slide-info">
                    <div class="unit-slide-icon">${troop.icon}</div>
                    <div class="unit-slide-details">
                        <div class="unit-slide-name">${troop.name}</div>
                        <div class="unit-slide-types">${typeDisplay}</div>
                    </div>
                </div>
                <div class="unit-slide-stats">
                    <div class="unit-slide-damage">+${unitDamage}</div>
                    <div class="unit-slide-multiplier">×${unitMultiplier}</div>
                </div>
            `;
            
            unitsContent.appendChild(unitElement);
            
            // Animer l'unité
            await this.sleep(300);
            unitElement.classList.add('active');
            

            
            // Accumuler les dégâts et multiplicateurs
            totalDamage += unitDamage;
            totalMultiplier += unitMultiplier;
            
            // Mettre à jour le compteur principal (seulement quand les troupes sont ajoutées)
            damageCounter.textContent = totalDamage;
            multiplierCounter.textContent = totalMultiplier;
            finalResult.textContent = `= ${Math.round(totalDamage * totalMultiplier)} dégâts`;
            
            // Mettre à jour la barre de progression
            const progress = (i + 1) / troopsUsed.length * 100;
            progressFill.style.width = `${progress}%`;
            
            await this.sleep(500);
        }
        
        // PHASE 4: Appliquer les mécaniques de boss si applicable
        if (this.currentCombat.isBossFight) {
            await this.sleep(500);
            
            const bossElement = document.createElement('div');
            bossElement.className = 'bonus-item';
            bossElement.innerHTML = `
                <div class="bonus-name">Mécanique de boss</div>
                <div class="bonus-effect">${this.currentCombat.bossMechanic}</div>
            `;
            bonusesContent.appendChild(bossElement);
            
            await this.sleep(200);
            bossElement.classList.add('active');
            
            // Recalculer le total final avec les mécaniques de boss
            let finalDamage = totalDamage * totalMultiplier;
            
            // Appliquer les mécaniques de boss sur le total final
            for (const troop of troopsUsed) {
                const troopDamage = troop.damage * troop.multiplier;
                const bossModifiedDamage = this.applyBossMechanics(troopDamage, troop);
                finalDamage += (bossModifiedDamage - troopDamage);
            }
            
            finalResult.textContent = `= ${Math.round(finalDamage)} dégâts`;
            
            await this.sleep(400);
        }
        
        // Animation finale
        await this.sleep(1000);
        
        // Animation de victoire si le combat est gagné
        if (this.currentCombat.totalDamage >= this.currentCombat.targetDamage) {
            this.playVictoryAnimation();
        }
        
        // L'animation reste affichée jusqu'à ce que l'utilisateur la ferme manuellement
        // Pas de fermeture automatique
    }
    
    // Animation de victoire
    playVictoryAnimation() {
        const victoryElement = document.getElementById('victory-animation');
        if (!victoryElement) return;
        
        // S'assurer que l'animation est masquée au début
        victoryElement.style.display = 'block';
        victoryElement.style.opacity = '0';
        
        // Forcer un reflow pour s'assurer que l'animation se déclenche
        victoryElement.offsetHeight;
        
        // Déclencher l'animation
        victoryElement.style.opacity = '1';
        
        // Ajouter des effets de particules
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.position = 'fixed';
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.top = Math.random() * window.innerHeight + 'px';
                particle.style.fontSize = '2rem';
                particle.style.color = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71'][Math.floor(Math.random() * 4)];
                particle.style.zIndex = '10002';
                particle.style.pointerEvents = 'none';
                particle.style.animation = 'victoryParticle 1.5s ease-out forwards';
                particle.textContent = ['⭐', '🎉', '🏆', '💎', '🔥'][Math.floor(Math.random() * 5)];
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        document.body.removeChild(particle);
                    }
                }, 1500);
            }, i * 100);
        }
        
        setTimeout(() => {
            victoryElement.style.display = 'none';
            victoryElement.style.opacity = '0';
        }, 2000);
    }
    
    // Fonction utilitaire pour les délais
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
            if (mechanic.includes('-2')) {
                return Math.max(0, damage - 2);
            }
        }
        
        if (mechanic.includes('-20%')) {
            return Math.floor(damage * 0.8);
        }
        
        if (mechanic.includes('multiplicateurs')) {
            return Math.floor(damage * 0.5);
        }
        
        if (mechanic.includes('magiques') && troop.name.includes('Magicien')) {
            return Math.floor(damage * 1.5);
        }
        
        return damage;
    }

    // Terminer le combat
    endCombat(victory) {
        if (!this.currentCombat.isActive) return;

        this.currentCombat.isActive = false;
        this.currentCombat.round = 0;

        if (victory) {
            // Récompense de base augmentée
            const baseReward = this.currentCombat.isBossFight ? 75 : 50;
            this.addGold(baseReward);
            
            // Bonus de richesse
            const wealthBonus = this.calculateWealthBonus();
            this.addGold(wealthBonus);
            
            // Notification des récompenses
            // this.showNotification(`Victoire ! +${baseReward} or +${wealthBonus} or (bonus richesse)`, 'success');
            
            // Monter de rang après victoire
            this.gainRank();
            
            // Appliquer les bonus de base après combat
            this.applyCombatBonuses();
        } else {
            this.showNotification('Défaite !', 'error');
        }

        // Vider les troupes après combat
        this.combatTroops = [];
        this.selectedTroops = [];
        this.usedTroopsThisRank = [];

        this.updateUI();
        
        // Tirer de nouvelles troupes pour le prochain combat
        this.drawCombatTroops();
        
        // Fermer la modal de combat après un délai
        setTimeout(() => {
            const combatModal = document.getElementById('combat-modal');
            if (combatModal) {
                combatModal.style.display = 'none';
            }
        }, 2000);
    }

    // Retirer aléatoirement des troupes du pool de combat
    removeRandomTroopsFromCombat() {
        const troopsToRemove = Math.min(2, this.combatTroops.length); // Retirer 2 troupes ou moins
        
        for (let i = 0; i < troopsToRemove; i++) {
            if (this.combatTroops.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.combatTroops.length);
                this.combatTroops.splice(randomIndex, 1);
            }
        }
    }

    calculateRankTarget() {
        const rankIndex = this.RANKS.indexOf(this.rank);
        return 100 + (rankIndex * 25);
    }

    // Gestion des ressources
    addGold(amount) {
        this.gold += amount;
        this.updateUI();
    }

    // Calculer le bonus d'or basé sur la richesse actuelle
    calculateWealthBonus() {
        const currentGold = this.gold;
        let bonus = 0;
        
        if (currentGold >= 0 && currentGold <= 50) {
            bonus = 5;
        } else if (currentGold >= 51 && currentGold <= 100) {
            bonus = 10;
        } else if (currentGold >= 101 && currentGold <= 150) {
            bonus = 15;
        } else if (currentGold >= 151 && currentGold <= 200) {
            bonus = 20;
        } else if (currentGold >= 201 && currentGold <= 300) {
            bonus = 25;
        } else if (currentGold >= 301 && currentGold <= 500) {
            bonus = 30;
        } else if (currentGold >= 501 && currentGold <= 750) {
            bonus = 35;
        } else if (currentGold >= 751 && currentGold <= 1000) {
            bonus = 40;
        } else {
            bonus = 50; // Au-delà de 1000 or
        }
        
        return bonus;
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    // Gestion des troupes
    addTroop(troop) {
        this.availableTroops.push(troop);
        this.updateTroopsUI();
    }

    // Tirer 7 troupes aléatoirement pour le combat
    drawCombatTroops() {
        this.combatTroops = [];
        this.selectedTroops = [];
        
        // Créer un pool de troupes avec les unités de base (5 de chaque)
        const troopPool = [];
        this.BASE_UNITS.forEach(unit => {
            for (let i = 0; i < 5; i++) {
                troopPool.push({...unit, id: `${unit.name}_${i}`});
            }
        });
        
        // Tirer 7 troupes aléatoirement
        for (let i = 0; i < 7 && troopPool.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * troopPool.length);
            this.combatTroops.push(troopPool.splice(randomIndex, 1)[0]);
        }
        
        this.updateTroopsUI();
    }

    // Maintenir 7 troupes disponibles en tirant de nouvelles troupes
    maintainCombatTroops() {
        // Créer un pool complet de troupes (5 de chaque)
        const fullTroopPool = [];
        this.BASE_UNITS.forEach(unit => {
            for (let i = 0; i < 5; i++) {
                fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
            }
        });
        
        // Retirer les troupes déjà utilisées dans ce rang
        const availableTroops = fullTroopPool.filter(troop => 
            !this.usedTroopsThisRank.includes(troop.id)
        );
        
        // Retirer les troupes déjà dans le pool de combat
        const remainingTroops = availableTroops.filter(troop => 
            !this.combatTroops.some(combatTroop => combatTroop.id === troop.id)
        );
        
        // Ajouter des troupes jusqu'à avoir 7 disponibles
        while (this.combatTroops.length < 7 && remainingTroops.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingTroops.length);
            const newTroop = remainingTroops.splice(randomIndex, 1)[0];
            this.combatTroops.push(newTroop);
        }
    }

    // Sélectionner une troupe pour le combat (max 5)
    selectTroopForCombat(troopIndex) {
        if (this.selectedTroops.length >= 5) {
            this.showNotification('Vous ne pouvez sélectionner que 5 troupes maximum !', 'error');
            return;
        }
        
        if (troopIndex >= 0 && troopIndex < this.combatTroops.length) {
            const troop = this.combatTroops.splice(troopIndex, 1)[0];
            this.selectedTroops.push(troop);
            this.updateTroopsUI();
            this.updateSynergies();
        }
    }

    // Désélectionner une troupe du combat
    deselectTroopFromCombat(troopIndex) {
        if (troopIndex >= 0 && troopIndex < this.selectedTroops.length) {
            const troop = this.selectedTroops.splice(troopIndex, 1)[0];
            this.combatTroops.push(troop);
            this.updateTroopsUI();
            this.updateSynergies();
        }
    }

    // Retirer les troupes utilisées de la sélection ET du pool de combat
    removeUsedTroopsFromCombat(troopsUsed) {
        troopsUsed.forEach(usedTroop => {
            // Retirer de la sélection
            const selectedIndex = this.selectedTroops.findIndex(troop => troop.id === usedTroop.id);
            if (selectedIndex !== -1) {
                this.selectedTroops.splice(selectedIndex, 1);
            }
            
            // Retirer du pool de combat
            const combatIndex = this.combatTroops.findIndex(troop => troop.id === usedTroop.id);
            if (combatIndex !== -1) {
                this.combatTroops.splice(combatIndex, 1);
            }
        });
        
        // Maintenir 7 troupes disponibles en ajoutant de nouvelles troupes
        this.maintainCombatTroops();
        
        this.updateTroopsUI();
        this.updateSynergies();
    }

    // Calcul des synergies (toujours actives)
    calculateSynergies(troops = null) {
        const synergies = [];
        
        // Utiliser les troupes passées en paramètre ou les troupes sélectionnées
        const troopsToCheck = troops || this.selectedTroops;
        
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

        // Synergies de base (augmentées)
        if (typeCounts['Corps à corps'] >= 3) {
            synergies.push({
                name: 'Formation Corps à Corps',
                description: '+2 multiplicateur pour toutes les unités corps à corps',
                bonus: { multiplier: 2, target: 'Corps à corps' }
            });
        }
        
        if (typeCounts['Distance'] >= 3) {
            synergies.push({
                name: 'Formation Distance',
                description: '+3 multiplicateur pour toutes les unités distance',
                bonus: { multiplier: 3, target: 'Distance' }
            });
        }
        
        if (typeCounts['Magique'] >= 3) {
            synergies.push({
                name: 'Formation Magique',
                description: '+4 multiplicateur pour toutes les unités magiques',
                bonus: { multiplier: 4, target: 'Magique' }
            });
        }

        // Synergies avancées (nouvelles et plus puissantes)
        if (typeCounts['Corps à corps'] >= 5) {
            synergies.push({
                name: 'Horde Corps à Corps',
                description: '+5 dégâts et +3 multiplicateur pour toutes les unités corps à corps',
                bonus: { damage: 5, multiplier: 3, target: 'Corps à corps' }
            });
        }
        
        if (typeCounts['Distance'] >= 5) {
            synergies.push({
                name: 'Volée de Flèches',
                description: '+8 dégâts et +4 multiplicateur pour toutes les unités distance',
                bonus: { damage: 8, multiplier: 4, target: 'Distance' }
            });
        }
        
        if (typeCounts['Magique'] >= 5) {
            synergies.push({
                name: 'Tempête Magique',
                description: '+10 dégâts et +5 multiplicateur pour toutes les unités magiques',
                bonus: { damage: 10, multiplier: 5, target: 'Magique' }
            });
        }

        // Synergies mixtes (nouvelles)
        if (typeCounts['Corps à corps'] >= 3 && typeCounts['Distance'] >= 3) {
            synergies.push({
                name: 'Tactique Mixte',
                description: '+3 dégâts pour toutes les unités',
                bonus: { damage: 3, target: 'all' }
            });
        }
        
        if (typeCounts['Physique'] >= 6) {
            synergies.push({
                name: 'Force Physique',
                description: '+4 dégâts pour toutes les unités physiques',
                bonus: { damage: 4, target: 'Physique' }
            });
        }

        return synergies;
    }

    // Vérifier si une troupe a un type spécifique (gère les types multiples)
    hasTroopType(troop, targetType) {
        if (Array.isArray(troop.type)) {
            return troop.type.includes(targetType);
        }
        return troop.type === targetType;
    }

    // Calculer les bonus d'équipement
    calculateEquipmentBonuses() {
        const bonuses = [];
        const bonusDescriptions = this.getBonusDescriptions();
        
        // Compter les occurrences de chaque bonus
        const bonusCounts = {};
        this.unlockedBonuses.forEach(bonusId => {
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
    applyCombatBonuses() {
        // Compter les occurrences de chaque bonus
        const bonusCounts = {};
        this.unlockedBonuses.forEach(bonusId => {
            bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
        });
        
        // Bonus d'or uniquement
        if (bonusCounts['gold_bonus']) {
            const goldBonus = 25 * bonusCounts['gold_bonus'];
            this.addGold(goldBonus);
            // this.showNotification(`+${goldBonus} or (bonus)`, 'success');
        }
        
        // Les bonus de dégâts (corps_a_corps_bonus, distance_bonus, magique_bonus) 
        // sont maintenant traités comme des bonus d'équipement dans calculateEquipmentBonuses()
    }

    // Débloquer un bonus
    unlockBonus(bonusId) {
        // Vérifier que le bonus existe dans les descriptions
        const bonusDescriptions = this.getBonusDescriptions();
        if (!bonusDescriptions[bonusId]) {
            console.error(`Tentative de débloquer un bonus invalide: ${bonusId}`);
            return false;
        }
        
        if (!this.unlockedBonuses.includes(bonusId)) {
            this.unlockedBonuses.push(bonusId);
            // this.showNotification('Nouveau bonus débloqué !', 'success');
            
            // Mettre à jour l'interface immédiatement pour afficher le nouveau bonus
            this.updateActiveBonuses();
        }
        return true;
    }

    // Nettoyer les bonus invalides
    cleanInvalidBonuses() {
        const bonusDescriptions = this.getBonusDescriptions();
        const validBonuses = Object.keys(bonusDescriptions);
        
        // Filtrer les bonus invalides
        const invalidBonuses = this.unlockedBonuses.filter(bonusId => !validBonuses.includes(bonusId));
        
        if (invalidBonuses.length > 0) {
            console.warn('Bonus invalides détectés et supprimés:', invalidBonuses);
            this.unlockedBonuses = this.unlockedBonuses.filter(bonusId => validBonuses.includes(bonusId));
        }
    }

    // Mise à jour de l'interface
    updateUI() {
        const rankElement = document.getElementById('current-rank');
        const progressElement = document.getElementById('rank-progress');
        const goldElement = document.getElementById('gold-amount');
        // const reputationElement = document.getElementById('reputation-amount'); // Supprimé
        
        if (rankElement) rankElement.textContent = this.rank;
        if (progressElement) progressElement.textContent = `${this.rankProgress}/${this.rankTarget}`;
        if (goldElement) goldElement.textContent = this.gold;
        // if (reputationElement) reputationElement.textContent = this.reputation; // Supprimé

        // Nettoyer les bonus invalides avant de mettre à jour l'affichage
        this.cleanInvalidBonuses();

        // Mettre à jour les bonus actifs
        this.updateActiveBonuses();
        
        // Mettre à jour les synergies
        this.updateSynergies();
        
        // Mettre à jour les informations de combat
        this.updateCombatInfo();
        
        // Gérer l'affichage des sections
        this.updateSectionDisplay();

        // Mettre à jour le bouton de combat
        const combatBtn = document.getElementById('start-combat-btn');
        if (combatBtn) {
            if (this.currentCombat.isActive) {
                const bossText = this.currentCombat.isBossFight ? 'BOSS' : 'Combat';
                combatBtn.textContent = `Tour ${this.currentCombat.round + 1}/5 - Attaquer`;
                combatBtn.disabled = false; // Ne jamais bloquer le bouton
            } else {
                const isBossRank = this.BOSS_RANKS.includes(this.rank);
                combatBtn.textContent = isBossRank ? 'Commencer Combat de Boss' : 'Commencer Combat';
                combatBtn.disabled = false; // Ne jamais bloquer le bouton
            }
        }

        // Mettre à jour la jauge de dégâts pour les boss
        this.updateBossDamageGauge();

        // Mettre à jour l'affichage du combat si actif
        this.updateCombatProgressDisplay();
        
        // Mettre à jour les troupes
        this.updateTroopsUI();
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
                this.addCombatLog(`BOSS: ${this.currentCombat.bossName} !`, 'warning');
                this.addCombatLog(`Mécanique: ${this.currentCombat.bossMechanic}`, 'warning');
            } else {
                this.addCombatLog(`Combat contre ${this.getEnemyName()} !`, 'info');
            }
            this.addCombatLog(`Objectif: ${this.currentCombat.targetDamage} dégâts`, 'info');
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
        
        // NE PAS afficher la barre classique si c'est un combat de boss
        if (this.currentCombat.isBossFight) {
            if (combatProgressContainer) combatProgressContainer.remove();
            return;
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
        const availableContainer = document.getElementById('available-troops');
        const selectedContainer = document.getElementById('selected-troops');

        if (!availableContainer || !selectedContainer) {
            return;
        }

        availableContainer.innerHTML = '';
        selectedContainer.innerHTML = '';

        // Afficher les troupes tirées pour le combat
        this.combatTroops.forEach((troop, index) => {
            const troopCard = this.createTroopCard(troop, index, false);
            availableContainer.appendChild(troopCard);
        });

        // Afficher les troupes sélectionnées pour le combat
        this.selectedTroops.forEach((troop, index) => {
            const troopCard = this.createTroopCard(troop, index, true);
            selectedContainer.appendChild(troopCard);
        });

        // Mettre à jour les titres des sections
        const availableTitle = availableContainer.parentElement.querySelector('h4');
        const selectedTitle = selectedContainer.parentElement.querySelector('h4');
        
        if (availableTitle) {
            availableTitle.textContent = `Troupes Tirées (${this.combatTroops.length})`;
        }
        if (selectedTitle) {
            selectedTitle.textContent = `Troupes Sélectionnées (${this.selectedTroops.length}/5)`;
        }
    }

    createTroopCard(troop, index, isSelected) {
        const card = document.createElement('div');
        const isUsed = this.usedTroopsThisRank.includes(troop.id);
        
        card.className = `unit-card ${isSelected ? 'selected' : ''} ${isUsed ? 'used' : ''}`;
        
        // Afficher les types (gère les types multiples)
        const typeDisplay = Array.isArray(troop.type) ? troop.type.join(' / ') : troop.type;
        
        card.innerHTML = `
            <div class="unit-icon">${troop.icon}</div>
            <div class="unit-name">${troop.name}</div>
            <div class="unit-stats">${troop.damage} dmg ×${troop.multiplier}</div>
            <div class="unit-type">${typeDisplay}</div>
            ${isUsed ? '<div class="unit-used">Utilisée</div>' : ''}
        `;

        card.addEventListener('click', () => {
            if (isUsed) {
                this.showNotification('Cette troupe a déjà été utilisée dans ce rang !', 'error');
                return;
            }
            
            if (isSelected) {
                this.deselectTroopFromCombat(index);
            } else {
                this.selectTroopForCombat(index);
            }
        });

        return card;
    }

    updateSynergies() {
        const synergiesContainer = document.getElementById('synergies-display');
        if (!synergiesContainer) {
            console.warn('Container synergies-display non trouvé');
            return;
        }

        // Utiliser UNIQUEMENT les troupes sélectionnées pour les synergies
        let troopsToAnalyze = this.selectedTroops;
        
        console.log('Troupes sélectionnées pour les synergies:', troopsToAnalyze.length);
        
        // Si aucune troupe n'est sélectionnée, afficher un message
        if (troopsToAnalyze.length === 0) {
            synergiesContainer.innerHTML = '<p class="no-synergies">Sélectionnez des unités pour voir les synergies</p>';
            return;
        }

        const synergies = this.calculateSynergies(troopsToAnalyze);
        console.log('Synergies calculées:', synergies);
        
        if (synergies.length === 0) {
            synergiesContainer.innerHTML = '<p class="no-synergies">Aucune synergie active avec cette composition</p>';
            return;
        }

        synergiesContainer.innerHTML = '<h4>Synergies Actives:</h4>';
        synergies.forEach(synergy => {
            const synergyElement = document.createElement('div');
            synergyElement.className = 'synergy-item';
            synergyElement.innerHTML = `
                <div class="synergy-name">${synergy.name}</div>
                <div class="synergy-description">${synergy.description}</div>
            `;
            synergiesContainer.appendChild(synergyElement);
        });
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
        
        if (this.currentCombat && this.currentCombat.isActive) {
            // Combat actif en cours
            targetDamage = this.currentCombat.targetDamage;
            isBossFight = this.currentCombat.isBossFight;
        } else {
            // Calculer l'objectif pour le prochain combat
            isBossFight = this.BOSS_RANKS.includes(this.rank);
                        if (isBossFight) {
                // Objectif de boss (moyenne des boss)
                targetDamage = 8000; // Valeur moyenne des boss (800 * 10)
            } else {
                // Objectif normal basé sur le rang
                const rankIndex = this.RANKS.indexOf(this.rank);
                targetDamage = 2000 + (rankIndex * 500); // (200 + rankIndex * 50) * 10
 
            }
        }

        targetDisplay.textContent = targetDamage;

        // Déterminer le nom de l'ennemi et l'image correspondante
        let enemyNameText = 'Troupes de gobelin';
        let enemyImageSrc = 'assets/gobelin.jpg';
        
        if (isBossFight) {
            enemyNameText = 'Boss';
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
            if (bossName) bossName.textContent = enemyNameText;
            if (bossMechanicText) bossMechanicText.textContent = this.currentCombat ? this.currentCombat.bossMechanic : 'Mécanique spéciale de boss';
        } else if (bossMechanicDisplay) {
            bossMechanicDisplay.style.display = 'none';
        }
    }

    // Afficher toutes les troupes dans une modal
    showAllTroops() {
        const troopsList = document.getElementById('all-troops-list');
        const troopsModal = document.getElementById('troops-modal');
        
        if (!troopsList || !troopsModal) return;

        troopsList.innerHTML = '';

        // Créer un pool complet de toutes les troupes disponibles (5 de chaque unité de base)
        const fullTroopPool = [];
        this.BASE_UNITS.forEach(unit => {
            for (let i = 0; i < 5; i++) {
                fullTroopPool.push({...unit, id: `${unit.name}_${i}`});
            }
        });

        // Ajouter seulement les troupes achetées dans le magasin (pas les troupes de base)
        const allTroops = [
            ...fullTroopPool,
            ...this.availableTroops
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
                    icon: troop.icon
                };
            }
            troopsByType[troop.name].count++;
        });

        // Créer les éléments pour chaque type de troupe
        Object.keys(troopsByType).forEach(troopName => {
            const troopData = troopsByType[troopName];
            const troopElement = document.createElement('div');
            troopElement.className = 'troop-list-item';

            const typeDisplay = Array.isArray(troopData.type) ? troopData.type.join(' / ') : troopData.type;

            troopElement.innerHTML = `
                <div class="troop-list-name">
                    ${troopData.icon} ${troopName}
                </div>
                <div class="troop-list-stats">
                    <span>💥 ${troopData.damage}</span>
                    <span>⚡ ${troopData.multiplier}</span>
                    <span>🏷️ ${typeDisplay}</span>
                </div>
                <div class="troop-list-count">
                    x${troopData.count}
                </div>
            `;

            troopsList.appendChild(troopElement);
        });

        // Afficher la modal
        troopsModal.style.display = 'block';
    }

    // Définitions centralisées des bonus
    getBonusDescriptions() {
        return {
            'gold_bonus': { name: 'Bonus Or', description: '+25 or par combat', icon: '💰' },
            'corps_a_corps_bonus': { name: 'Bonus Corps à corps', description: '+10 dégâts par combat', icon: '⚔️' },
            'distance_bonus': { name: 'Bonus Distance', description: '+10 dégâts par combat', icon: '🏹' },
            'magique_bonus': { name: 'Bonus Magique', description: '+10 dégâts par combat', icon: '🔮' },
            // Nouveaux bonus d'équipement
            'epee_aiguisee': { name: 'Épée Aiguisée', description: '+2 dégâts pour les unités corps à corps', icon: '⚔️' },
            'arc_renforce': { name: 'Arc Renforcé', description: '+2 dégâts pour les unités distance', icon: '🏹' },
            'grimoire_magique': { name: 'Grimoire Magique', description: '+2 dégâts pour les unités magiques', icon: '📚' },
            'amulette_force': { name: 'Amulette de Force', description: '+1 multiplicateur pour les unités corps à corps', icon: '💎' },
            'cristal_precision': { name: 'Cristal de Précision', description: '+1 multiplicateur pour les unités distance', icon: '💎' },
            'orbe_mystique': { name: 'Orbe Mystique', description: '+1 multiplicateur pour les unités magiques', icon: '🔮' },
            'armure_legendaire': { name: 'Armure Légendaire', description: '+5 dégâts et +2 multiplicateur pour les unités corps à corps', icon: '🛡️' },
            'arc_divin': { name: 'Arc Divin', description: '+5 dégâts et +2 multiplicateur pour les unités distance', icon: '🏹' },
            'baguette_supreme': { name: 'Baguette Suprême', description: '+5 dégâts et +2 multiplicateur pour les unités magiques', icon: '🪄' },
            'potion_force': { name: 'Potion de Force', description: '+3 dégâts pour toutes les unités', icon: '🧪' },
            'elixir_puissance': { name: 'Élixir de Puissance', description: '+1 multiplicateur pour toutes les unités', icon: '🧪' },
            'relique_ancienne': { name: 'Relique Ancienne', description: '+10 dégâts et +3 multiplicateur pour toutes les unités', icon: '🏛️' }
        };
    }

    // Mettre à jour les bonus actifs
    updateActiveBonuses() {
        const bonusesContainer = document.getElementById('active-bonuses');
        if (!bonusesContainer) {
            console.warn('Container active-bonuses non trouvé');
            return;
        }

        console.log('Mise à jour des bonus actifs. Bonus débloqués:', this.unlockedBonuses);

        bonusesContainer.innerHTML = '';

        if (this.unlockedBonuses.length === 0) {
            bonusesContainer.innerHTML = '<span style="color: #666; font-style: italic;">Aucun bonus</span>';
            return;
        }

        const bonusDescriptions = this.getBonusDescriptions();

        // Compter les occurrences de chaque bonus
        const bonusCounts = {};
        this.unlockedBonuses.forEach(bonusId => {
            bonusCounts[bonusId] = (bonusCounts[bonusId] || 0) + 1;
        });

        console.log('Comptage des bonus:', bonusCounts);

        // Afficher chaque bonus avec son nombre
        Object.keys(bonusCounts).forEach(bonusId => {
            const bonus = bonusDescriptions[bonusId];
            if (bonus) {
                const bonusElement = document.createElement('div');
                bonusElement.className = 'bonus-item';
                const count = bonusCounts[bonusId];
                const countText = count > 1 ? ` (x${count})` : '';
                bonusElement.innerHTML = `
                    ${bonus.icon} ${bonus.name}${countText}
                    <div class="bonus-tooltip">${bonus.description}${count > 1 ? ` - ${count} fois` : ''}</div>
                `;
                bonusesContainer.appendChild(bonusElement);
                console.log(`Bonus affiché: ${bonus.name}`);
            } else {
                // Si le bonus n'est pas trouvé, afficher un message d'erreur temporaire
                console.warn(`Bonus non trouvé: ${bonusId}`);
                const bonusElement = document.createElement('div');
                bonusElement.className = 'bonus-item';
                bonusElement.style.color = '#ff6b6b';
                const count = bonusCounts[bonusId];
                const countText = count > 1 ? ` (x${count})` : '';
                bonusElement.innerHTML = `
                    ❓ Bonus Inconnu${countText}
                    <div class="bonus-tooltip">Bonus non défini: ${bonusId}</div>
                `;
                bonusesContainer.appendChild(bonusElement);
            }
        });
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
            this.updatePreCombatShop();
        }
    }

    // Mettre à jour le magasin avant combat
    updatePreCombatShop() {
        const shopContainer = document.getElementById('pre-combat-shop');
        if (!shopContainer) return;

        shopContainer.innerHTML = '';

        // Générer des items aléatoires pour le magasin (seulement si pas déjà générés)
        if (!this.currentShopItems) {
            this.currentShopItems = this.generateShopItems();
        }
        const shopItems = this.currentShopItems;
        
        shopItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            
            const canAfford = this.gold >= item.price;
            const isBonusAlreadyOwned = item.type === 'bonus' && this.unlockedBonuses.includes(item.bonusId);
            
            // Griser si pas assez d'or OU si le bonus est déjà acheté
            if (!canAfford || isBonusAlreadyOwned) {
                itemElement.style.opacity = '0.5';
            }
            
            if (item.type === 'unit') {
                // Afficher les types (gère les types multiples)
                const typeDisplay = Array.isArray(item.unitType) ? item.unitType.join(' / ') : item.unitType;
                
                itemElement.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">${typeDisplay}</div>
                    <div style="font-size: 0.8rem; margin-bottom: 10px;">${item.damage} dmg ×${item.multiplier}</div>
                    <div class="item-price">${item.price}💰</div>
                `;
            } else {
                itemElement.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">${item.description}</div>
                    <div class="item-price">${item.price}💰</div>
                `;
            }
            
            // Permettre l'achat seulement si on peut se le permettre ET que le bonus n'est pas déjà possédé
            if (canAfford && !isBonusAlreadyOwned) {
                itemElement.addEventListener('click', () => {
                    if (this.spendGold(item.price)) {
                        if (item.type === 'unit') {
                            // Convertir l'unité pour qu'elle soit compatible avec le système
                            const troop = {
                                ...item,
                                type: item.unitType, // Utiliser unitType comme type
                                id: `${item.name}_${Date.now()}_${Math.random()}` // Générer un ID unique
                            };
                            delete troop.unitType; // Supprimer unitType pour éviter la confusion
                            this.addTroop(troop);
                            // this.showNotification(`${item.name} acheté !`, 'success');
                        } else {
                            this.unlockBonus(item.bonusId);
                            // this.showNotification(`${item.name} débloqué !`, 'success');
                        }
                        this.updateUI();
                    }
                });
            }
            
            shopContainer.appendChild(itemElement);
        });
    }

    // Générer des items pour le magasin
    generateShopItems() {
        const bonusDescriptions = this.getBonusDescriptions();
        
        const allItems = [
            // Unités de base (prix réduits)
            { type: 'unit', name: 'Épéiste', icon: '⚔️', unitType: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, price: 25 },
            { type: 'unit', name: 'Archer', icon: '🏹', unitType: ['Distance', 'Physique'], damage: 4, multiplier: 3, price: 25 },
            { type: 'unit', name: 'Magicien Rouge', icon: '🔴', unitType: ['Distance', 'Magique'], damage: 6, multiplier: 2, price: 30 },
            { type: 'unit', name: 'Magicien Bleu', icon: '🔵', unitType: ['Corps à corps', 'Magique'], damage: 3, multiplier: 4, price: 30 },
            { type: 'unit', name: 'Lancier', icon: '🔱', unitType: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, price: 25 },
            { type: 'unit', name: 'Barbare', icon: '🪓', unitType: ['Corps à corps', 'Physique'], damage: 7, multiplier: 1, price: 30 },
            { type: 'unit', name: 'Viking', icon: '🛡️', unitType: ['Corps à corps', 'Physique'], damage: 6, multiplier: 2, price: 30 },
            { type: 'unit', name: 'Fronde', icon: '🪨', unitType: ['Distance', 'Physique'], damage: 2, multiplier: 5, price: 35 },
            
            // Unités spéciales (prix réduits)
            { type: 'unit', name: 'Paladin', icon: '⚜️', unitType: ['Corps à corps', 'Physique'], damage: 8, multiplier: 2, price: 50 },
            { type: 'unit', name: 'Assassin', icon: '🗡️', unitType: ['Corps à corps', 'Physique'], damage: 3, multiplier: 6, price: 50 },
            { type: 'unit', name: 'Mage', icon: '🔮', unitType: ['Distance', 'Magique'], damage: 5, multiplier: 4, price: 50 },
            { type: 'unit', name: 'Chevalier', icon: '🐎', unitType: ['Corps à corps', 'Physique'], damage: 9, multiplier: 1, price: 60 },
            { type: 'unit', name: 'Arbalétrier', icon: '🎯', unitType: ['Distance', 'Physique'], damage: 8, multiplier: 2, price: 60 },
            { type: 'unit', name: 'Sorcier', icon: '🧙‍♂️', unitType: ['Distance', 'Magique'], damage: 4, multiplier: 5, price: 60 },
            { type: 'unit', name: 'Berserker', icon: '😤', unitType: ['Corps à corps', 'Physique'], damage: 10, multiplier: 1, price: 60 },
            { type: 'unit', name: 'Archer d\'Élite', icon: '🎖️', unitType: ['Distance', 'Physique'], damage: 6, multiplier: 4, price: 80 },
            { type: 'unit', name: 'Mage Suprême', icon: '👑', unitType: ['Distance', 'Magique', 'Corps à corps'], damage: 7, multiplier: 5, price: 100 },
            { type: 'unit', name: 'Champion', icon: '🏆', unitType: ['Corps à corps', 'Physique', 'Magique'], damage: 12, multiplier: 2, price: 120 },
            // Bonus - générés dynamiquement à partir des définitions centralisées
            ...Object.keys(bonusDescriptions).map(bonusId => {
                const bonus = bonusDescriptions[bonusId];
                // Prix réduits pour permettre plus d'achats
                let price = 50; // Prix par défaut réduit
                
                // Bonus de base (très abordables)
                if (['gold_bonus', 'corps_a_corps_bonus', 'distance_bonus', 'magique_bonus'].includes(bonusId)) {
                    price = 30;
                }
                // Bonus d'équipement communs
                else if (['epee_aiguisee', 'arc_renforce', 'grimoire_magique'].includes(bonusId)) {
                    price = 25;
                }
                // Bonus d'équipement rares
                else if (['amulette_force', 'cristal_precision', 'orbe_mystique', 'potion_force', 'elixir_puissance'].includes(bonusId)) {
                    price = 40;
                }
                // Bonus d'équipement très rares
                else if (['armure_legendaire', 'arc_divin', 'baguette_supreme'].includes(bonusId)) {
                    price = 60;
                }
                // Bonus légendaires
                else if (['relique_ancienne'].includes(bonusId)) {
                    price = 100;
                }
                
                
                return {
                    type: 'bonus',
                    name: bonus.name,
                    icon: bonus.icon,
                    description: bonus.description,
                    bonusId: bonusId,
                    price: price
                };
            })
        ];
        
        // Mélanger et sélectionner 8 items aléatoires (augmenté de 5 à 8)
        return allItems.sort(() => Math.random() - 0.5).slice(0, 8);
    }

    // Réinitialiser le magasin
    resetShop() {
        this.currentShopItems = null;
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Créer une file d'attente pour les notifications si elle n'existe pas
        if (!this.notificationQueue) {
            this.notificationQueue = [];
        }
        
        // Ajouter la notification à la file d'attente
        this.notificationQueue.push({ message, type });
        
        // Traiter la file d'attente si elle n'est pas déjà en cours
        if (!this.isProcessingNotifications) {
            this.processNotificationQueue();
        }
    }
    
    // Traiter la file d'attente des notifications
    async processNotificationQueue() {
        if (this.notificationQueue.length === 0) {
            this.isProcessingNotifications = false;
            return;
        }
        
        this.isProcessingNotifications = true;
        
        // Prendre la première notification de la file
        const { message, type } = this.notificationQueue.shift();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00b894' : type === 'error' ? '#d63031' : '#74b9ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // Attendre 3 secondes puis faire disparaître la notification
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        notification.style.animation = 'slideOut 0.3s ease';
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        
        // Traiter la notification suivante après un délai
        await new Promise(resolve => setTimeout(resolve, 200));
        this.processNotificationQueue();
    }

    // Sauvegarde et chargement
    save() {
        const saveData = {
            rank: this.rank,
            rankProgress: this.rankProgress,
            rankTarget: this.rankTarget,
            gold: this.gold,
            availableTroops: this.availableTroops,
            selectedTroops: this.selectedTroops,
            combatTroops: this.combatTroops,
            usedTroopsThisRank: this.usedTroopsThisRank,
            combatHistory: this.combatHistory,
            isFirstTime: this.isFirstTime,
            unlockedBonuses: this.unlockedBonuses,
            currentCombat: this.currentCombat,
            currentShopItems: this.currentShopItems
        };
        
        localStorage.setItem('guildMasterSave', JSON.stringify(saveData));
        // this.showNotification('Partie sauvegardée !', 'success');
    }

    load() {
        const saveData = localStorage.getItem('guildMasterSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            Object.assign(this, data);
            
            // Initialiser les bonus si pas présents
            if (!this.unlockedBonuses) {
                this.unlockedBonuses = [];
            }
            
            // Initialiser le combat si pas présent
            if (!this.currentCombat) {
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
            }
            
            // Initialiser le magasin si pas présent
            if (!this.currentShopItems) {
                this.currentShopItems = null;
            }
            
            // Nettoyer les bonus invalides au chargement
            this.cleanInvalidBonuses();
            
            this.updateUI();
            
            // Tirer les troupes de combat si aucune n'est disponible
            if (this.combatTroops.length === 0) {
                this.drawCombatTroops();
            }
            
            return true;
        }
        return false;
    }

    // Nouvelle partie
    newGame() {
        this.rank = 'F-';
        this.rankProgress = 0;
        this.rankTarget = 100;
        this.gold = 100;
        this.availableTroops = [];
        this.selectedTroops = [];
        this.combatTroops = [];
        this.usedTroopsThisRank = [];
        this.combatHistory = [];
        this.isFirstTime = true;
        this.unlockedBonuses = [];
        
        // Réinitialiser le combat
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
        
        console.log('newGame() - Rang initialisé:', this.rank);
        console.log('newGame() - RANKS.indexOf(this.rank):', this.RANKS.indexOf(this.rank));
        
        this.updateUI();
        
        // Tirer les premières troupes pour le combat
        this.drawCombatTroops();
    }
} 