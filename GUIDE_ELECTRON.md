# 🎮 Guide d'utilisation - Guild Master Electron

## ✅ Conversion réussie !

Votre projet Guild Master a été converti avec succès en application Electron. Voici ce qui a été créé :

### 📁 Nouveaux fichiers ajoutés :
- `package.json` - Configuration npm et Electron
- `main.js` - Point d'entrée principal d'Electron
- `preload.js` - Script de préchargement sécurisé
- `ELECTRON_README.md` - Documentation technique
- `.gitignore` - Exclusion des fichiers de build

### 🔧 Modifications apportées :
- `js/modules/SaveManager.js` - Support des sauvegardes natives Electron
- `js/main.js` - Intégration des événements Electron

## 🚀 Comment utiliser l'application

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en mode développement
```bash
npm start
```

### 3. Lancement avec outils de développement
```bash
npm run dev
```

### 4. Construction de l'exécutable
```bash
npm run build
```

## 📦 Fichiers générés

Après `npm run build`, vous trouverez dans le dossier `dist/` :
- `Guild Master Setup 1.0.0.exe` - Installateur Windows
- `win-unpacked/` - Version portable (sans installation)

## 🎯 Fonctionnalités Electron

### ✅ Sauvegarde native
- Les sauvegardes sont stockées dans le dossier utilisateur d'Electron
- Compatible avec le système existant (fallback localStorage)

### ✅ Menu natif
- **Fichier** : Nouvelle partie, Sauvegarder, Charger, Quitter
- **Édition** : Copier, Coller, etc.
- **Affichage** : Zoom, Outils de développement
- **Aide** : À propos de l'application

### ✅ Raccourcis clavier
- `Ctrl+N` : Nouvelle partie
- `Ctrl+S` : Sauvegarder
- `Ctrl+O` : Charger partie
- `Ctrl+Q` : Quitter
- `F12` : Outils de développement

### ✅ Compatibilité
- Fonctionne en mode Electron (desktop)
- Fonctionne en mode navigateur (fallback automatique)

## 🔧 Personnalisation

### Modifier l'icône
Remplacez `assets/guildMaster.png` par votre icône (format PNG recommandé)

### Modifier le nom de l'application
Éditez le champ `productName` dans `package.json`

### Modifier la taille de la fenêtre
Éditez les paramètres `width` et `height` dans `main.js`

## 🐛 Dépannage

### L'application ne se lance pas
1. Vérifiez que Node.js est installé (version 16+)
2. Relancez `npm install`
3. Vérifiez les logs dans la console

### Problèmes de sauvegarde
- Les sauvegardes Electron sont dans : `%APPDATA%/guild-master/`
- En cas de problème, l'app utilise automatiquement localStorage

### Problèmes de build
1. Vérifiez que vous avez les droits d'écriture
2. Supprimez le dossier `dist/` et relancez `npm run build`

## 📋 Checklist de distribution

- [ ] Tester l'application en mode développement
- [ ] Tester les sauvegardes
- [ ] Tester les raccourcis clavier
- [ ] Construire l'exécutable (`npm run build`)
- [ ] Tester l'installateur généré
- [ ] Vérifier que l'icône s'affiche correctement

## 🎉 Félicitations !

Votre jeu Guild Master est maintenant une application desktop native ! 

L'application peut être distribuée comme :
- **Installateur Windows** : `dist/Guild Master Setup 1.0.0.exe`
- **Version portable** : Dossier `dist/win-unpacked/`
- **Application web** : Compatible navigateur (fallback)

### Prochaines étapes possibles :
1. **Distribution** : Partager l'installateur avec vos utilisateurs
2. **Mise à jour** : Modifier le code puis relancer `npm run build`
3. **Packaging** : Créer des versions pour macOS/Linux
4. **Auto-update** : Implémenter les mises à jour automatiques

---

**Note** : L'application conserve toutes les fonctionnalités du jeu original tout en ajoutant les avantages d'une application desktop native ! 