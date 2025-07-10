# Guide des Constantes Extraites

Ce document explique comment modifier les constantes du jeu qui ont été extraites dans des fichiers séparés pour faciliter leur modification.

## Structure des Fichiers de Constantes

### 1. `js/modules/GameConstants.js`
Contient les constantes générales du jeu :
- **RANKS** : Liste des rangs du jeu (F- à S)
- **BOSS_RANKS** : Rangs qui déclenchent des combats de boss
- **RANK_MULTIPLIERS** : Multiplicateurs de dégâts selon le rang majeur
- **BASE_DAMAGE** : Dégâts de base pour le calcul des objectifs
- **DAMAGE_INCREMENT_PER_RANK** : Incrément de dégâts par rang

### 2. `js/modules/UnitConstants.js`
Contient toutes les unités du jeu :
- **BASE_UNITS** : Définition des 6 unités de base avec leurs propriétés
- **ALL_UNITS** : Toutes les unités disponibles dans le jeu (19 au total)

### 3. `js/modules/BossConstants.js`
Contient les boss du jeu :
- **BOSSES** : Liste des boss avec leurs mécaniques et dégâts cibles

### 4. `js/modules/SynergyConstants.js`
Contient les niveaux de base des synergies :
- **DEFAULT_SYNERGY_LEVELS** : Niveaux de base des synergies

### 5. `js/modules/BonusConstants.js`
Contient les bonus d'équipement du jeu avec une structure intégrée :
- **BONUS_DESCRIPTIONS** : Définitions complètes des bonus (nom, description, icône, rareté, prix de base)
- **calculateBonusPrice()** : Fonction pour calculer le prix final d'un bonus
- **getBonusRarity()** : Fonction pour obtenir la rareté d'un bonus

**Structure intégrée :** Chaque bonus contient toutes ses informations (nom, description, icône, rareté, prix de base) dans un seul objet.

### 6. `js/modules/SynergyDefinitions.js`
Contient les définitions des synergies du jeu :
- **SYNERGY_DEFINITIONS** : Définitions des 8 synergies principales
- **SPECIAL_SYNERGIES** : Définitions des 2 synergies spéciales
- **calculateSynergyBonus()** : Fonction pour calculer le bonus d'une synergie selon son niveau
- **checkSynergyActivation()** : Fonction pour vérifier si une synergie est activée

## Comment Modifier les Constantes

### Modifier les Rangs
Pour ajouter ou modifier des rangs, éditez `js/modules/GameConstants.js` :

```javascript
// Ajouter un nouveau rang
export const RANKS = ['F-', 'F', 'F+', 'E-', 'E', 'E+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S', 'SS'];

// Modifier les rangs de boss
export const BOSS_RANKS = ['F+', 'E+', 'D+', 'C+', 'B+', 'A+', 'S', 'SS'];
```

### Modifier les Unités

#### Ajouter une Unité de Base
Pour ajouter une unité de base, éditez `BASE_UNITS` dans `js/modules/UnitConstants.js` :

```javascript
export const BASE_UNITS = [
    { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2, icon: '⚔️', rarity: 'common' },
    // ... autres unités existantes
    { name: 'Nouvelle Unité', type: ['Distance', 'Magique'], damage: 6, multiplier: 2, icon: '🌟', rarity: 'common' }
];
```

#### Types de Rareté Disponibles
- `common` : Unités communes (blanc)
- `uncommon` : Unités peu communes (vert)
- `rare` : Unités rares (bleu)
- `epic` : Unités épiques (violet)
- `legendary` : Unités légendaires (orange)

### Modifier les Boss
Pour ajouter ou modifier des boss, éditez `js/modules/BossConstants.js` :

```javascript
// Ajouter un nouveau boss
export const BOSSES = [
    // ... boss existants
    { name: 'Nouveau Boss', mechanic: 'Nouvelle mécanique', targetDamage: 7000, icon: '🐉' }
];
```

### Modifier les Bonus d'Équipement
Pour ajouter ou modifier des bonus, éditez `js/modules/BonusConstants.js` :

```javascript
// Ajouter un nouveau bonus (structure intégrée)
export const BONUS_DESCRIPTIONS = {
    // ... bonus existants
    'nouveau_bonus': {
        name: 'Nouveau Bonus',
        description: 'Description du bonus',
        icon: '🌟',
        rarity: 'epic',     // 'common', 'uncommon', 'rare', 'legendary'
        basePrice: 75       // Prix de base avant calcul final
    }
};
```

**Avantages de la structure intégrée :**
- ✅ Toutes les informations d'un bonus sont regroupées
- ✅ Plus facile à maintenir et modifier
- ✅ Moins de risque d'erreur (pas de désynchronisation)
- ✅ Code plus lisible et cohérent

### Modifier les Synergies
Pour ajouter ou modifier des synergies, éditez `js/modules/SynergyDefinitions.js` :

```javascript
// Ajouter une nouvelle synergie
export const SYNERGY_DEFINITIONS = {
    // ... synergies existantes
    'Nouvelle Synergie': {
        name: 'Nouvelle Synergie',
        description: '+{bonus} dégâts pour toutes les unités (Niveau {level})',
        requiredType: 'Corps à corps',
        requiredCount: 4,
        baseBonus: 5,
        bonusType: 'damage',
        target: 'all'
    }
};
```

#### Types de Bonus Disponibles
- **bonusType** : `multiplier` (multiplicateur), `damage` (dégâts), `mixed` (mixte)
- **target** : `Corps à corps`, `Distance`, `Magique`, `Physique`, `all` (toutes les unités)
- **requiredCount** : Nombre d'unités requises pour activer la synergie

### Modifier les Multiplicateurs de Rangs
Pour ajuster la difficulté selon les rangs, modifiez `RANK_MULTIPLIERS` dans `js/modules/GameConstants.js` :

```javascript
// Rendre le jeu plus difficile
export const RANK_MULTIPLIERS = {
    'F': 1,
    'E': 3,    // Augmenté de 2 à 3
    'D': 6,    // Augmenté de 4 à 6
    'C': 12,   // Augmenté de 8 à 12
    'B': 24,   // Augmenté de 16 à 24
    'A': 48,   // Augmenté de 32 à 48
    'S': 96    // Augmenté de 64 à 96
};
```

## Test des Modifications

Après avoir modifié les constantes, vous pouvez tester vos changements en ouvrant `test_constantes.html` dans votre navigateur. Ce fichier de test vérifie que :

1. Les constantes sont correctement importées
2. Les valeurs sont cohérentes
3. L'intégration avec GameState fonctionne
4. Les calculs utilisent les nouvelles valeurs

## Bonnes Pratiques

1. **Sauvegardez toujours** avant de modifier les constantes
2. **Testez vos modifications** avec le fichier de test
3. **Documentez vos changements** dans ce fichier
4. **Vérifiez la cohérence** entre les différentes constantes
5. **Testez le jeu complet** après modification

## Exemples de Modifications Courantes

### Rendre le jeu plus facile
```javascript
// Dans GameConstants.js
export const BASE_DAMAGE = 1500; // Réduit de 2000 à 1500
export const DAMAGE_INCREMENT_PER_RANK = 300; // Réduit de 500 à 300
```

### Ajouter de nouvelles unités rares
```javascript
// Dans UnitConstants.js
{ name: 'Paladin', type: ['Corps à corps', 'Physique'], damage: 8, multiplier: 3, icon: '🛡️', rarity: 'epic' }
```

### Créer un boss plus difficile
```javascript
// Dans BossConstants.js
{ name: 'Dragon Ancien', mechanic: 'Toutes les unités font -25% de dégâts', targetDamage: 8000, icon: '🐲' }
```

## Fichiers de Test

### Test des Constantes Extraites
- `test_constantes.html` : Test des constantes extraites (rangs, unités, boss, synergies)
- `test_unites_speciales.html` : Test spécifique des unités spéciales
- `test_bonus_synergies.html` : Test des bonus et synergies extraits
- `test_consumable_manager.html` : Test du ConsumableManager avec les fonctions de synergie extraites
- `test_transformations.html` : Test des transformations d'unités extraites

## Extraction des Fonctions de Synergie

### ConsumableManager.js - Gestion des Synergies

Les fonctions de gestion des synergies ont été extraites de `GameState.js` vers `ConsumableManager.js` pour une meilleure organisation :

#### Fonctions Extraites :
- **showSynergyUpgradeModal(gameState)** : Affiche la modal d'amélioration de synergie
- **updateSynergyUpgradeList(gameState)** : Met à jour la liste des synergies disponibles
- **upgradeSynergy(synergyName, gameState)** : Améliore une synergie spécifique
- **transformUnitFromModal(fromUnitName, toUnitName, gameState)** : Transforme une unité depuis la modal
- **playTransformAnimation(fromUnitName, toUnitName, gameState)** : Joue l'animation de transformation
- **getUnitIcon(unitName, gameState)** : Obtient l'icône d'une unité par son nom
- **showAllTroopsWithTransformations(gameState)** : Affiche les troupes avec options de transformation
- **generateTransformButton(troopName, availableCount, gameState)** : Génère les boutons de transformation
- **getRarityIcon(rarity)** : Obtient l'icône de rareté
- **getRarityColor(rarity)** : Obtient la couleur de rareté

#### Avantages de l'Extraction :
- ✅ **Séparation des responsabilités** : ConsumableManager gère les consommables et leurs effets
- ✅ **Code plus modulaire** : Les fonctions de synergie sont regroupées logiquement
- ✅ **Maintenabilité améliorée** : Plus facile de modifier les mécaniques de consommables
- ✅ **Réutilisabilité** : Les fonctions peuvent être utilisées indépendamment

#### Utilisation :
```javascript
// Dans GameState.js
this.consumableManager.showSynergyUpgradeModal(this);
this.consumableManager.upgradeSynergy('Formation Corps à Corps', this);
this.consumableManager.transformUnitFromModal('Épéiste', 'Archer', this);
this.consumableManager.showAllTroopsWithTransformations(this); // Pour les transformations
```

### Structure du ConsumableManager

Le `ConsumableManager` gère maintenant :
1. **Inventaire des consommables** (limite de 3)
2. **Types de consommables** (11 types différents)
3. **Effets des consommables** (transformation, rafraîchissement, amélioration de synergie)
4. **Interface utilisateur** (affichage, utilisation)
5. **Gestion des synergies** (modal, amélioration, niveaux)
6. **Transformations d'unités** (logique de transformation, animations, icônes)
7. **Affichage des troupes avec transformations** (modal complète avec boutons de transformation)
8. **Gestion des raretés** (icônes et couleurs de rareté)

- `test_constantes.html` : Test complet des constantes extraites
- `test_unites_speciales.html` : Test des unités spéciales extraites
- `test_bonus_synergies.html` : Test des bonus et synergies extraits
- `test_notifications.html` : Test du système de notifications
- `test_save_system.html` : Test du système de sauvegarde
- `test_consumables.html` : Test du système de consomables

## Intégration avec le Code Existant

Toutes les constantes sont maintenant importées dans `GameState.js` et utilisées de manière transparente. Le code existant continue de fonctionner sans modification, mais les valeurs peuvent maintenant être facilement ajustées en modifiant les fichiers de constantes. 