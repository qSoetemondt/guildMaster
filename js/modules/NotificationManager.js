// Gestionnaire de notifications pour GuildMaster
export class NotificationManager {
    constructor() {
        this.notificationQueue = [];
        this.isProcessingNotifications = false;
    }

    // Afficher une notification
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
    
    // === MÉTHODES SPÉCIALISÉES ===
    
    // Notifications de combat
    showBossFight(bossName, mechanic) {
        this.showNotification(`BOSS: ${bossName} ! ${mechanic}`, 'error');
    }
    
    showVictory() {
        this.showNotification('🎉 Victoire !', 'success');
    }
    
    showDefeat() {
        this.showNotification('💀 Défaite !', 'error');
    }
    
    showRankGained(newRank) {
        this.showNotification(`Rang gagné ! Nouveau rang: ${newRank}`, 'success');
    }
    
    showCombatError(message) {
        this.showNotification(message, 'error');
    }
    
    // Notifications d'or et économie
    showGoldAdded(amount) {
        this.showNotification(`+${amount} or ajouté !`, 'success');
    }
    
    showGoldSet(amount) {
        this.showNotification(`Or défini à ${amount} !`, 'success');
    }
    
    showInsufficientGold(cost) {
        this.showNotification(`Or insuffisant ! Coût : ${cost}💰`, 'error');
    }
    
    // Notifications d'unités
    showUnitAdded(unitName) {
        this.showNotification(`+1 ${unitName} ajouté à votre collection !`, 'success');
    }
    
    showUnitError(message) {
        this.showNotification(message, 'error');
    }
    
    showUnitSelectionError(message) {
        this.showNotification(message, 'error');
    }
    
    showUnitUsedError(message) {
        this.showNotification(message, 'error');
    }
    
    // Notifications de magasin
    showShopRefreshed() {
        this.showNotification('Magasin rafraîchi !', 'success');
    }
    
    showShopError(message) {
        this.showNotification(message, 'error');
    }
    
    // Notifications de bonus
    showBonusUnlocked() {
        this.showNotification('Bonus débloqué !', 'success');
    }
    
    showBonusSold(bonusName, sellPrice) {
        this.showNotification(`${bonusName} vendu pour ${sellPrice}💰 !`, 'success');
    }
    
    showAllBonusesUnlocked() {
        this.showNotification('Tous les bonus débloqués !', 'success');
    }
    
    showSynergyUpgraded(synergyName, level) {
        this.showNotification(`${synergyName} améliorée au niveau ${level} !`, 'success');
    }
    
    // Notifications de consommables
    showConsumableError(message) {
        this.showNotification(message, 'error');
    }
    
    showConsumableAdded(consumableName) {
        this.showNotification(`${consumableName} ajouté à l'inventaire !`, 'success');
    }
    
    showConsumableUsed(consumableName) {
        this.showNotification(`${consumableName} utilisé !`, 'success');
    }
    
    // Notifications de sauvegarde
    showGameSaved() {
        this.showNotification('Partie sauvegardée !', 'success');
    }
    
    showGameLoaded() {
        this.showNotification('Partie chargée !', 'success');
    }
    
    showNewGameCreated(guildName) {
        this.showNotification(`Nouvelle partie créée : ${guildName}`, 'success');
    }
    
    showNoSaveFound() {
        this.showNotification('Aucune sauvegarde trouvée', 'error');
    }
    
    // Notifications de tutoriel
    showTutorialCompleted() {
        this.showNotification('Tutoriel terminé ! Bonne chance !', 'success');
    }
    
    // Notifications d'interface
    showInputError(message) {
        this.showNotification(message, 'error');
    }
    
    showActionRequired(message) {
        this.showNotification(message, 'error');
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
        
        // Trouver la section de combat pour positionner la notification
        const combatSection = document.getElementById('combat-section');
        const preCombatSection = document.getElementById('pre-combat-section');
        
        let targetSection = null;
        if (combatSection && combatSection.style.display !== 'none') {
            targetSection = combatSection;
        } else if (preCombatSection && preCombatSection.style.display !== 'none') {
            targetSection = preCombatSection;
        }
        
        let topPosition = '20px';
        if (targetSection) {
            const rect = targetSection.getBoundingClientRect();
            topPosition = `${rect.top + 20}px`;
        }
        
        notification.style.cssText = `
            position: fixed;
            top: ${topPosition};
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
} 