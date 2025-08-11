# 🖥️ Mode Plein Écran - Guild Master Electron

## ✅ Configuration actuelle

L'application Guild Master se lance maintenant **automatiquement en plein écran** par défaut !

## 🚀 Options de lancement

### 1. Mode plein écran (par défaut)
```bash
npm start
```
- L'application se lance en plein écran
- Interface immersive pour le jeu
- Pas de barre de titre ni de menu

### 2. Mode fenêtré (pour le développement)
```bash
npm run windowed
```
- L'application se lance dans une fenêtre normale
- Utile pour le développement et le debugging
- Garde la barre de titre

### 3. Mode développement avec outils
```bash
npm run dev
```
- Mode plein écran + outils de développement ouverts
- Parfait pour le debugging

## ⌨️ Raccourcis clavier

### En mode plein écran :
- **`Échap`** : Sortir du plein écran
- **`F11`** : Basculer entre plein écran et fenêtré
- **`Alt+F4`** : Fermer l'application

### En mode fenêtré :
- **`F11`** : Entrer en plein écran
- **`Alt+F4`** : Fermer l'application

## 🎮 Avantages du mode plein écran

### ✅ Immersion totale
- Pas de distraction avec les éléments du système
- Interface de jeu plus immersive
- Meilleure expérience utilisateur

### ✅ Optimisation de l'espace
- Utilisation maximale de l'écran
- Plus d'espace pour l'interface du jeu
- Interface plus propre

### ✅ Compatibilité
- Fonctionne sur tous les écrans
- S'adapte automatiquement à la résolution
- Compatible avec les écrans multiples

## 🔧 Personnalisation

### Modifier le comportement par défaut
Dans `main.js`, vous pouvez changer :
```javascript
fullscreen: !isWindowedMode, // true = toujours plein écran, false = toujours fenêtré
```

### Ajouter des raccourcis personnalisés
Dans la section `before-input-event`, vous pouvez ajouter :
```javascript
if (input.key === 'VotreTouche') {
    // Votre action personnalisée
}
```

## 🐛 Dépannage

### L'application ne se lance pas en plein écran
1. Vérifiez que vous n'avez pas l'argument `--windowed`
2. Redémarrez l'application
3. Vérifiez les paramètres d'affichage Windows

### Impossible de sortir du plein écran
- Utilisez `Échap` ou `F11`
- En dernier recours : `Alt+F4` pour fermer

### Problèmes d'affichage
- Vérifiez la résolution de votre écran
- Testez en mode fenêtré d'abord : `npm run windowed`

## 📋 Checklist de test

- [ ] L'application se lance en plein écran
- [ ] La touche Échap fait sortir du plein écran
- [ ] La touche F11 bascule le mode plein écran
- [ ] Le mode fenêtré fonctionne : `npm run windowed`
- [ ] L'interface du jeu s'affiche correctement

## 🎉 Résultat

Votre application Guild Master se lance maintenant en mode plein écran par défaut, offrant une expérience de jeu immersive et optimale ! 🎮 