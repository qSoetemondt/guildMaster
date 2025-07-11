// Système de combat
class CombatSystem {
    constructor() {
        this.currentCombat = null;
        this.combatLog = [];
        this.isBossFight = false;
    }

    // Définir les combats prédéfinis
    static COMBATS = {
        'F-': [
            { name: 'Gobelin', targetDamage: 50, reward: { gold: 25, reputation: 5 } },
            { name: 'Loup', targetDamage: 75, reward: { gold: 30, reputation: 7 } },
            { name: 'Bandit', targetDamage: 100, reward: { gold: 35, reputation: 10 } }
        ],
        'F': [
            { name: 'Orc', targetDamage: 125, reward: { gold: 40, reputation: 12 } },
            { name: 'Troll', targetDamage: 150, reward: { gold: 45, reputation: 15 } },
            { name: 'Géant', targetDamage: 200, reward: { gold: 50, reputation: 20 } }
        ],
        'F+': [
            { name: 'Dragonnet', targetDamage: 250, reward: { gold: 60, reputation: 25 } },
            { name: 'Démon Mineur', targetDamage: 300, reward: { gold: 70, reputation: 30 } },
            { name: 'Hydre', targetDamage: 400, reward: { gold: 80, reputation: 35 } }
        ]
        // Les autres rangs suivent le même pattern...
    };

    // Définir les boss
    static BOSSES = [
        {
            name: 'Golem de Pierre',
            targetDamage: 500,
            reward: { gold: 100, reputation: 50 },
            mechanic: 'ranged_weakness',
            description: 'Les unités à distance font 50% moins de dégâts'
        },
        {
            name: 'Seigneur des Ombres',
            targetDamage: 600,
            reward: { gold: 120, reputation: 60 },
            mechanic: 'melee_weakness',
            description: 'Les unités corps à corps voient leur multiplicateur réduit de 50%'
        },
        {
            name: 'Dragon Ancien',
            targetDamage: 800,
            reward: { gold: 150, reputation: 75 },
            mechanic: 'magic_weakness',
            description: 'Les unités magiques font 30% moins de dégâts'
        },
        {
            name: 'Démon Suprême',
            targetDamage: 1000,
            reward: { gold: 200, reputation: 100 },
            mechanic: 'all_weakness',
            description: 'Toutes les unités font 25% moins de dégâts'
        },
        {
            name: 'Titan',
            targetDamage: 1200,
            reward: { gold: 250, reputation: 125 },
            mechanic: 'high_health',
            description: 'Objectif de dégâts très élevé'
        }
    ];

    // Démarrer un combat
    startCombat(isBossFight = false) {
        this.isBossFight = isBossFight;
        this.combatLog = [];
        
        if (isBossFight) {
            // Sélectionner un boss aléatoire
            this.currentCombat = CombatSystem.BOSSES[Math.floor(Math.random() * CombatSystem.BOSSES.length)];
        } else {
            // Sélectionner un combat normal selon le rang
            const availableCombats = CombatSystem.COMBATS[gameState.rank] || CombatSystem.COMBATS['F-'];
            this.currentCombat = availableCombats[Math.floor(Math.random() * availableCombats.length)];
        }

        // Mettre à jour l'interface
        this.updateCombatUI();
        
        // Démarrer le combat automatiquement
        this.executeCombat();
    }

    // Exécuter le combat
    async executeCombat() {
        const targetDamage = this.currentCombat.targetDamage;
        let totalDamage = 0;
        let round = 1;
        const maxRounds = 10; // Limite de manches

        // Appliquer les mécaniques de boss
        const bossMechanic = this.isBossFight ? this.currentCombat.mechanic : null;
        const enhancedTroops = this.applyBossMechanic(gameState.selectedTroops, bossMechanic);

        this.addCombatLog(`Combat contre ${this.currentCombat.name} !`, 'info');
        this.addCombatLog(`Objectif: ${targetDamage} dégâts`, 'info');

        if (bossMechanic) {
            this.addCombatLog(`Mécanique spéciale: ${this.currentCombat.description}`, 'warning');
        }

        while (totalDamage < targetDamage && round <= maxRounds) {
            this.addCombatLog(`--- Manche ${round} ---`, 'round');
            
            let roundDamage = 0;
            
            // Chaque unité attaque
            for (let i = 0; i < enhancedTroops.length; i++) {
                const troop = enhancedTroops[i];
                const damage = this.calculateTroopDamage(troop, bossMechanic, enhancedTroops);
                roundDamage += damage;
                
                this.addCombatLog(`${troop.name} inflige ${damage} dégâts`, 'damage');
                
                // Petite pause pour l'animation
                await this.sleep(500);
            }

            totalDamage += roundDamage;
            this.addCombatLog(`Manche ${round}: ${roundDamage} dégâts totaux`, 'synergy');
            this.addCombatLog(`Progression: ${totalDamage}/${targetDamage}`, 'info');
            
            // Mettre à jour la barre de progression
            this.updateProgressBar(totalDamage, targetDamage);
            
            round++;
            
            // Pause entre les manches
            await this.sleep(1000);
        }

        // Résultat du combat
        if (totalDamage >= targetDamage) {
            this.combatVictory(totalDamage);
        } else {
            this.combatDefeat(totalDamage);
        }
    }

    // Appliquer les mécaniques de boss
    applyBossMechanic(troops, mechanic) {
        if (!mechanic) return troops;

        return troops.map(troop => {
            const enhancedTroop = { ...troop };
            
            switch (mechanic) {
                case 'ranged_weakness':
                    if (troop.type === 'Distance') {
                        enhancedTroop.damage = Math.floor(troop.damage * 0.5);
                    }
                    break;
                    
                case 'melee_weakness':
                    if (troop.type === 'Corps à corps') {
                        enhancedTroop.multiplier = Math.floor(troop.multiplier * 0.5);
                    }
                    break;
                    
                case 'magic_weakness':
                    if (troop.type === 'Magique') {
                        enhancedTroop.damage = Math.floor(troop.damage * 0.7);
                    }
                    break;
                    
                case 'all_weakness':
                    enhancedTroop.damage = Math.floor(troop.damage * 0.75);
                    break;
            }
            
            return enhancedTroop;
        });
    }

    // Calculer les dégâts d'une unité
    calculateTroopDamage(troop, bossMechanic = null, troopsList = null) {
        let damage = troop.damage;
        let multiplier = troop.multiplier;
        
        // BONUS SOIGNEUR : chaque soigneur sélectionné donne +1 dégâts à tous
        const selectedTroops = troopsList || gameState.selectedTroops || [];
        const healerCount = selectedTroops.filter(t => Array.isArray(t.type) ? t.type.includes('Soigneur') : t.type === 'Soigneur').length;
        if (healerCount > 0) {
            damage += healerCount;
        }
        
        // Appliquer les synergies d'équipe
        const synergies = gameState.calculateSynergies();
        synergies.forEach(synergy => {
            if (synergy.bonus.target === troop.type || !synergy.bonus.target) {
                if (synergy.bonus.damage) {
                    damage += synergy.bonus.damage;
                }
                if (synergy.bonus.multiplier) {
                    multiplier += synergy.bonus.multiplier;
                }
            }
        });
        
        // Appliquer les mécaniques de boss (déjà fait dans applyBossMechanic)
        
        return damage * multiplier;
    }

    // Victoire au combat
    combatVictory(totalDamage) {
        this.addCombatLog(`🎉 VICTOIRE ! ${totalDamage} dégâts infligés`, 'victory');
        
        // Donner les récompenses
        const reward = this.currentCombat.reward;
        gameState.addGold(reward.gold);
        
        // Ajouter de la progression
        const progressGain = this.isBossFight ? 50 : 25;
        gameState.addProgress(progressGain);
        
        this.addCombatLog(`Progression: +${progressGain} points`, 'reward');
        
        // Afficher l'encadré de victoire
        this.showVictorySummary(reward.gold, progressGain);
        
        // Afficher le magasin après un délai
        setTimeout(() => {
            hideModal('combat-modal');
            setTimeout(() => {
                showModal('shop-modal');
                initShop();
            }, 500);
        }, 5000); // Délai augmenté pour laisser le temps de voir l'encadré
    }

    // Afficher l'encadré de victoire
    showVictorySummary(goldEarned, progressGain) {
        // Créer l'encadré de victoire
        const victoryBox = document.createElement('div');
        victoryBox.className = 'victory-summary-box';
        victoryBox.innerHTML = `
            <div class="victory-summary-content">
                <h3>🎉 Victoire !</h3>
                <div class="victory-rewards">
                    <p>Vous avez gagné <strong>${goldEarned} or</strong></p>
                    <p>Vous passez au rang : <strong>${gameState.rank}</strong></p>
                </div>
            </div>
        `;
        
        // Ajouter l'encadré à la modal de combat
        const combatModal = document.getElementById('combat-modal');
        const modalBody = combatModal.querySelector('.modal-body');
        modalBody.appendChild(victoryBox);
        
        // Animation d'apparition
        setTimeout(() => {
            victoryBox.classList.add('show');
        }, 100);
    }

    // Défaite au combat
    combatDefeat(totalDamage) {
        this.addCombatLog(`💀 DÉFAITE ! Seulement ${totalDamage} dégâts infligés`, 'defeat');
        this.addCombatLog('Les troupes reviennent à la guilde...', 'info');
        
        // Pas de récompense, mais pas de pénalité non plus
        
        setTimeout(() => {
            hideModal('combat-modal');
        }, 3000);
    }

    // Ajouter une entrée au log de combat
    addCombatLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        
        const combatLog = document.getElementById('combat-log');
        combatLog.appendChild(logEntry);
        combatLog.scrollTop = combatLog.scrollHeight;
        
        this.combatLog.push({ message, type, timestamp: Date.now() });
    }

    // Mettre à jour la barre de progression
    updateProgressBar(current, target) {
        const progressFill = document.getElementById('combat-progress');
        const percentage = Math.min((current / target) * 100, 100);
        progressFill.style.width = `${percentage}%`;
    }

    // Mettre à jour l'interface de combat
    updateCombatUI() {
        document.getElementById('combat-target').textContent = this.currentCombat.targetDamage;
        document.getElementById('combat-progress').style.width = '0%';
        
        // Vider le log
        document.getElementById('combat-log').innerHTML = '';
        
        // Mettre à jour le titre
        const modalHeader = document.querySelector('#combat-modal .modal-header h3');
        if (this.isBossFight) {
            modalHeader.textContent = `Boss: ${this.currentCombat.name}`;
        } else {
            modalHeader.textContent = `Combat: ${this.currentCombat.name}`;
        }
    }

    // Fonction utilitaire pour les pauses
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instance globale du système de combat
const combatSystem = new CombatSystem();

// Fonction pour démarrer un combat (appelée depuis game.js)
function startCombat() {
    // Vérifier si c'est un combat de boss (pour passer de rang)
    const currentRankIndex = GameState.RANKS.indexOf(gameState.rank);
    const isBossFight = gameState.rankProgress >= gameState.rankTarget - 25; // Boss quand proche du rang supérieur
    
    combatSystem.startCombat(isBossFight);
}

// Fonction pour initialiser le recrutement
function initRecruitment() {
    const container = document.getElementById('recruit-options');
    container.innerHTML = '';
    
    // Générer 3 options de recrutement
    const options = getRandomUnits(3, gameState.rank);
    
    options.forEach((unit, index) => {
        const option = document.createElement('div');
        
        // Ajouter la classe de rareté
        const rarityClass = unit.rarity ? `rarity-${unit.rarity}` : '';
        option.className = `recruit-option ${rarityClass}`;
        
        option.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">${unit.icon}</div>
            <div style="font-weight: 600; margin-bottom: 5px;">${unit.name}</div>
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">${unit.type}</div>
            <div style="font-size: 0.8rem; margin-bottom: 10px;">${unit.damage} dmg ×${unit.multiplier}</div>
            <div style="font-size: 0.8rem; color: #666; font-style: italic;">${unit.description}</div>
            <div style="margin-top: 10px; font-weight: 600; color: ${getRarityColor(unit.rarity)}; font-size: 0.8rem;">
                ${getRarityIcon(unit.rarity)} ${unit.rarity.toUpperCase()}
            </div>
        `;
        
        option.addEventListener('click', () => {
            // Retirer la sélection des autres options
            document.querySelectorAll('.recruit-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Sélectionner cette option
            option.classList.add('selected');
            
            // Ajouter l'unité après un délai
            setTimeout(() => {
                gameState.addTroop(unit);
                hideModal('recruit-modal');
                gameState.showNotification(`${unit.name} recruté !`, 'success');
            }, 500);
        });
        
        container.appendChild(option);
    });
} 