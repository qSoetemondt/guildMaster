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
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('combat.bossFight', { bossName, mechanic }) : 
            `BOSS: ${bossName} ! ${mechanic}`;
        this.showNotification(message, 'error');
    }
    
    showVictory() {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('combat.victory') : 
            '🎉 Victoire !';
        this.showNotification(message, 'success');
    }
    
    showDefeat() {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('combat.defeat') : 
            '💀 Défaite !';
        this.showNotification(message, 'error');
    }
    
    showRankGained(newRank) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.rankGained', { rank: newRank }) : 
            `Rang gagné ! Nouveau rang: ${newRank}`;
        this.showNotification(message, 'success');
    }
    
    showCombatError(message) {
        this.showNotification(message, 'error');
    }
    
    // Notifications d'or et économie
    showGoldAdded(amount) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.goldAdded', { amount }) : 
            `+${amount} or ajouté !`;
        this.showNotification(message, 'success');
    }
    
    showGoldSet(amount) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.goldSet', { amount }) : 
            `Or défini à ${amount} !`;
        this.showNotification(message, 'success');
    }
    
    showInsufficientGold(cost) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.insufficientGold', { cost }) : 
            `Or insuffisant ! Coût : ${cost}💰`;
        this.showNotification(message, 'error');
    }
    
    // Notifications d'unités
    showUnitAdded(unitName) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.unitAdded', { unitName }) : 
            `+1 ${unitName} ajouté à votre collection !`;
        this.showNotification(message, 'success');
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
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.shopRefreshed') : 
            'Magasin rafraîchi !';
        this.showNotification(message, 'success');
    }
    
    showShopError(message) {
        this.showNotification(message, 'error');
    }
    
    // Notifications de bonus
    showBonusUnlocked() {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.bonusUnlocked') : 
            'Bonus débloqué !';
        this.showNotification(message, 'success');
    }
    
    showBonusSold(bonusName, sellPrice) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.bonusSold', { bonusName, sellPrice }) : 
            `${bonusName} vendu pour ${sellPrice}💰 !`;
        this.showNotification(message, 'success');
    }
    
    showAllBonusesUnlocked() {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.allBonusesUnlocked') : 
            'Tous les bonus débloqués !';
        this.showNotification(message, 'success');
    }
    
    showSynergyUpgraded(synergyName, level) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.synergyUpgraded', { synergyName, level }) : 
            `${synergyName} améliorée au niveau ${level} !`;
        this.showNotification(message, 'success');
    }
    
    // Notifications de consommables
    showConsumableError(message) {
        this.showNotification(message, 'error');
    }
    
    showConsumableAdded(consumableName) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.consumableAdded', { consumableName }) : 
            `${consumableName} ajouté à l'inventaire !`;
        this.showNotification(message, 'success');
    }
    
    showConsumableUsed(consumableName) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.consumableUsed', { consumableName }) : 
            `${consumableName} utilisé !`;
        this.showNotification(message, 'success');
    }
    
    // Notifications de sauvegarde
    showGameSaved() {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.gameSaved') : 
            'Partie sauvegardée !';
        this.showNotification(message, 'success');
    }
    
    showGameLoaded() {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.gameLoaded') : 
            'Partie chargée !';
        this.showNotification(message, 'success');
    }
    
    showNewGameCreated(guildName) {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.newGameCreated', { guildName }) : 
            `Nouvelle partie créée : ${guildName}`;
        this.showNotification(message, 'success');
    }
    
    showNoSaveFound() {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.noSaveFound') : 
            'Aucune sauvegarde trouvée';
        this.showNotification(message, 'error');
    }
    
    // Notifications de tutoriel
    showTutorialCompleted() {
        const message = window.gameState && window.gameState.t ? 
            window.gameState.t('message.tutorialCompleted') : 
            'Tutoriel terminé ! Bonne chance !';
        this.showNotification(message, 'success');
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
        
        let topPosition = '20px';
        if (combatSection && combatSection.style.display !== 'none') {
            const rect = combatSection.getBoundingClientRect();
            topPosition = `${rect.top + 20}px`;
        } else if (preCombatSection && preCombatSection.style.display !== 'none') {
            const rect = preCombatSection.getBoundingClientRect();
            topPosition = `${rect.top + 20}px`;
        }
        notification.style.top = topPosition;
        
        document.body.appendChild(notification);

        // Attendre 3 secondes puis faire disparaître la notification
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        notification.classList.add('slide-out');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        
        // Traiter la notification suivante après un délai
        await new Promise(resolve => setTimeout(resolve, 200));
        this.processNotificationQueue();
    }
} 