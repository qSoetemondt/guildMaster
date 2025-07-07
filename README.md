Jeu de gestion : Gestionnaire de guilde d'aventuriers
Présentation
Ce projet est un jeu de gestion solo en HTML, CSS et JavaScript, où le joueur incarne un gestionnaire de guilde d'aventuriers dans un univers médiéval. L'objectif est de recruter des troupes, les envoyer au combat, améliorer la guilde et atteindre le rang S en passant par différents niveaux de difficulté.

Fonctionnalités principales
Recrutement d'unités (épéiste, archer, magiciens, etc.)

Combats automatiques en plusieurs manches

Gestion des ressources : or et réputation

Magasin aléatoire avec bonus et unités

Améliorations permanentes et synergies d'équipe

Boss avec mécaniques spéciales

Sauvegarde automatique via localStorage

Tutoriel interactif

Interface minimaliste et responsive

Technologies utilisées
HTML5, CSS3 (style minimaliste)

JavaScript (vanilla)

LocalStorage pour la sauvegarde

Structure des dossiers
text
/assets      # Images, icônes SVG, sons
/css         # Fichiers de style
/js          # Scripts principaux
index.html   # Page unique du jeu
README.md    # Ce fichier

Système de progression et rangs
Progression des rangs : F- → F → F+ → E- → E → E+ → D- → D → D+ → C- → C → C+ → B- → B → B+ → A- → A → A+ → S

Pour passer d'un rang à un rang supérieur (ex: F+ à E-), le joueur doit affronter un boss.

Les combats normaux sont prédéfinis avec un nombre de dégâts à infliger.

Système de combat
Combats normaux : Objectif de dégâts prédéfinis à atteindre

Combats de boss : Boss aléatoires parmi plusieurs choix avec mécaniques spéciales

Mécaniques de boss possibles :
- Les troupes à distance font moins de dégâts
- Les corps à corps voient leur multiplicateur amoindri
- Autres mécaniques à définir

Magasin
S'affiche après chaque combat

Se réinitialise à chaque apparition

Propose aléatoirement :
- Des troupes
- Des bonus
- Un pack aléatoire (3 choix, le joueur en sélectionne 1)

Types d'unités
Les unités peuvent avoir plusieurs types : corps à corps, distance, magique, etc.

Unités de base et valeurs proposées
Unité	Type	Dégâts	Multiplicateur	Catégorie
Épéiste	Corps à corps	5	2	Corps à corps
Archer	Distance	4	3	Distance
Magicien rouge	Distance	6	2	Distance
Magicien bleu	Distance	3	4	Distance
Lancier	Corps à corps	4	3	Corps à corps
Barbare	Corps à corps	7	1	Corps à corps
Viking	Corps à corps	6	2	Corps à corps
Fronde	Distance	2	5	Distance
Les valeurs peuvent être ajustées lors de la phase d'équilibrage.

Améliorations et synergies
Corps à corps : +1 multiplicateur

Distance : +2 multiplicateur

Plus de corps à corps dans l'équipe : les distances gagnent +15 dégâts, +1 multi

Plus de distance dans l'équipe : les corps à corps gagnent +5 dégâts, +3 multi

Tutoriel – Structure proposée
Le tutoriel est conçu comme une série d'étapes interactives, utilisant des fenêtres modales ou des bulles d'aide pour guider le joueur :

Introduction

Présentation rapide de la guilde et de l'objectif du jeu.

Recrutement

Explication du recrutement d'unités et de leurs statistiques.

Lancement d'un combat

Sélection des combattants, déroulement automatique des manches.

Utilisation du magasin

Achat d'unités et de bonus, explication de la génération aléatoire.

Inspection des troupes

Comment consulter les troupes disponibles et celles utilisées.

Comprendre les synergies

Présentation des bonus de composition d'équipe.

Affrontement d'un boss

Explication des mécaniques spéciales des boss.

Sauvegarde et progression

Information sur la sauvegarde automatique et la progression de rang.

Chaque étape doit :

Afficher une fenêtre ou une bulle d'aide ciblant l'élément concerné.

Proposer un bouton "Suivant" ou "Compris !" pour passer à l'étape suivante.

Être rejouable via un bouton "Tutoriel" dans le menu principal.

Style graphique minimaliste
Utilise des icônes SVG simples pour chaque unité (formes géométriques, pictogrammes).

Palette de couleurs limitée, contrastes clairs.

Animations légères pour les interactions (fade, scale, surbrillance).

Polices sobres et lisibles.