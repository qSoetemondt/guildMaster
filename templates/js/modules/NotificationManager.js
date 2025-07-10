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