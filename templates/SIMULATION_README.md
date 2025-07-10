# 🎯 Simulateur d'Équilibrage - GuildMaster

## Vue d'ensemble

Le simulateur d'équilibrage est un outil puissant qui permet d'analyser automatiquement l'équilibrage de GuildMaster en simulant des milliers de parties. Il collecte des statistiques détaillées et génère des recommandations pour optimiser l'expérience de jeu.

## 🚀 Comment utiliser le simulateur

### 1. Accès au simulateur
- Lancez le jeu GuildMaster
- Sur l'écran de titre, cliquez sur le bouton **"🎯 Simulateur d'Équilibrage"**

### 2. Configuration de la simulation
- **Nombre de parties** : Entre 10 et 10 000 (recommandé : 100 pour les tests, 1000 pour l'analyse complète)
- **Tours max par partie** : Entre 10 et 200 (recommandé : 50)
- **Logs détaillés** : Activez pour des informations plus complètes (peut ralentir la simulation)

### 3. Lancement de la simulation
- Cliquez sur **"🚀 Lancer la Simulation"**
- Suivez la progression en temps réel
- Attendez la fin de la simulation (peut prendre plusieurs minutes)

### 4. Analyse des résultats
Le simulateur affiche automatiquement :
- **Statistiques principales** : Taux de victoire, rang moyen, or moyen, durée moyenne
- **Distribution des rangs** : Graphique montrant où les joueurs s'arrêtent
- **Unités les plus utilisées** : Top 10 des unités préférées par l'IA
- **Recommandations d'équilibrage** : Suggestions d'amélioration

## 📊 Interprétation des résultats

### Taux de victoire
- **< 40%** : Jeu trop difficile → Réduire les dégâts requis ou augmenter la puissance
- **40-60%** : Équilibrage correct
- **> 80%** : Jeu trop facile → Augmenter les dégâts requis ou réduire la puissance

### Distribution des rangs
- **Concentration en F-E** : Progression trop lente
- **Concentration en A-S** : Progression trop rapide
- **Distribution équilibrée** : Progression correcte

### Unités sous-utilisées
- **< 10% d'utilisation** : Unité probablement sous-puissante
- **> 50% d'utilisation** : Unité probablement surpuissante

## 🔧 Test rapide depuis la console

Pour tester rapidement le simulateur, ouvrez la console du navigateur (F12) et tapez :

```javascript
// Test rapide avec 5 parties
testSimulation().then(results => {
    console.log('Résultats du test:', results);
});
```

## 📈 Exemples d'utilisation

### Analyse d'équilibrage général
```javascript
// Simulation complète pour analyse générale
const engine = new SimulationEngine();
const results = await engine.runSimulation({
    numberOfGames: 1000,
    maxRounds: 50,
    enableLogging: false
});
```

### Test d'une modification spécifique
```javascript
// Comparer avant/après une modification
const beforeResults = await engine.runSimulation({ numberOfGames: 500 });
// Modifier les valeurs dans GameState.js
const afterResults = await engine.runSimulation({ numberOfGames: 500 });
// Comparer les résultats
```

## 🎯 Recommandations d'équilibrage

Le simulateur génère automatiquement des recommandations basées sur :

### Difficulté
- **Problème** : Taux de victoire anormal
- **Solution** : Ajuster les dégâts requis des ennemis

### Économie
- **Problème** : Efficacité économique faible
- **Solution** : Augmenter les récompenses ou réduire les coûts

### Unités
- **Problème** : Unités sous-utilisées
- **Solution** : Réduire le coût ou augmenter la puissance

### Synergies
- **Problème** : Synergies inefficaces
- **Solution** : Ajuster les bonus de synergie

## 📁 Export des résultats

Les résultats peuvent être exportés en JSON pour analyse approfondie :
- Cliquez sur **"📊 Exporter les Résultats"**
- Le fichier contient toutes les statistiques et recommandations

## 🔍 Analyse avancée

### Structure des données exportées
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "config": { /* Configuration de la simulation */ },
  "results": [ /* Résultats de chaque partie */ ],
  "globalStats": { /* Statistiques globales */ },
  "balanceReport": { /* Rapport d'équilibrage détaillé */ }
}
```

### Métriques importantes
- **winRate** : Taux de victoire global
- **averageRankReached** : Rang moyen atteint
- **goldEconomy.efficiency** : Efficacité économique
- **unitUsageStats** : Statistiques d'utilisation des unités
- **synergyEffectiveness** : Efficacité des synergies

## 🛠️ Personnalisation

### Modifier les stratégies de l'IA
Éditez les méthodes dans `SimulationEngine.js` :
- `selectOptimalUnit()` : Stratégie de recrutement
- `selectOptimalCombatTroops()` : Stratégie de sélection pour combat
- `isBonusWorthBuying()` : Stratégie d'achat de bonus

### Ajouter de nouvelles métriques
Modifiez `analyzeResults()` pour collecter de nouvelles statistiques.

## ⚠️ Notes importantes

1. **Performance** : Les simulations de 1000+ parties peuvent prendre plusieurs minutes
2. **Mémoire** : Les logs détaillés consomment beaucoup de mémoire
3. **Reproductibilité** : Les résultats sont reproductibles avec la même graine aléatoire
4. **IA** : L'IA utilise des stratégies optimisées, pas forcément représentatives des joueurs humains

## 🎮 Intégration avec le jeu

Le simulateur utilise le même moteur de jeu que le jeu principal, garantissant que les résultats sont représentatifs de l'expérience réelle des joueurs.

---

**Développé pour optimiser l'équilibrage de GuildMaster et offrir la meilleure expérience de jeu possible !** 🎯 