// Système de tutoriel
class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.tutorialSteps = this.defineTutorialSteps();
        this.isActive = false;
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
                        <li>Recruter des unités variées (corps à corps, distance, magique)</li>
                        <li>Former des équipes avec des synergies</li>
                        <li>Combattre des ennemis pour gagner de l'or et de la réputation</li>
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
                    <p>Le recrutement coûte 50💰 et vous propose 3 unités aléatoires.</p>
                    
                    <p><strong>Types d'unités :</strong></p>
                    <ul>
                        <li><strong>Corps à corps :</strong> Épéiste, Lancier, Barbare, Viking...</li>
                        <li><strong>Distance :</strong> Archer, Magicien Rouge, Magicien Bleu, Fronde...</li>
                        <li><strong>Magique :</strong> Mage, Sorcier, Mage Suprême...</li>
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
                        <li><strong>2+ Corps à corps :</strong> +1 multiplicateur pour toutes les unités corps à corps</li>
                        <li><strong>2+ Distance :</strong> +2 multiplicateur pour toutes les unités distance</li>
                    </ul>
                    
                    <p><strong>Synergies mixtes :</strong></p>
                    <ul>
                        <li><strong>2+ Corps à corps + 1+ Distance :</strong> Les unités distance gagnent +15 dégâts et +1 multi</li>
                        <li><strong>2+ Distance + 1+ Corps à corps :</strong> Les unités corps à corps gagnent +5 dégâts et +3 multi</li>
                    </ul>
                `,
                action: 'highlight',
                target: '#synergies-display'
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
                    <ul>
                        <li><strong>Golem de Pierre :</strong> Les unités à distance font 50% moins de dégâts</li>
                        <li><strong>Seigneur des Ombres :</strong> Les unités corps à corps voient leur multiplicateur réduit de 50%</li>
                        <li><strong>Dragon Ancien :</strong> Les unités magiques font 30% moins de dégâts</li>
                        <li><strong>Démon Suprême :</strong> Toutes les unités font 25% moins de dégâts</li>
                    </ul>
                    
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
                        <li><strong>Bonus :</strong> Améliorent temporairement vos unités sélectionnées</li>
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
                    </ul>
                    
                    <p><strong>⭐ Réputation :</strong></p>
                    <ul>
                        <li>Gagnée en combattant</li>
                        <li>Indique votre prestige dans le monde</li>
                        <li>Bonus de 10 points lors des promotions</li>
                    </ul>
                `,
                action: 'highlight',
                target: '.resources'
            },
            {
                title: 'Sauvegarde et Progression',
                content: `
                    <p>Votre progression est sauvegardée automatiquement dans votre navigateur.</p>
                    
                    <p><strong>Fonctionnalités :</strong></p>
                    <ul>
                        <li><strong>Sauvegarde automatique :</strong> Vos actions sont sauvegardées</li>
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

    // Démarrer le tutoriel
    startTutorial() {
        this.currentStep = 0;
        this.isActive = true;
        this.showCurrentStep();
    }

    // Afficher l'étape actuelle
    showCurrentStep() {
        const step = this.tutorialSteps[this.currentStep];
        const content = document.getElementById('tutorial-content');
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');

        // Mettre à jour le contenu
        content.innerHTML = `
            <h4 style="color: #2d3436; margin-bottom: 15px;">${step.title}</h4>
            ${step.content}
        `;

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

    // Passer à l'étape suivante
    nextStep() {
        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.currentStep++;
            this.showCurrentStep();
        } else {
            this.endTutorial();
        }
    }

    // Passer à l'étape précédente
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showCurrentStep();
        }
    }

    // Terminer le tutoriel
    endTutorial() {
        this.isActive = false;
        this.removeHighlight();
        hideModal('tutorial-modal');
        // gameState.showNotification('Tutoriel terminé ! Bonne chance !', 'success');
        
        // Marquer le tutoriel comme vu
        gameState.isFirstTime = false;
    }

    // Mettre en surbrillance un élément
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

    // Retirer la surbrillance
    removeHighlight() {
        document.querySelectorAll('*').forEach(element => {
            if (element.style.boxShadow && element.style.boxShadow.includes('rgba(255, 107, 107, 0.8)')) {
                element.style.boxShadow = '';
                element.style.border = '';
                element.style.borderRadius = '';
            }
        });
    }

    // Obtenir des conseils contextuels
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

// Instance globale du système de tutoriel
const tutorialSystem = new TutorialSystem();

// Fonction pour initialiser le tutoriel (appelée depuis game.js)
function initTutorial() {
    tutorialSystem.startTutorial();
    
    // Ajouter les événements de navigation
    document.getElementById('tutorial-prev').addEventListener('click', () => {
        tutorialSystem.prevStep();
    });
    
    document.getElementById('tutorial-next').addEventListener('click', () => {
        tutorialSystem.nextStep();
    });
}

// Fonction pour afficher des conseils contextuels
function showContextualTip(elementId) {
    const tip = tutorialSystem.getContextualTip(elementId);
    if (tip) {
        // gameState.showNotification(tip, 'info');
    }
}

// Ajouter des tooltips aux éléments importants
function addTooltips() {
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
                if (gameState.isFirstTime) {
                    showContextualTip(elementId);
                }
            });
        }
    });
}

// Initialiser les tooltips quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Ajouter les tooltips après un délai pour laisser le temps au jeu de se charger
    setTimeout(addTooltips, 1000);
}); 