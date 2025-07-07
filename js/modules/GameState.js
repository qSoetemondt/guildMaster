// Classe GameState en ES6
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
        
        // Initialiser le magasin
        this.currentShopItems = null;
        this.currentShopPurchasedBonuses = []; // Bonus achetés dans la session actuelle du magasin
        this.shopRefreshCount = 0; // Nombre de rafraîchissements effectués
        this.shopRefreshCost = 10; // Coût initial du rafraîchissement
        // Initialiser les listes d'achats de la session de magasin
        this.currentShopPurchasedUnits = [];
        this.currentShopPurchasedConsumables = [];
        
        // Système de consomables
        this.consumables = []; // Inventaire des consomables
        this.transformedBaseUnits = {}; // Garder une trace des unités de base transformées
        
        // Système de niveaux de synergies
        this.synergyLevels = {
            'Formation Corps à Corps': 1,
            'Formation Distance': 1,
            'Formation Magique': 1,
            'Horde Corps à Corps': 1,
            'Volée de Flèches': 1,
            'Tempête Magique': 1,
            'Tactique Mixte': 1,
            'Force Physique': 1
        };
        this.CONSUMABLES_TYPES = {
            refreshShop: {
                name: 'Relance Boutique',
                description: 'Relance le magasin gratuitement',
                icon: '🔄',
                price: Math.ceil(10 * 1.75), // 18
                effect: 'refreshShop'
            },
            transformSword: {
                name: 'Épée de Transformation',
                description: 'Transforme une unité en Épéiste',
                icon: '⚔️',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Épéiste'
            },
            transformArcher: {
                name: 'Arc de Transformation',
                description: 'Transforme une unité en Archer',
                icon: '🏹',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Archer'
            },
            transformLancier: {
                name: 'Lance de Transformation',
                description: 'Transforme une unité en Lancier',
                icon: '🔱',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Lancier'
            },
            transformPaysan: {
                name: 'Paysan de Transformation',
                description: 'Transforme une unité en Paysan',
                icon: '👨‍🌾',
                price: Math.ceil(5 * 1.75), // 9
                effect: 'transformUnit',
                targetUnit: 'Paysan'
            },
            transformMagicienBleu: {
                name: 'Magicien Bleu de Transformation',
                description: 'Transforme une unité en Magicien Bleu',
                icon: '🔵',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Magicien Bleu'
            },
            transformMagicienRouge: {
                name: 'Magicien Rouge de Transformation',
                description: 'Transforme une unité en Magicien Rouge',
                icon: '🔴',
                price: Math.ceil(15 * 1.75), // 27
                effect: 'transformUnit',
                targetUnit: 'Magicien Rouge'
            },
            transformBarbare: {
                name: 'Barbare de Transformation',
                description: 'Transforme une unité en Barbare',
                icon: '👨‍🚒',
                price: Math.ceil(25 * 1.75), // 44
                effect: 'transformUnit',
                targetUnit: 'Barbare'
            },
            transformSorcier: {
                name: 'Sorcier de Transformation',
                description: 'Transforme une unité en Sorcier',
                icon: '🔮',
                price: Math.ceil(50 * 1.75), // 88
                effect: 'transformUnit',
                targetUnit: 'Sorcier'
            },
            transformFronde: {
                name: 'Fronde de Transformation',
                description: 'Transforme une unité en Fronde',
                icon: '🪨',
                price: Math.ceil(50 * 1.75), // 88
                effect: 'transformUnit',
                targetUnit: 'Fronde'
            },
            upgradeSynergy: {
                name: 'Cristal de Synergie',
                description: 'Améliore le niveau d\'une synergie d\'équipe de +1',
                icon: '💎',
                price: Math.ceil(30 * 1.75), // 53
                effect: 'upgradeSynergy'
            }
        };
        
        // Progression des rangs
        this.RANKS = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];
        
        // Rangs qui déclenchent des combats de boss
        this.BOSS_RANKS = ['F+', 'E+', 'D+', 'C+', 'B+', 'A+', 'S'];
        
        // Définition des unités de base
        this.BASE_UNITS = [
            { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, icon: '⚔️', rarity: 'common' },
            { name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3, icon: '🏹', rarity: 'common' },
            { name: 'Magicien Bleu', type: ['Distance', 'Magique'], damage: 3, multiplier: 4, icon: '🔵', rarity: 'uncommon' },
            { name: 'Lancier', type: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, icon: '🔱', rarity: 'common' },
            { name: 'Paysan', type: ['Corps à corps', 'Physique'], damage: 2, multiplier: 1, icon: '👨‍🌾', rarity: 'common' },
            { name: 'Soigneur', type: ['Soigneur', 'Magique'], damage: 1, multiplier: 1, icon: '💚', rarity: 'common' }
        ];
        


        // Boss disponibles
        this.BOSSES = [
            { name: 'Golem de Pierre', mechanic: 'Les unités corps à corps font -50% de dégâts', targetDamage: 4000, icon: '🗿' },
            { name: 'Dragon de Glace', mechanic: 'Les unités distance font -30% de dégâts', targetDamage: 5000, icon: '❄️' },
            { name: 'Liche', mechanic: 'Les unités corps à corps font -2 dégâts', targetDamage: 4500, icon: '💀' },
            { name: 'Titan', mechanic: 'Les multiplicateurs sont réduits de moitié', targetDamage: 6000, icon: '🏔️' },
            { name: 'Démon', mechanic: 'Les unités magiques font +50% de dégâts', targetDamage: 5500, icon: '👹' }
        ];
        
        // Fonction pour calculer les dégâts cibles selon le rang majeur
        this.calculateTargetDamageByRank = function(rank) {
            const rankIndex = this.RANKS.indexOf(rank);
            if (rankIndex === -1) return 2000; // Valeur par défaut
            
            // Déterminer le rang majeur (F, E, D, C, B, A, S)
            let majorRank = 'F';
            if (rankIndex >= 3 && rankIndex <= 5) majorRank = 'E';      // E-, E, E+
            else if (rankIndex >= 6 && rankIndex <= 8) majorRank = 'D'; // D-, D, D+
            else if (rankIndex >= 9 && rankIndex <= 11) majorRank = 'C'; // C-, C, C+
            else if (rankIndex >= 12 && rankIndex <= 14) majorRank = 'B'; // B-, B, B+
            else if (rankIndex >= 15 && rankIndex <= 17) majorRank = 'A'; // A-, A, A+
            else if (rankIndex === 18) majorRank = 'S';                   // S
            
            // Multiplicateur selon le rang majeur
            const multipliers = {
                'F': 1,    // F reste comme maintenant
                'E': 2,    // E multiplié par 2
                'D': 4,    // D par 4
                'C': 8,    // C par 8
                'B': 16,   // B par 16
                'A': 32,   // A par 32
                'S': 64    // S par 64
            };
            
            const baseDamage = 2000 + (rankIndex * 500);
            return baseDamage * multipliers[majorRank];
        };
        
        // Boss sélectionné pour l'affichage (mémorisé pour éviter les changements)
        this.displayBoss = null;
        
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
            
            // Réinitialiser le boss d'affichage pour le nouveau rang
            this.displayBoss = null;
            
            // Tirer de nouvelles troupes pour le nouveau rang
            this.drawCombatTroops();
            
            console.log(`Rang changé: ${oldRank} → ${this.rank}`);
            // this.showNotification(`Rang gagné ! Nouveau rang: ${this.rank}`, 'success');
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
        
        // Réinitialiser aussi les conteneurs mobile
        const unitsContentMobile = document.getElementById('units-slider-content-mobile');
        const synergiesContentMobile = document.getElementById('synergies-animation-content-mobile');
        const bonusesContentMobile = document.getElementById('bonuses-animation-content-mobile');
        
        if (unitsContentMobile) unitsContentMobile.innerHTML = '';
        if (synergiesContentMobile) synergiesContentMobile.innerHTML = '';
        if (bonusesContentMobile) bonusesContentMobile.innerHTML = '';
        
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
                
                const rarityIcon = this.getRarityIcon(rarity);
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
            
            const typeDisplay = Array.isArray(troop.type) ? troop.type.join(' / ') : troop.type;
            
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
                        <div class="unit-slide-damage">+${troop.damage}</div>
                        <div class="unit-slide-multiplier">×${troop.multiplier}</div>
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
            
            // Mettre à jour la barre de progression
            const progress = (i + 1) / troopsUsed.length * 100;
            progressFill.style.width = `${progress}%`;
            
            await this.sleep(500);
        }
        
        // PHASE 4: Finalisation (les mécaniques de boss sont déjà appliquées dans les calculs précédents)
        await this.sleep(500);
        
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
            this.addGold(baseReward);
            
            // Bonus de richesse
            const wealthBonus = this.calculateWealthBonus();
            this.addGold(wealthBonus);
            
            // Calculer les bonus d'or des bonus d'équipement
            const equipmentGoldBonus = this.calculateEquipmentGoldBonus();
            this.addGold(equipmentGoldBonus);
            
            // Notification des récompenses
            // this.showNotification(`Victoire ! +${baseReward} or +${wealthBonus} or (bonus richesse)`, 'success');
            
            // Monter de rang après victoire
            this.gainRank();
            
            // Appliquer les bonus de base après combat
            this.applyCombatBonuses();
            
            // S'assurer que la modal de combat est affichée
            const combatModal = document.getElementById('combat-modal');
            if (combatModal) {
                combatModal.style.display = 'block';
                combatModal.classList.add('active');
            }
            
            // Afficher l'encadré de victoire avec le détail des récompenses
            this.showVictorySummary(baseReward, wealthBonus, equipmentGoldBonus);
        } else {
            this.showNotification('Défaite !', 'error');
        }

        // Vider les troupes après combat
        this.combatTroops = [];
        this.selectedTroops = [];
        this.usedTroopsThisRank = [];

        // Réinitialiser le magasin pour qu'il se régénère
        this.currentShopItems = null;
        this.currentShopPurchasedBonuses = []; // Réinitialiser les bonus achetés dans cette session
        
        // Réinitialiser le coût de rafraîchissement après chaque combat
        this.shopRefreshCount = 0;
        this.shopRefreshCost = 10;

        // Nettoyer l'affichage du malus de boss
        this.cleanBossMalusDisplay();

        this.updateUI();
        
        // Tirer de nouvelles troupes pour le prochain combat
        this.drawCombatTroops();
        
        // Ne pas fermer automatiquement la modal de combat en cas de victoire
        // L'utilisateur devra la fermer manuellement
        if (!victory) {
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
                                // Initialiser le magasin si la fonction existe
                                if (typeof initShop === 'function') {
                                    initShop();
                                }
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
        this.gameStats.goldEarned += amount;
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
        
        // Obtenir toutes les troupes disponibles
        const allAvailableTroops = [...this.combatTroops, ...this.availableTroops];
        
        if (troopIndex >= 0 && troopIndex < allAvailableTroops.length) {
            const troop = allAvailableTroops[troopIndex];
            
            // Retirer la troupe de la liste appropriée
            const combatIndex = this.combatTroops.findIndex(t => t.id === troop.id);
            if (combatIndex !== -1) {
                this.combatTroops.splice(combatIndex, 1);
            } else {
                const availableIndex = this.availableTroops.findIndex(t => t.id === troop.id);
                if (availableIndex !== -1) {
                    this.availableTroops.splice(availableIndex, 1);
                }
            }
            
            this.selectedTroops.push(troop);
            this.updateTroopsUI();
            this.updateSynergies();
        }
    }

    // Désélectionner une troupe du combat
    deselectTroopFromCombat(troopIndex) {
        if (troopIndex >= 0 && troopIndex < this.selectedTroops.length) {
            const troop = this.selectedTroops.splice(troopIndex, 1)[0];
            
            // Remettre la troupe dans la liste appropriée selon son origine
            if (this.BASE_UNITS.some(baseUnit => baseUnit.name === troop.name)) {
                // C'est une troupe de base, la remettre dans combatTroops
            this.combatTroops.push(troop);
            } else {
                // C'est une troupe achetée, la remettre dans availableTroops
                this.availableTroops.push(troop);
            }
            
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
            const level = this.synergyLevels['Formation Corps à Corps'] || 1;
            const multiplierBonus = 2 + (level - 1); // +2 au niveau 1, +3 au niveau 2, etc.
            synergies.push({
                name: 'Formation Corps à Corps',
                description: `+${multiplierBonus} multiplicateur pour toutes les unités corps à corps (Niveau ${level})`,
                bonus: { multiplier: multiplierBonus, target: 'Corps à corps' },
                level: level
            });
        }
        
        if (typeCounts['Distance'] >= 3) {
            const level = this.synergyLevels['Formation Distance'] || 1;
            const multiplierBonus = 3 + (level - 1); // +3 au niveau 1, +4 au niveau 2, etc.
            synergies.push({
                name: 'Formation Distance',
                description: `+${multiplierBonus} multiplicateur pour toutes les unités distance (Niveau ${level})`,
                bonus: { multiplier: multiplierBonus, target: 'Distance' },
                level: level
            });
        }
        
        if (typeCounts['Magique'] >= 3) {
            const level = this.synergyLevels['Formation Magique'] || 1;
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
            const level = this.synergyLevels['Horde Corps à Corps'] || 1;
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
            const level = this.synergyLevels['Volée de Flèches'] || 1;
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
            const level = this.synergyLevels['Tempête Magique'] || 1;
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
            const level = this.synergyLevels['Tactique Mixte'] || 1;
            const damageBonus = 3 + (level - 1); // +3 au niveau 1, +4 au niveau 2, etc.
            synergies.push({
                name: 'Tactique Mixte',
                description: `+${damageBonus} dégâts pour toutes les unités (Niveau ${level})`,
                bonus: { damage: damageBonus, target: 'all' },
                level: level
            });
        }
        
        if (typeCounts['Physique'] >= 6) {
            const level = this.synergyLevels['Force Physique'] || 1;
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
        
        // Ajouter le bonus (permet l'empilement)
            this.unlockedBonuses.push(bonusId);
        // this.showNotification('Bonus débloqué !', 'success');
            
            // Mettre à jour l'interface immédiatement pour afficher le nouveau bonus
            this.updateActiveBonuses();
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
        const goldElement = document.getElementById('gold-amount');
        const guildNameInput = document.getElementById('guild-name-input');
        
        if (rankElement) rankElement.textContent = this.rank;
        if (goldElement) goldElement.textContent = this.gold;
        if (guildNameInput && guildNameInput.value !== this.guildName) {
            guildNameInput.value = this.guildName;
        }

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
        
        // Mettre à jour les consomables
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
        const availableContainer = document.getElementById('available-troops');
        const selectedContainer = document.getElementById('selected-troops');

        if (!availableContainer || !selectedContainer) {
            return;
        }

        availableContainer.innerHTML = '';
        selectedContainer.innerHTML = '';

        // Afficher toutes les troupes disponibles (combat + achetées)
        const allAvailableTroops = [...this.combatTroops, ...this.availableTroops];
        
        allAvailableTroops.forEach((troop, index) => {
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
            availableTitle.textContent = `Troupes Disponibles (${allAvailableTroops.length})`;
        }
        if (selectedTitle) {
            selectedTitle.textContent = `Troupes Sélectionnées (${this.selectedTroops.length}/5)`;
        }
    }

    createTroopCard(troop, index, isSelected) {
        const card = document.createElement('div');
        const isUsed = this.usedTroopsThisRank.includes(troop.id);
        
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
            card.style.borderColor = this.getRarityColor(troop.rarity);
        }
        
        // Afficher les types (gère les types multiples)
        const typeDisplay = Array.isArray(troop.type) ? troop.type.join(' / ') : troop.type;
        
        card.innerHTML = `
            <div class="unit-icon">${troop.icon}</div>
            <div class="unit-name">${troop.name}</div>
            <div class="unit-stats">${troop.damage} dmg ×${troop.multiplier}</div>
            <div class="unit-type">${typeDisplay}</div>
            ${troop.rarity ? `<div class="unit-rarity" style="color: ${this.getRarityColor(troop.rarity)}; font-weight: 600; margin-top: 5px; font-size: 0.8rem;">
                ${this.getRarityIcon(troop.rarity)} ${troop.rarity.toUpperCase()}
            </div>` : ''}
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

        // Vider le conteneur AVANT d'ajouter de nouveaux éléments
        synergiesContainer.innerHTML = '';

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

        // Ajouter les synergies une par une
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
                    icon: troop.icon,
                    rarity: troop.rarity
                };
            }
            troopsByType[troop.name].count++;
        });

        // Ajuster les compteurs pour les unités de base transformées
        Object.keys(this.transformedBaseUnits).forEach(unitName => {
            if (troopsByType[unitName]) {
                troopsByType[unitName].count = Math.max(0, troopsByType[unitName].count - this.transformedBaseUnits[unitName]);
            }
        });

        // Créer les éléments pour chaque type de troupe
        Object.keys(troopsByType).forEach(troopName => {
            const troopData = troopsByType[troopName];
            const rarityClass = troopData.rarity ? `rarity-${troopData.rarity}` : '';
            const classes = ['troop-list-item'];
            if (rarityClass) classes.push(rarityClass);
            const troopElement = document.createElement('div');
            troopElement.className = classes.join(' ');

            const typeDisplay = Array.isArray(troopData.type) ? troopData.type.join(' / ') : troopData.type;

            // Vérifier si l'unité peut être transformée
            // Permettre la transformation des unités possédées (base ou achetées)
            const baseUnit = this.BASE_UNITS.find(unit => unit.name === troopName);
            const transformedCount = this.transformedBaseUnits[troopName] || 0;
            const availableCount = baseUnit ? (5 - transformedCount) : troopData.count;
            
            // Vérifier quel type de consommable de transformation est disponible
            const hasSwordTransform = this.consumables.some(c => c.type === 'transformSword');
            const hasArcherTransform = this.consumables.some(c => c.type === 'transformArcher');
            const hasLancierTransform = this.consumables.some(c => c.type === 'transformLancier');
            const hasPaysanTransform = this.consumables.some(c => c.type === 'transformPaysan');
            const hasMagicienBleuTransform = this.consumables.some(c => c.type === 'transformMagicienBleu');
            const hasMagicienRougeTransform = this.consumables.some(c => c.type === 'transformMagicienRouge');
            const hasBarbareTransform = this.consumables.some(c => c.type === 'transformBarbare');
            const hasSorcierTransform = this.consumables.some(c => c.type === 'transformSorcier');
            const hasFrondeTransform = this.consumables.some(c => c.type === 'transformFronde');
            
            let transformButton = '';
            if (availableCount > 0) {
                if (hasSwordTransform && troopName !== 'Épéiste') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Épéiste" title="Transformer en Épéiste">
                        ⚔️ Transformer
                    </button>`;
                } else if (hasArcherTransform && troopName !== 'Archer') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Archer" title="Transformer en Archer">
                        🏹 Transformer
                    </button>`;
                } else if (hasLancierTransform && troopName !== 'Lancier') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Lancier" title="Transformer en Lancier">
                        🔱 Transformer
                    </button>`;
                } else if (hasPaysanTransform && troopName !== 'Paysan') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Paysan" title="Transformer en Paysan">
                        👨‍🌾 Transformer
                    </button>`;
                } else if (hasMagicienBleuTransform && troopName !== 'Magicien Bleu') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Magicien Bleu" title="Transformer en Magicien Bleu">
                        🔵 Transformer
                    </button>`;
                } else if (hasMagicienRougeTransform && troopName !== 'Magicien Rouge') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Magicien Rouge" title="Transformer en Magicien Rouge">
                        🔴 Transformer
                    </button>`;
                } else if (hasBarbareTransform && troopName !== 'Barbare') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Barbare" title="Transformer en Barbare">
                        👨‍🚒 Transformer
                    </button>`;
                } else if (hasSorcierTransform && troopName !== 'Sorcier') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Sorcier" title="Transformer en Sorcier">
                        🔮 Transformer  
                    </button>`;
                } else if (hasFrondeTransform && troopName !== 'Fronde') {
                    transformButton = `<button class="transform-btn" data-unit-name="${troopName}" data-target-unit="Fronde" title="Transformer en Fronde">
                        🪨 Transformer
                    </button>`;
                }   
            }

            troopElement.innerHTML = `
                <div class="troop-list-name">
                    ${troopData.icon} ${troopName}
                </div>
                <div class="troop-list-stats">
                    <span>💥 ${troopData.damage}</span>
                    <span>⚡ ${troopData.multiplier}</span>
                    <span>🏷️ ${typeDisplay}</span>
                    ${troopData.rarity ? `<span style="color: ${this.getRarityColor(troopData.rarity)}; font-weight: 600;">
                        ${this.getRarityIcon(troopData.rarity)} ${troopData.rarity.toUpperCase()}
                    </span>` : ''}
                </div>
                <div class="troop-list-count">
                    x${troopData.count}
                </div>
                <div class="troop-list-actions">
                    ${transformButton}
                </div>
            `;

            // Appliquer le style de rareté directement
            if (troopData.rarity) {
                const rarityColors = {
                    'common': 'linear-gradient(135deg, rgba(102, 102, 102, 0.1) 0%, rgba(102, 102, 102, 0.05) 100%)',
                    'uncommon': 'linear-gradient(135deg, rgba(0, 184, 148, 0.1) 0%, rgba(0, 184, 148, 0.05) 100%)',
                    'rare': 'linear-gradient(135deg, rgba(116, 185, 255, 0.1) 0%, rgba(116, 185, 255, 0.05) 100%)',
                    'epic': 'linear-gradient(135deg, rgba(162, 155, 254, 0.1) 0%, rgba(162, 155, 254, 0.05) 100%)',
                    'legendary': 'linear-gradient(135deg, rgba(253, 203, 110, 0.1) 0%, rgba(253, 203, 110, 0.05) 100%)'
                };
                troopElement.style.background = rarityColors[troopData.rarity];
                troopElement.style.borderLeftColor = this.getRarityColor(troopData.rarity);
            }

            troopsList.appendChild(troopElement);
        });

        // Ajouter les gestionnaires d'événements pour les boutons de transformation
        setTimeout(() => {
            const transformButtons = troopsList.querySelectorAll('.transform-btn');
            transformButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const unitName = e.target.getAttribute('data-unit-name');
                    const targetUnit = e.target.getAttribute('data-target-unit');
                    if (unitName && targetUnit) {
                        this.transformUnitFromModal(unitName, targetUnit);
                    }
                });
            });
        }, 100);

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

    // Fonction pour obtenir l'icône de rareté
    getRarityIcon(rarity) {
        const icons = {
            common: '⚪',
            uncommon: '🟢',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };
        return icons[rarity] || '⚪';
    }

    // Fonction pour obtenir la couleur de rareté
    getRarityColor(rarity) {
        const colors = {
            common: '#666666',
            uncommon: '#00b894',
            rare: '#74b9ff',
            epic: '#a29bfe',
            legendary: '#fdcb6e'
        };
        return colors[rarity] || '#666666';
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
                
                // Déterminer la rareté du bonus
                let rarity = 'common'; // Rareté par défaut
                
                // Bonus de base (très abordables)
                if (['gold_bonus', 'corps_a_corps_bonus', 'distance_bonus', 'magique_bonus'].includes(bonusId)) {
                    rarity = 'common';
                }
                // Bonus d'équipement communs
                else if (['epee_aiguisee', 'arc_renforce', 'grimoire_magique'].includes(bonusId)) {
                    rarity = 'common';
                }
                // Bonus d'équipement rares
                else if (['amulette_force', 'cristal_precision', 'orbe_mystique', 'potion_force', 'elixir_puissance'].includes(bonusId)) {
                    rarity = 'uncommon';
                }
                // Bonus d'équipement très rares
                else if (['armure_legendaire', 'arc_divin', 'baguette_supreme'].includes(bonusId)) {
                    rarity = 'rare';
                }
                // Bonus légendaires
                else if (['relique_ancienne'].includes(bonusId)) {
                    rarity = 'legendary';
                }
                
                // Ajouter la classe de rareté
                bonusElement.className = `bonus-item rarity-${rarity}`;
                
                const count = bonusCounts[bonusId];
                const countText = count > 1 ? ` <span class="bonus-count">×${count}</span>` : '';
                const rarityIcon = this.getRarityIcon(rarity);
                
                bonusElement.innerHTML = `
                    ${rarityIcon} ${bonus.icon} ${bonus.name}${countText}
                    <div class="bonus-tooltip">${bonus.description}${count > 1 ? ` - ${count} fois` : ''}</div>
                `;
                bonusesContainer.appendChild(bonusElement);
                console.log(`Bonus affiché: ${bonus.name} (count: ${count}, rarity: ${rarity})`);
            } else {
                // Si le bonus n'est pas trouvé, afficher un message d'erreur temporaire
                console.warn(`Bonus non trouvé: ${bonusId}`);
                const bonusElement = document.createElement('div');
                bonusElement.className = 'bonus-item';
                bonusElement.style.color = '#ff6b6b';
                const count = bonusCounts[bonusId];
                const countText = count > 1 ? ` <span class="bonus-count">×${count}</span>` : '';
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

        // Ajouter le bouton de rafraîchissement
        const refreshButton = document.createElement('div');
        refreshButton.className = 'shop-refresh-button';
        refreshButton.innerHTML = `
            <div class="refresh-icon">🔄</div>
            <div class="refresh-text">Rafraîchir</div>
            <div class="refresh-cost">${this.shopRefreshCost}💰</div>
        `;
        
        // Griser le bouton si pas assez d'or
        if (this.gold < this.shopRefreshCost) {
            refreshButton.style.opacity = '0.5';
            refreshButton.style.cursor = 'not-allowed';
        } else {
            refreshButton.addEventListener('click', () => {
                this.refreshShop();
            });
        }
        
        shopContainer.appendChild(refreshButton);

        // Générer des items aléatoires pour le magasin (seulement si pas déjà générés)
        if (!this.currentShopItems) {
            this.currentShopItems = this.generateShopItems();
        }
        const shopItems = this.currentShopItems;
        
        shopItems.forEach(item => {
            const itemElement = document.createElement('div');
            
            // Ajouter la classe de rareté
            const rarityClass = item.rarity ? `rarity-${item.rarity}` : '';
            itemElement.className = `shop-item ${rarityClass}`;
            
            const canAfford = this.gold >= item.price;
            const isBonusAlreadyPurchasedInSession = item.type === 'bonus' && this.currentShopPurchasedBonuses.includes(item.bonusId);
            const isUnitAlreadyPurchasedInSession = item.type === 'unit' && this.currentShopPurchasedUnits.includes(item.name);
            const isConsumableAlreadyPurchasedInSession = item.type === 'consumable' && this.currentShopPurchasedConsumables.includes(item.consumableType);
            // Limite de consommables atteinte ?
            const isConsumableLimitReached = item.type === 'consumable' && this.consumables && this.consumables.length >= 3;
            
            // Griser si pas assez d'or OU si déjà acheté dans cette session OU limite consommable atteinte
            if (!canAfford || isBonusAlreadyPurchasedInSession || isUnitAlreadyPurchasedInSession || isConsumableAlreadyPurchasedInSession || isConsumableLimitReached) {
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
                    ${item.rarity ? `<div style="margin-bottom: 10px; font-weight: 600; color: ${this.getRarityColor(item.rarity)}; font-size: 0.8rem;">
                        ${this.getRarityIcon(item.rarity)} ${item.rarity.toUpperCase()}
                    </div>` : ''}
                    <div class="item-price">${item.price}💰</div>
                `;
            } else {
                itemElement.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">${item.description}</div>
                    ${item.rarity ? `<div style="margin-bottom: 10px; font-weight: 600; color: ${this.getRarityColor(item.rarity)}; font-size: 0.8rem;">
                        ${this.getRarityIcon(item.rarity)} ${item.rarity.toUpperCase()}
                    </div>` : ''}
                    <div class="item-price">${item.price}💰</div>
                `;
            }
            
            // Permettre l'achat seulement si on peut se le permettre ET que le bonus n'est pas déjà acheté dans cette session ET limite consommable non atteinte
            if (canAfford && !isBonusAlreadyPurchasedInSession && !isUnitAlreadyPurchasedInSession && !isConsumableAlreadyPurchasedInSession && !isConsumableLimitReached) {
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
                            // Ajouter à la liste des unités achetées dans cette session
                            this.currentShopPurchasedUnits.push(item.name);
                        } else if (item.type === 'consumable') {
                            // Ajouter le consommable à l'inventaire
                            this.addConsumable(item.consumableType);
                            // Ajouter à la liste des consomables achetés dans cette session
                            this.currentShopPurchasedConsumables.push(item.consumableType);
                        } else {
                            this.unlockBonus(item.bonusId);
                            // Ajouter le bonus à la liste des bonus achetés dans cette session
                            this.currentShopPurchasedBonuses.push(item.bonusId);
                        }
                        this.updateUI();
                        this.updateActiveBonuses(); // Forcer la mise à jour des bonus actifs
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
            // Unités de base (prix augmentés de 75%)
            { type: 'unit', name: 'Épéiste', icon: '⚔️', unitType: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, price: Math.ceil(25 * 1.75), rarity: 'common' },
            { type: 'unit', name: 'Archer', icon: '🏹', unitType: ['Distance', 'Physique'], damage: 4, multiplier: 3, price: Math.ceil(25 * 1.75), rarity: 'common' },
            { type: 'unit', name: 'Magicien Rouge', icon: '🔴', unitType: ['Distance', 'Magique'], damage: 6, multiplier: 2, price: Math.ceil(30 * 1.75), rarity: 'uncommon' },
            { type: 'unit', name: 'Magicien Bleu', icon: '🔵', unitType: ['Corps à corps', 'Magique'], damage: 3, multiplier: 4, price: Math.ceil(30 * 1.75), rarity: 'uncommon' },
            { type: 'unit', name: 'Lancier', icon: '🔱', unitType: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, price: Math.ceil(25 * 1.75), rarity: 'common' },
            { type: 'unit', name: 'Paysan', icon: '👨‍🌾', unitType: ['Corps à corps', 'Physique'], damage: 2, multiplier: 1, price: Math.ceil(20 * 1.75), rarity: 'common' },
            { type: 'unit', name: 'Soigneur', icon: '💚', unitType: ['Soigneur', 'Magique'], damage: 1, multiplier: 1, price: Math.ceil(25 * 1.75), rarity: 'common' },
            { type: 'unit', name: 'Barbare', icon: '🪓', unitType: ['Corps à corps', 'Physique'], damage: 7, multiplier: 1, price: Math.ceil(30 * 1.75), rarity: 'uncommon' },
            { type: 'unit', name: 'Viking', icon: '🛡️', unitType: ['Corps à corps', 'Physique'], damage: 6, multiplier: 2, price: Math.ceil(30 * 1.75), rarity: 'uncommon' },
            { type: 'unit', name: 'Fronde', icon: '🪨', unitType: ['Distance', 'Physique'], damage: 2, multiplier: 5, price: Math.ceil(35 * 1.75), rarity: 'rare' },
            
            // Unités spéciales (prix augmentés de 75%)
            { type: 'unit', name: 'Paladin', icon: '⚜️', unitType: ['Corps à corps', 'Physique'], damage: 8, multiplier: 2, price: Math.ceil(50 * 1.75), rarity: 'rare' },
            { type: 'unit', name: 'Assassin', icon: '🗡️', unitType: ['Corps à corps', 'Physique'], damage: 3, multiplier: 6, price: Math.ceil(50 * 1.75), rarity: 'rare' },
            { type: 'unit', name: 'Mage', icon: '🔮', unitType: ['Distance', 'Magique'], damage: 5, multiplier: 4, price: Math.ceil(50 * 1.75), rarity: 'rare' },
            { type: 'unit', name: 'Chevalier', icon: '🐎', unitType: ['Corps à corps', 'Physique'], damage: 9, multiplier: 1, price: Math.ceil(60 * 1.75), rarity: 'epic' },
            { type: 'unit', name: 'Arbalétrier', icon: '🎯', unitType: ['Distance', 'Physique'], damage: 8, multiplier: 2, price: Math.ceil(60 * 1.75), rarity: 'epic' },
            { type: 'unit', name: 'Sorcier', icon: '🧙‍♂️', unitType: ['Distance', 'Magique'], damage: 4, multiplier: 5, price: Math.ceil(60 * 1.75), rarity: 'epic' },
            { type: 'unit', name: 'Berserker', icon: '😤', unitType: ['Corps à corps', 'Physique'], damage: 10, multiplier: 1, price: Math.ceil(60 * 1.75), rarity: 'epic' },
            { type: 'unit', name: 'Archer d\'Élite', icon: '🎖️', unitType: ['Distance', 'Physique'], damage: 6, multiplier: 4, price: Math.ceil(80 * 1.75), rarity: 'legendary' },
            { type: 'unit', name: 'Mage Suprême', icon: '👑', unitType: ['Distance', 'Magique', 'Corps à corps'], damage: 7, multiplier: 5, price: Math.ceil(100 * 1.75), rarity: 'legendary' },
            { type: 'unit', name: 'Champion', icon: '🏆', unitType: ['Corps à corps', 'Physique', 'Magique'], damage: 12, multiplier: 2, price: Math.ceil(120 * 1.75), rarity: 'legendary' },
            // Bonus - générés dynamiquement à partir des définitions centralisées
            ...Object.keys(bonusDescriptions).map(bonusId => {
                const bonus = bonusDescriptions[bonusId];
                // Prix augmentés de 75% pour équilibrer l'économie
                let price = Math.ceil(50 * 1.75); // Prix par défaut augmenté
                let rarity = 'common'; // Rareté par défaut
                
                // Bonus de base (très abordables)
                if (['gold_bonus', 'corps_a_corps_bonus', 'distance_bonus', 'magique_bonus'].includes(bonusId)) {
                    price = Math.ceil(30 * 1.75);
                    rarity = 'common';
                }
                // Bonus d'équipement communs
                else if (['epee_aiguisee', 'arc_renforce', 'grimoire_magique'].includes(bonusId)) {
                    price = Math.ceil(25 * 1.75);
                    rarity = 'common';
                }
                // Bonus d'équipement rares
                else if (['amulette_force', 'cristal_precision', 'orbe_mystique', 'potion_force', 'elixir_puissance'].includes(bonusId)) {
                    price = Math.ceil(40 * 1.75);
                    rarity = 'uncommon';
                }
                // Bonus d'équipement très rares
                else if (['armure_legendaire', 'arc_divin', 'baguette_supreme'].includes(bonusId)) {
                    price = Math.ceil(60 * 1.75);
                    rarity = 'rare';
                }
                // Bonus légendaires
                else if (['relique_ancienne'].includes(bonusId)) {
                    price = Math.ceil(100 * 1.75);
                    rarity = 'legendary';
                }
                
                
                return {
                    type: 'bonus',
                    name: bonus.name,
                    icon: bonus.icon,
                    description: bonus.description,
                    bonusId: bonusId,
                    price: price,
                    rarity: rarity
                };
            })
        ];
        
        // Ajouter un consommable potentiellement
        const consumableItem = this.addConsumableToShop();
        if (consumableItem) {
            allItems.push(consumableItem);
        }
        
        // Garantir qu'un consommable soit inclus s'il a été généré
        const consumableItems = allItems.filter(item => item.type === 'consumable');
        const nonConsumableItems = allItems.filter(item => item.type !== 'consumable');
        
        // Mélanger les items non-consommables
        const shuffledNonConsumables = nonConsumableItems.sort(() => Math.random() - 0.5);
        
        // Si on a un consommable, l'inclure et prendre 7 autres items
        if (consumableItems.length > 0) {
            const selectedConsumable = consumableItems[0]; // Prendre le premier consommable
            const selectedNonConsumables = shuffledNonConsumables.slice(0, 7);
            return [selectedConsumable, ...selectedNonConsumables];
        } else {
            // Sinon, prendre 8 items normaux
            return shuffledNonConsumables.slice(0, 8);
        }
    }

    // Réinitialiser le magasin
    resetShop() {
        this.currentShopItems = null;
        this.currentShopPurchasedBonuses = [];
        this.currentShopPurchasedUnits = [];
        this.currentShopPurchasedConsumables = [];
    }

    // Rafraîchir le magasin
    refreshShop() {
        const cost = this.shopRefreshCost;
        
        if (this.gold >= cost) {
            // Dépenser l'or
            this.spendGold(cost);
            
            // Réinitialiser le magasin
            this.currentShopItems = null;
            this.currentShopPurchasedBonuses = [];
            
            // Augmenter le coût pour le prochain rafraîchissement
            this.shopRefreshCount++;
            this.shopRefreshCost = 10 + (this.shopRefreshCount * 5);
            
            // Mettre à jour l'affichage
            this.updatePreCombatShop();
            this.updateUI();
            
            // Notification de succès
            //this.showNotification(`Magasin rafraîchi pour ${cost}💰 !`, 'success');
        } else {
            this.showNotification(`Or insuffisant ! Coût : ${cost}💰`, 'error');
        }
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
            guildName: this.guildName,
            availableTroops: this.availableTroops,
            selectedTroops: this.selectedTroops,
            combatTroops: this.combatTroops,
            usedTroopsThisRank: this.usedTroopsThisRank,
            combatHistory: this.combatHistory,
            isFirstTime: this.isFirstTime,
            unlockedBonuses: this.unlockedBonuses,
            currentCombat: this.currentCombat,
            currentShopItems: this.currentShopItems,
            gameStats: this.gameStats,
            consumables: this.consumables,
            transformedBaseUnits: this.transformedBaseUnits,
            synergyLevels: this.synergyLevels
        };
        
        localStorage.setItem('guildMasterSave', JSON.stringify(saveData));
        // this.showNotification('Partie sauvegardée !', 'success');
    }

    load() {
        const saveData = localStorage.getItem('guildMasterSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            Object.assign(this, data);
            
            // Initialiser les statistiques si pas présentes
            if (!this.gameStats) {
                this.gameStats = {
                    combatsPlayed: 0,
                    combatsWon: 0,
                    combatsLost: 0,
                    goldSpent: 0,
                    goldEarned: 0,
                    unitsPurchased: 0,
                    bonusesPurchased: 0,
                    unitsUsed: {},
                    maxDamageInTurn: 0,
                    bestTurnDamage: 0,
                    bestTurnRound: 0,
                    totalDamageDealt: 0,
                    highestRank: 'F-',
                    startTime: Date.now()
                };
            }
            
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
        
        // Initialiser les bonus achetés dans la session si pas présent
        if (!this.currentShopPurchasedBonuses) {
            this.currentShopPurchasedBonuses = [];
        }
        
        // Initialiser les variables de rafraîchissement si pas présentes
        if (typeof this.shopRefreshCount === 'undefined') {
            this.shopRefreshCount = 0;
        }
        if (typeof this.shopRefreshCost === 'undefined') {
            this.shopRefreshCost = 10;
        }
        
                    // Initialiser le boss d'affichage si pas présent
            if (!this.displayBoss) {
                this.displayBoss = null;
            }
            
            // Initialiser les consomables si pas présents
            if (!this.consumables) {
                this.consumables = [];
            }
            
            // Initialiser les unités de base transformées si pas présentes
            if (!this.transformedBaseUnits) {
                this.transformedBaseUnits = {};
            }
            
            // Initialiser les niveaux de synergies si pas présents
            if (!this.synergyLevels) {
                this.synergyLevels = {
                    'Formation Corps à Corps': 1,
                    'Formation Distance': 1,
                    'Formation Magique': 1,
                    'Horde Corps à Corps': 1,
                    'Volée de Flèches': 1,
                    'Tempête Magique': 1,
                    'Tactique Mixte': 1,
                    'Force Physique': 1
                };
            }
            
            // Nettoyer les bonus invalides au chargement
            this.cleanInvalidBonuses();
            
            this.updateUI();
            this.updateConsumablesDisplay();
            
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
        this.guildName = 'Guilde d\'Aventuriers';
        this.availableTroops = [];
        this.selectedTroops = [];
        this.combatTroops = [];
        this.usedTroopsThisRank = [];
        this.combatHistory = [];
        this.isFirstTime = true;
        this.unlockedBonuses = [];
        this.consumables = [];
        this.transformedBaseUnits = {};
        this.synergyLevels = {
            'Formation Corps à Corps': 1,
            'Formation Distance': 1,
            'Formation Magique': 1,
            'Horde Corps à Corps': 1,
            'Volée de Flèches': 1,
            'Tempête Magique': 1,
            'Tactique Mixte': 1,
            'Force Physique': 1
        };
        
        // Réinitialiser les variables de rafraîchissement du magasin
        this.shopRefreshCount = 0;
        this.shopRefreshCost = 10;
        // Initialiser les listes d'achats de la session de magasin
        this.currentShopPurchasedUnits = [];
        this.currentShopPurchasedConsumables = [];
        
        // Réinitialiser les statistiques
        this.gameStats = {
            combatsPlayed: 0,
            combatsWon: 0,
            combatsLost: 0,
            goldSpent: 0,
            goldEarned: 0,
            unitsPurchased: 0,
            bonusesPurchased: 0,
            unitsUsed: {},
            maxDamageInTurn: 0,
            bestTurnDamage: 0,
            bestTurnRound: 0,
            totalDamageDealt: 0,
            highestRank: 'F-',
            startTime: Date.now()
        };
        
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
        this.updateConsumablesDisplay();
        
        // Tirer les premières troupes pour le combat
        this.drawCombatTroops();
    }

    // === SYSTÈME DE CONSOMMABLES ===

    // Ajouter un consommable à l'inventaire
    addConsumable(consumableType) {
        // Limite de 3 consommables
        if (this.consumables.length >= 3) {
            this.showNotification('Inventaire de consommables plein (3 max) !', 'error');
            return;
        }
        const consumableTemplate = this.CONSUMABLES_TYPES[consumableType];
        if (!consumableTemplate) {
            console.error(`Type de consommable inconnu: ${consumableType}`);
            return;
        }

        const consumable = {
            id: `${consumableType}_${Date.now()}_${Math.random()}`,
            type: consumableType,
            name: consumableTemplate.name,
            description: consumableTemplate.description,
            icon: consumableTemplate.icon,
            effect: consumableTemplate.effect
        };

        this.consumables.push(consumable);
        //this.showNotification(`${consumable.name} ajouté à l'inventaire !`, 'success');
        this.updateConsumablesDisplay();
    }

    // Utiliser un consommable
    useConsumable(consumableId) {
        const consumableIndex = this.consumables.findIndex(c => c.id === consumableId);
        if (consumableIndex === -1) {
            console.error(`Consommable non trouvé: ${consumableId}`);
            return false;
        }

        const consumable = this.consumables[consumableIndex];
        
        // Exécuter l'effet du consommable
        const success = this.executeConsumableEffect(consumable);
        
        if (success) {
            // Pour les consommables qui ne nécessitent pas d'action supplémentaire, les supprimer immédiatement
            if (consumable.effect !== 'transformUnit') {
                this.consumables.splice(consumableIndex, 1);
                this.updateConsumablesDisplay();
            }
            // Pour l'épée de transformation, le consommable sera supprimé après la transformation effective
           // this.showNotification(`${consumable.name} utilisé !`, 'success');
            return true;
        } else {
            this.showNotification('Impossible d\'utiliser ce consommable !', 'error');
            return false;
        }
    }

    // Exécuter l'effet d'un consommable
    executeConsumableEffect(consumable) {
        switch (consumable.effect) {
            case 'refreshShop':
                // Relancer le magasin gratuitement
                this.shopRefreshCount = 0; // Réinitialiser le compteur
                this.shopRefreshCost = 10; // Réinitialiser le coût
                this.resetShop();
                this.generateShopItems();
                this.updatePreCombatShop();
                return true;
            
            case 'transformUnit':
                // Ouvrir la modal des troupes existante pour la transformation
                this.showAllTroops();
                const targetUnitName = consumable.targetUnit || 'Épéiste';
                //this.showNotification(`Sélectionnez une unité dans la liste pour la transformer en ${targetUnitName} !`, 'info');
                return true;
            
            case 'upgradeSynergy':
                // Ouvrir une modal pour sélectionner quelle synergie améliorer
                this.showSynergyUpgradeModal();
                return true;
            
            default:
                console.error(`Effet de consommable inconnu: ${consumable.effect}`);
                return false;
        }
    }

    // Afficher les consomables dans l'interface
    updateConsumablesDisplay() {
        const consumablesContainer = document.getElementById('consumables-display');
        if (!consumablesContainer) {
            return;
        }

        consumablesContainer.innerHTML = '';

        // Ajouter le titre avec le compteur
        const titleElement = document.createElement('div');
        titleElement.className = 'consumables-title';
        titleElement.innerHTML = `
            <h4>Consommables (${this.consumables.length}/3)</h4>
        `;
        consumablesContainer.appendChild(titleElement);

        if (this.consumables.length === 0) {
            const noConsumablesElement = document.createElement('div');
            noConsumablesElement.className = 'no-consumables';
            noConsumablesElement.innerHTML = '<p>Aucun consommable disponible</p>';
            consumablesContainer.appendChild(noConsumablesElement);
            return;
        }

        this.consumables.forEach(consumable => {
            const consumableElement = document.createElement('div');
            consumableElement.className = 'consumable-item';
            consumableElement.innerHTML = `
                <div class="consumable-icon">${consumable.icon}</div>
                <div class="consumable-info">
                    <div class="consumable-name">${consumable.name}</div>
                    <div class="consumable-description">${consumable.description}</div>
                </div>
                <button class="use-consumable-btn" data-consumable-id="${consumable.id}">
                    Utiliser
                </button>
            `;
            
            // Ajouter l'événement click au bouton
            const useButton = consumableElement.querySelector('.use-consumable-btn');
            useButton.addEventListener('click', () => {
                this.useConsumable(consumable.id);
            });
            
            consumablesContainer.appendChild(consumableElement);
        });
    }

    // Ajouter un consommable au magasin
    addConsumableToShop() {
        // 80% de chance d'avoir un consommable dans le magasin (augmenté pour plus de visibilité)
        if (Math.random() < 0.8) {
            const consumableTypes = Object.keys(this.CONSUMABLES_TYPES);
            
            // 25% de chance d'avoir spécifiquement le consommable d'amélioration de synergie
            if (Math.random() < 0.25) {
                const consumableTemplate = this.CONSUMABLES_TYPES['upgradeSynergy'];
                return {
                    type: 'consumable',
                    id: `consumable_upgradeSynergy`,
                    name: consumableTemplate.name,
                    description: consumableTemplate.description,
                    icon: consumableTemplate.icon,
                    price: consumableTemplate.price,
                    consumableType: 'upgradeSynergy'
                };
            } else {
                // Sinon, sélectionner aléatoirement parmi tous les autres consommables
                const otherTypes = consumableTypes.filter(type => type !== 'upgradeSynergy');
                const randomType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
                const consumableTemplate = this.CONSUMABLES_TYPES[randomType];
                
                return {
                    type: 'consumable',
                    id: `consumable_${randomType}`,
                    name: consumableTemplate.name,
                    description: consumableTemplate.description,
                    icon: consumableTemplate.icon,
                    price: consumableTemplate.price,
                    consumableType: randomType
                };
            }
        }
        return null;
    }



    // Récupérer toutes les troupes disponibles dans le jeu
    getAllAvailableTroops() {
        return [
            // Unités de base
            { name: 'Épéiste', icon: '⚔️', unitType: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, rarity: 'common' },
            { name: 'Archer', icon: '🏹', unitType: ['Distance', 'Physique'], damage: 4, multiplier: 3, rarity: 'common' },
            { name: 'Magicien Rouge', icon: '🔴', unitType: ['Distance', 'Magique'], damage: 6, multiplier: 2, rarity: 'uncommon' },
            { name: 'Magicien Bleu', icon: '🔵', unitType: ['Corps à corps', 'Magique'], damage: 3, multiplier: 4, rarity: 'uncommon' },
            { name: 'Lancier', icon: '🔱', unitType: ['Corps à corps', 'Physique'], damage: 4, multiplier: 3, rarity: 'common' },
            { name: 'Paysan', icon: '👨‍🌾', unitType: ['Corps à corps', 'Physique'], damage: 2, multiplier: 1, rarity: 'common' },
            { name: 'Soigneur', icon: '💚', unitType: ['Soigneur', 'Magique'], damage: 1, multiplier: 1, rarity: 'common' },
            { name: 'Soigneur', icon: '💚', unitType: ['Soigneur', 'Magique'], damage: 1, multiplier: 1, rarity: 'common' },
            { name: 'Barbare', icon: '🪓', unitType: ['Corps à corps', 'Physique'], damage: 7, multiplier: 1, rarity: 'uncommon' },
            { name: 'Viking', icon: '🛡️', unitType: ['Corps à corps', 'Physique'], damage: 6, multiplier: 2, rarity: 'uncommon' },
            { name: 'Fronde', icon: '🪨', unitType: ['Distance', 'Physique'], damage: 2, multiplier: 5, rarity: 'rare' },
            
            // Unités spéciales
            { name: 'Paladin', icon: '⚜️', unitType: ['Corps à corps', 'Physique'], damage: 8, multiplier: 2, rarity: 'rare' },
            { name: 'Assassin', icon: '🗡️', unitType: ['Corps à corps', 'Physique'], damage: 3, multiplier: 6, rarity: 'rare' },
            { name: 'Mage', icon: '🔮', unitType: ['Distance', 'Magique'], damage: 5, multiplier: 4, rarity: 'rare' },
            { name: 'Chevalier', icon: '🐎', unitType: ['Corps à corps', 'Physique'], damage: 9, multiplier: 1, rarity: 'epic' },
            { name: 'Arbalétrier', icon: '🎯', unitType: ['Distance', 'Physique'], damage: 8, multiplier: 2, rarity: 'epic' },
            { name: 'Sorcier', icon: '🧙‍♂️', unitType: ['Distance', 'Magique'], damage: 4, multiplier: 5, rarity: 'epic' },
            { name: 'Berserker', icon: '😤', unitType: ['Corps à corps', 'Physique'], damage: 10, multiplier: 1, rarity: 'epic' },
            { name: 'Archer d\'Élite', icon: '🎖️', unitType: ['Distance', 'Physique'], damage: 6, multiplier: 4, rarity: 'legendary' },
            { name: 'Mage Suprême', icon: '👑', unitType: ['Distance', 'Magique', 'Corps à corps'], damage: 7, multiplier: 5, rarity: 'legendary' },
            { name: 'Champion', icon: '🏆', unitType: ['Corps à corps', 'Physique', 'Magique'], damage: 12, multiplier: 2, rarity: 'legendary' }
        ];
    }



    // Transformer une unité depuis la modal des troupes
    transformUnitFromModal(fromUnitName, toUnitName) {
        // Vérifier si l'utilisateur a un consommable de transformation approprié
        const transformConsumables = this.consumables.filter(c => 
            c.type === 'transformSword' || 
            c.type === 'transformArcher' || 
            c.type === 'transformLancier' ||
            c.type === 'transformPaysan' ||
            c.type === 'transformMagicienBleu' ||
            c.type === 'transformMagicienRouge' ||
            c.type === 'transformBarbare' ||
            c.type === 'transformSorcier' ||
            c.type === 'transformFronde' ||
            c.type === 'upgradeSynergy'
        );
        
        if (transformConsumables.length === 0) {
            this.showNotification('Vous devez posséder un consommable de transformation pour transformer des unités !', 'error');
            return;
        }

        // Vérifier si l'unité source existe
        const sourceTroops = this.availableTroops.filter(troop => troop.name === fromUnitName);
        const baseUnit = this.BASE_UNITS.find(unit => unit.name === fromUnitName);
        
        // Si c'est une unité de base
        if (baseUnit) {
            // Initialiser le compteur si nécessaire
            if (!this.transformedBaseUnits[fromUnitName]) {
                this.transformedBaseUnits[fromUnitName] = 0;
            }
            
            // Vérifier qu'on n'a pas déjà transformé toutes les unités de base
            if (this.transformedBaseUnits[fromUnitName] >= 5) {
                this.showNotification(`Vous avez déjà transformé toutes vos unités ${fromUnitName} !`, 'error');
                return;
            }
            
            // Incrémenter le compteur de transformation
            this.transformedBaseUnits[fromUnitName]++;
        } else if (sourceTroops.length === 0) {
            this.showNotification(`Aucune unité "${fromUnitName}" trouvée !`, 'error');
            return;
        }

        // Trouver l'unité cible dans toutes les unités disponibles
        const allAvailableUnits = [...this.BASE_UNITS, ...this.getAllAvailableTroops()];
        const targetUnit = allAvailableUnits.find(unit => unit.name === toUnitName);
        if (!targetUnit) {
            this.showNotification(`Unité cible "${toUnitName}" non trouvée !`, 'error');
            return;
        }

        // Supprimer une unité source si c'est une unité achetée
        if (!baseUnit) {
            const sourceTroopIndex = this.availableTroops.findIndex(troop => troop.name === fromUnitName);
            if (sourceTroopIndex !== -1) {
                this.availableTroops.splice(sourceTroopIndex, 1);
            } else {
                this.showNotification(`Impossible de transformer cette unité !`, 'error');
                return;
            }
        }

        // Ajouter l'unité cible
        this.availableTroops.push({...targetUnit, id: `${targetUnit.name}_${Date.now()}`});

        // Consommer le consommable de transformation approprié (prendre le premier disponible)
        const consumableIndex = this.consumables.findIndex(c => 
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
        if (consumableIndex !== -1) {
            this.consumables.splice(consumableIndex, 1);
        }

        // Jouer l'animation de transformation
        this.playTransformAnimation(fromUnitName, toUnitName);

        // Mettre à jour l'affichage
        this.updateUI();
        this.updateConsumablesDisplay();

        // Fermer la modal des troupes
        const troopsModal = document.getElementById('troops-modal');
        if (troopsModal) {
            troopsModal.style.display = 'none';
        }

        //this.showNotification(`${fromUnitName} a été transformé en ${toUnitName} !`, 'success');
    }

    // Obtenir l'icône d'une unité par son nom
    getUnitIcon(unitName) {
        const allUnits = [...this.BASE_UNITS, ...this.getAllAvailableTroops()];
        const unit = allUnits.find(u => u.name === unitName);
        return unit ? unit.icon : '❓';
    }

    // Afficher la modal d'amélioration de synergie
    showSynergyUpgradeModal() {
        const modal = document.createElement('div');
        modal.id = 'synergy-upgrade-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💎 Améliorer une Synergie</h3>
                    <span class="close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Sélectionnez une synergie à améliorer :</p>
                    <div id="synergy-upgrade-list"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Afficher la liste des synergies disponibles
        this.updateSynergyUpgradeList();
        
        // Afficher la modal
        modal.style.display = 'block';
    }
    
    // Mettre à jour la liste des synergies pour l'amélioration
    updateSynergyUpgradeList() {
        const container = document.getElementById('synergy-upgrade-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const synergyNames = Object.keys(this.synergyLevels);
        
        synergyNames.forEach(synergyName => {
            const currentLevel = this.synergyLevels[synergyName];
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
                this.upgradeSynergy(synergyName);
            });
            
            container.appendChild(synergyElement);
        });
    }
    
    // Améliorer une synergie
    upgradeSynergy(synergyName) {
        if (!this.synergyLevels[synergyName]) {
            this.synergyLevels[synergyName] = 1;
        }
        
        this.synergyLevels[synergyName]++;
        
        // Consommer le consommable
        const consumableIndex = this.consumables.findIndex(c => c.type === 'upgradeSynergy');
        if (consumableIndex !== -1) {
            this.consumables.splice(consumableIndex, 1);
        }
        
        // Fermer la modal
        const modal = document.getElementById('synergy-upgrade-modal');
        if (modal) {
            modal.remove();
        }
        
        // Mettre à jour l'affichage
        this.updateUI();
        this.updateConsumablesDisplay();
        
        // Notification de succès
        this.showNotification(`${synergyName} améliorée au niveau ${this.synergyLevels[synergyName]} !`, 'success');
    }

    // Animation de transformation
    playTransformAnimation(fromUnitName, toUnitName) {
        // Créer l'élément d'animation
        const animationElement = document.createElement('div');
        animationElement.className = 'transform-animation';
        animationElement.innerHTML = `
            <div class="transform-content">
                <div class="transform-from">${this.getUnitIcon(fromUnitName)} ${fromUnitName}</div>
                <div class="transform-arrow">➜</div>
                <div class="transform-to">${this.getUnitIcon(toUnitName)} ${toUnitName}</div>
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