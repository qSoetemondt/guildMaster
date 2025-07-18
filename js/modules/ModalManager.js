// Gestionnaire centralisé des modals pour GuildMaster
export class ModalManager {
    // Cache des modals pour éviter les requêtes DOM répétées
    static modalCache = new Map();
    static overlayCache = null;

    /**
     * Afficher une modal
     * @param {string} modalId - ID de la modal à afficher
     * @param {Object} options - Options supplémentaires
     * @param {boolean} options.preventClose - Empêcher la fermeture (pour combat-modal)
     * @param {Function} options.onShow - Callback appelé après affichage
     * @param {Function} options.onHide - Callback appelé après fermeture
     */
    static showModal(modalId, options = {}) {
        const modal = this.getModalElement(modalId);
        const overlay = this.getOverlayElement();
        
        if (!modal) {
            console.error(`Modal ${modalId} non trouvée !`);
            return false;
        }

        // Stocker les options pour cette modal
        this.setModalOptions(modalId, options);

        // Afficher la modal
        modal.classList.add('active');
        
        // Afficher l'overlay
        this.updateOverlayVisibility();

        // Ajouter les événements de fermeture
        this.setupCloseEvents(modalId, options);

        // Callback onShow
        if (options.onShow && typeof options.onShow === 'function') {
            options.onShow(modal);
        }


        return true;
    }

    /**
     * Masquer une modal
     * @param {string} modalId - ID de la modal à masquer
     * @param {Object} options - Options supplémentaires
     * @param {boolean} options.force - Forcer la fermeture même si preventClose est true
     */
    static hideModal(modalId, options = {}) {
        const modal = this.getModalElement(modalId);
        const overlay = this.getOverlayElement();
        const modalOptions = this.getModalOptions(modalId);

        // Vérifier si la fermeture est autorisée
        if (modalOptions && modalOptions.preventClose && !options.force) {
            return false;
        }

        if (modal) {
            modal.classList.remove('active');
        }

        // Vérifier s'il reste des modals ouvertes avant de masquer l'overlay
        this.updateOverlayVisibility();

        // Nettoyer les événements de fermeture
        this.cleanupCloseEvents(modalId);

        // Callback onHide
        if (modalOptions && modalOptions.onHide && typeof modalOptions.onHide === 'function') {
            modalOptions.onHide(modal);
        }


        return true;
    }

    /**
     * Vérifier si une modal est ouverte
     * @param {string} modalId - ID de la modal à vérifier
     * @returns {boolean}
     */
    static isModalOpen(modalId) {
        const modal = this.getModalElement(modalId);
        return modal ? modal.classList.contains('active') : false;
    }

    /**
     * Vérifier s'il y a des modals ouvertes
     * @returns {boolean}
     */
    static hasOpenModals() {
        // Vérifier les modals avec la classe 'active'
        const activeModals = document.querySelectorAll('.modal.active');
        if (activeModals.length > 0) {
            return true;
        }
        
        // Vérifier les modals avec style.display !== 'none'
        const allModals = document.querySelectorAll('.modal');
        for (const modal of allModals) {
            const style = window.getComputedStyle(modal);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Mettre à jour la visibilité de l'overlay selon les modals ouvertes
     */
    static updateOverlayVisibility() {
        const overlay = this.getOverlayElement();
        if (!overlay) return;

        // Vérifier s'il y a des modals ouvertes
        if (this.hasOpenModals()) {
            overlay.style.display = 'block';
        } else {
            overlay.style.display = 'none';
        }
    }

    /**
     * Forcer le nettoyage de l'overlay (méthode de debug)
     */
    static forceCleanupOverlay() {
        const overlay = this.getOverlayElement();
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Fermer toutes les modals
     */
    static hideAllModals() {
        const modals = document.querySelectorAll('.modal');
        const overlay = this.getOverlayElement();

        modals.forEach(modal => {
            modal.classList.remove('active');
        });

        this.updateOverlayVisibility();


    }

    /**
     * Obtenir l'élément modal avec cache
     * @param {string} modalId - ID de la modal
     * @returns {HTMLElement|null}
     */
    static getModalElement(modalId) {
        if (!this.modalCache.has(modalId)) {
            const element = document.getElementById(modalId);
            if (element) {
                this.modalCache.set(modalId, element);
            }
        }
        return this.modalCache.get(modalId) || null;
    }

    /**
     * Obtenir l'élément overlay avec cache
     * @returns {HTMLElement|null}
     */
    static getOverlayElement() {
        if (!this.overlayCache) {
            this.overlayCache = document.getElementById('modal-overlay');
        }
        return this.overlayCache;
    }

    /**
     * Configurer les événements de fermeture pour une modal
     * @param {string} modalId - ID de la modal
     * @param {Object} options - Options de la modal
     */
    static setupCloseEvents(modalId, options) {
        const modal = this.getModalElement(modalId);
        if (!modal) return;

        // Événement de clic sur l'overlay
        const overlay = this.getOverlayElement();
        if (overlay) {
            const overlayClickHandler = (e) => {
                if (e.target === overlay) {
                    this.hideModal(modalId);
                }
            };
            overlay.addEventListener('click', overlayClickHandler);
            this.storeCloseHandler(modalId, 'overlay', overlayClickHandler);
        }

        // Événement de clic sur les boutons de fermeture
        const closeButtons = modal.querySelectorAll('.close-btn, .modal-close');
        closeButtons.forEach(button => {
            const buttonClickHandler = () => {
                this.hideModal(modalId);
            };
            button.addEventListener('click', buttonClickHandler);
            this.storeCloseHandler(modalId, 'button', buttonClickHandler);
        });

        // Événement Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.isModalOpen(modalId)) {
                this.hideModal(modalId);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        this.storeCloseHandler(modalId, 'escape', escapeHandler);
    }

    /**
     * Nettoyer les événements de fermeture pour une modal
     * @param {string} modalId - ID de la modal
     */
    static cleanupCloseEvents(modalId) {
        const handlers = this.getCloseHandlers(modalId);
        if (!handlers) return;

        // Nettoyer les handlers stockés
        handlers.forEach((handler, type) => {
            if (type === 'escape') {
                document.removeEventListener('keydown', handler);
            } else if (type === 'overlay') {
                const overlay = this.getOverlayElement();
                if (overlay) {
                    overlay.removeEventListener('click', handler);
                }
            } else if (type === 'button') {
                const modal = this.getModalElement(modalId);
                if (modal) {
                    const closeButtons = modal.querySelectorAll('.close-btn, .modal-close');
                    closeButtons.forEach(button => {
                        button.removeEventListener('click', handler);
                    });
                }
            }
        });

        // Supprimer les handlers du cache
        this.removeCloseHandlers(modalId);
    }

    /**
     * Stocker un handler de fermeture
     * @param {string} modalId - ID de la modal
     * @param {string} type - Type de handler
     * @param {Function} handler - Fonction handler
     */
    static storeCloseHandler(modalId, type, handler) {
        if (!this.closeHandlersCache) {
            this.closeHandlersCache = new Map();
        }
        
        if (!this.closeHandlersCache.has(modalId)) {
            this.closeHandlersCache.set(modalId, new Map());
        }
        
        this.closeHandlersCache.get(modalId).set(type, handler);
    }

    /**
     * Obtenir les handlers de fermeture pour une modal
     * @param {string} modalId - ID de la modal
     * @returns {Map|null}
     */
    static getCloseHandlers(modalId) {
        return this.closeHandlersCache ? this.closeHandlersCache.get(modalId) : null;
    }

    /**
     * Supprimer les handlers de fermeture pour une modal
     * @param {string} modalId - ID de la modal
     */
    static removeCloseHandlers(modalId) {
        if (this.closeHandlersCache) {
            this.closeHandlersCache.delete(modalId);
        }
    }

    /**
     * Stocker les options d'une modal
     * @param {string} modalId - ID de la modal
     * @param {Object} options - Options de la modal
     */
    static setModalOptions(modalId, options) {
        if (!this.modalOptionsCache) {
            this.modalOptionsCache = new Map();
        }
        this.modalOptionsCache.set(modalId, options);
    }

    /**
     * Obtenir les options d'une modal
     * @param {string} modalId - ID de la modal
     * @returns {Object|null}
     */
    static getModalOptions(modalId) {
        return this.modalOptionsCache ? this.modalOptionsCache.get(modalId) : null;
    }

    /**
     * Nettoyer le cache des modals
     */
    static clearCache() {
        this.modalCache.clear();
        this.overlayCache = null;
        if (this.closeHandlersCache) {
            this.closeHandlersCache.clear();
        }
        if (this.modalOptionsCache) {
            this.modalOptionsCache.clear();
        }
    }

    /**
     * Initialiser le ModalManager
     */
    static init() {
        // Nettoyer le cache au démarrage
        this.clearCache();
        
        // Rendre les méthodes accessibles globalement pour compatibilité
        window.showModal = (modalId, options) => this.showModal(modalId, options);
        window.hideModal = (modalId, options) => this.hideModal(modalId, options);
        
        // Ajouter des méthodes de debug globales
        window.forceCleanupOverlay = () => this.forceCleanupOverlay();
        window.checkModals = () => this.hasOpenModals();
        

    }
}

// Initialiser automatiquement le ModalManager
ModalManager.init(); 