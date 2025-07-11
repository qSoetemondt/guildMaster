/**
 * @file Handles the in-game tutorial system.
 */

// Tutorial System Class
class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.tutorialSteps = this.defineTutorialSteps();
        this.isActive = false;
        this.hideModalFunction = null;
        // Flag to prevent adding duplicate event listeners
        this.eventListenersAdded = false;
    }

    /**
 * Sets the function to be used for hiding modals.
    setHideModalFunction(hideModalFn) {
        this.hideModalFunction = hideModalFn;
    }

    // Définir les étapes du tutoriel
    defineTutorialSteps() {
        return [
            {
                title: 'Bienvenue dans le Gestionnaire de Guilde !',
                content: `
                    <p>Vous êtes le gestionnaire d'une guilde d'aventuriers dans un univers médiéval. 
                    Votre objectif est de recruter des troupes, les envoyer au combat, et faire progresser 
                    votre guilde jusqu'au rang S.</p>
                    
                    <p><strong>Objectifs :</strong></p>
                    <ul>
                        <li>Recruter des unités variées (CAC, Dist., Mag.)</li>
                        <li>Former des équipes avec des synergies</li>
                        <li>Combattre des ennemis pour gagner de l'or</li>
                        <li>Améliorer votre guilde via le magasin</li>
                        <li>Atteindre le rang S en affrontant des boss</li>
                    </ul>
                `,
                action: null
            },
            {
                title: 'Comprendre les Rangs',
                content: `
                    <p>Le système de rangs fonctionne ainsi :</p>
                    <p><strong>F- → F → F+ → E- → E → E+ → D- → D → D+ → C- → C → C+ → B- → B → B+ → A- → A → A+ → S</strong></p>
                    
                    <p>Pour progresser :</p>
                    <ul>
                        <li>Combats normaux : Gagnent des points de progression</li>
                        <li>Combats de boss : Nécessaires pour passer au rang supérieur</li>
                        <li>Chaque rang augmente la difficulté et les récompenses</li>
                    </ul>
                `,
                action: null
            },
            {
                title: 'Recrutement d\'Unités',
                content: `
                    <p>Vous pouvez recruter des unités dans le magasin.</p>

                    <p><strong>Types d'unités :</strong></p>
                    <ul>
                        <li><strong>CAC :</strong> Épéiste, Lancier...</li>
                        <li><strong>Dist. :</strong> Archer, Magicien Rouge...</li>
                        <li><strong>D'autres unités sont disponibles a vous de les découvrir</strong></li>
                    </ul>
                    
                    <p><strong>Raretés :</strong></p>
                    <ul>
                        <li>⚪ <strong>Commun :</strong> Unités de base</li>
                        <li>🟢 <strong>Peu commun :</strong> Unités améliorées</li>
                        <li>🔵 <strong>Rare :</strong> Unités spéciales</li>
                        <li>🟣 <strong>Épique :</strong> Unités puissantes</li>
                        <li>🟡 <strong>Légendaire :</strong> Unités exceptionnelles</li>
                    </ul>
                `,
                action: 'highlight',
                target: '#recruit-btn'
            },
            {
                title: 'Sélection d\'Équipe',
                content: `
                    <p>Cliquez sur les unités disponibles pour les sélectionner pour le combat.</p>
                    
                    <p><strong>Conseils :</strong></p>
                    <ul>
                        <li>Sélectionnez au moins une unité avant de combattre</li>
                        <li>Les synergies d'équipe apparaissent automatiquement</li>
                        <li>Cliquez sur une unité sélectionnée pour la retirer</li>
                    </ul>
                `,
                action: 'highlight',
                target: '#available-troops'
            },
            {
                title: 'Synergies d\'Équipe',
                content: `
                    <p>Les synergies sont des bonus automatiques basés sur la composition de votre équipe :</p>
                    
                    <p><strong>Synergies de type :</strong></p>
                    <ul>
                        <li><strong>2+ CAC :</strong> +1 multiplicateur pour toutes les unités corps à corps</li>
                        <li><strong>2+ Dist. :</strong> +2 multiplicateur pour toutes les unités distance</li>
                    </ul>
                    
                    <p><strong>D'autres synergies sont disponibles a vous de les découvrir</strong></p>
                `,
                action: 'highlight',
                target: '#synergies-display',
                // Add a note about the synergy display area
                note: "Look here to see active team synergies!"
            },


            {
                title: 'Lancement d\'un Combat',
                content: `
                    <p>Une fois votre équipe sélectionnée, cliquez sur "Lancer Combat" pour commencer.</p>
                    
                    <p><strong>Déroulement :</strong></p>
                    <ul>
                        <li>Chaque unité attaque automatiquement</li>
                        <li>Les dégâts sont calculés avec les synergies</li>
                        <li>Le combat se déroule en plusieurs manches</li>
                        <li>Objectif : Atteindre le nombre de dégâts requis</li>
                    </ul>
                `,
                action: 'highlight',
                target: '#start-combat-btn'
            },
            {
                title: 'Combats de Boss',
                content: `
                    <p>Quand vous êtes proche du rang supérieur, vous affrontez un boss !</p>
                    
                    <p><strong>Mécaniques spéciales :</strong></p>
                    <p>Les boss sont plus puissants et ont des mécaniques spéciales a vous de les découvrir</p>
                    
                    <p>Adaptez votre stratégie en conséquence !</p>
                `,
                action: null
            },
            {
                title: 'Le Magasin',
                content: `
                    <p>Après chaque combat, le magasin s'ouvre automatiquement.</p>
                    
                    <p><strong>Contenu :</strong></p>
                    <ul>
                        <li><strong>6 items aléatoires :</strong> Unités ou bonus d'équipement</li>
                        <li><strong>Pack aléatoire :</strong> 3 choix, vous en sélectionnez 1</li>
                    </ul>
                    
                    <p><strong>Types de bonus :</strong></p>
                    <ul>
                        <li>Bonus de dégâts (+2, +3, +5, +10)</li>
                        <li>Bonus de multiplicateur (+1, +2, +3)</li>
                        <li>Bonus spécifiques par type d'unité</li>
                        <li>Bonus universels pour toutes les unités</li>
                    </ul>
                `,
                action: 'highlight',
                target: '#shop-btn'
            },
            {
                title: 'Gestion des Ressources',
                content: `
                    <p>Vous gérez deux ressources principales :</p>
                    
                    <p><strong>💰 Or :</strong></p>
                    <ul>
                        <li>Gagné en combattant</li>
                        <li>Utilisé pour recruter (50💰) et acheter au magasin</li>
                        <li>Bonus de 50💰 lors des promotions de rang</li>
                        <li>Bonus d'économie. Plus vous avez d'or, plus vous gagnez d'or</li>
                    </ul>
                    
                `,
                action: 'highlight',
                target: '.resources'
            },
            {
                title: 'Sauvegarde et Progression',
                content: `
                    <p>Votre progression est sauvegardée dans votre navigateur. N'oubliez pas de la sauvegarder régulièrement </p>
                    <p>Ne videz pas votre navigateur, vous risquez de perdre votre progression</p>
                    
                    <p><strong>Fonctionnalités :</strong></p>
                    <ul>
                        <li><strong>Sauvegarde manuelle :</strong> Bouton "Sauvegarder" pour forcer la sauvegarde</li>
                        <li><strong>Chargement :</strong> Reprenez votre partie depuis le menu principal</li>
                        <li><strong>Nouvelle partie :</strong> Recommencez depuis le début</li>
                    </ul>
                    
                    <p>Votre objectif final est d'atteindre le rang S et de devenir le plus grand gestionnaire de guilde !</p>
                `,
                action: 'highlight',
                target: '#save-btn'
            }
        ];
    }

    /**
 * Starts the tutorial from the beginning.
 */
    startTutorial() {
        this.currentStep = 0;
        this.isActive = true;
        this.showCurrentStep();
    }

    // Afficher l'étape actuelle
    /**
 * Displays the current step of the tutorial in the modal.
 */
        const step = this.tutorialSteps[this.currentStep];
        const content = document.getElementById('tutorial-content');
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');



        // Mettre à jour le contenu
        content.innerHTML = `
        <h4 style="color: #2d3436; margin-bottom: 15px;">${step.title}</h4>
        // Mettre à jour les boutons
        prevBtn.disabled = this.currentStep === 0;
        nextBtn.textContent = this.currentStep === this.tutorialSteps.length - 1 ? 'Terminer' : 'Suivant';

        // Appliquer l'action si spécifiée
        if (step.action === 'highlight' && step.target) {
            this.highlightElement(step.target);
        } else {
            this.removeHighlight();
        }
    }

    /**
 * Advances the tutorial to the next step.
 */
    nextStep() {

        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.currentStep++;
            this.showCurrentStep();
        } else {
            this.endTutorial();
        }
    }

    /**
 * Goes back to the previous step in the tutorial.
 */
    prevStep() {

        if (this.currentStep > 0) {
            this.currentStep--;
            this.showCurrentStep();
        }
    }

    /**
 * Ends the tutorial and hides the modal.
 */
    endTutorial() {
        this.isActive = false;
        this.removeHighlight();
        if (this.hideModalFunction) {
            this.hideModalFunction('tutorial-modal');
        }
        // gameState.showNotification('Tutoriel terminé ! Bonne chance !', 'success');
        
        // Marquer le tutoriel comme vu
        if (gameState) {
            gameState.isFirstTime = false;
        }
    }

    /**
 * Highlights a specific element on the page.
 */
    highlightElement(selector) {
        this.removeHighlight();
        
        const element = document.querySelector(selector);
        if (element) {
            element.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.8)';
            element.style.border = '2px solid #ff6b6b';
            element.style.borderRadius = '8px';
            element.style.transition = 'all 0.3s ease';
            
            // Faire défiler vers l'élément si nécessaire
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
 * Removes the highlight from any currently highlighted element.
 */
    removeHighlight() {
        document.querySelectorAll('*').forEach(element => {
            if (element.style.boxShadow && element.style.boxShadow.includes('rgba(255, 107, 107, 0.8)')) {
                element.style.boxShadow = '';
                element.style.border = '';
                element.style.borderRadius = '';
            }
        });
    }

    /**
 * Gets a contextual tip for a given element ID.
 * @param {string} elementId - The ID of the element.
 * @returns {string} The contextual tip message, or an empty string if none exists.
 */
    getContextualTip(elementId) {
        const tips = {
            'recruit-btn': 'Recrutez de nouvelles unités pour renforcer votre guilde !',
            'start-combat-btn': 'Sélectionnez vos troupes puis lancez le combat !',
            'shop-btn': 'Achetez des unités et des bonus après chaque combat !',
            'save-btn': 'Sauvegardez votre progression régulièrement !',
            'available-troops': 'Cliquez sur les unités pour les sélectionner !',
            'selected-troops': 'Vos troupes sélectionnées pour le combat !',
            'synergies-display': 'Les synergies d\'équipe apparaissent ici !'
        };
        
        return tips[elementId] || '';
    }
}

// Global instance of the TutorialSystem
const tutorialSystem = new TutorialSystem();

/**
 * Initializes the tutorial system. Called from main.js.
 * @param {function} hideModalFn - The function used to hide modals.
 */
export function initTutorialSystem(hideModalFn) {
    if (hideModalFn) {
        tutorialSystem.setHideModalFunction(hideModalFn);
    }

    // Add event listeners only once
    if (!tutorialSystem.eventListenersAdded) {
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => tutorialSystem.prevStep());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => tutorialSystem.nextStep());
        }
        tutorialSystem.eventListenersAdded = true;
    }

    tutorialSystem.startTutorial();
}

// Fonction pour afficher des conseils contextuels
export function showContextualTip(elementId) {
    const tip = tutorialSystem.getContextualTip(elementId);
    if (tip) {
        // gameState.showNotification(tip, 'info');
    }
}

// Ajouter des tooltips aux éléments importants
export function addTooltips() {
    const tooltipElements = [
        'recruit-btn',
        'start-combat-btn', 
        'shop-btn',
        'save-btn'
    ];
    
    tooltipElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('mouseenter', () => {
                if (gameState && gameState.isFirstTime) {
                    showContextualTip(elementId);
                }
            });
        }
    });
}

// Exporter l'instance du système de tutoriel
export { tutorialSystem };

// Initialize tooltips when the DOM is loaded.
// Adding a slight delay to ensure game elements are present.
document.addEventListener('DOMContentLoaded', () => {
    // Ajouter les tooltips après un délai pour laisser le temps au jeu de se charger
    setTimeout(addTooltips, 1000);
}); 