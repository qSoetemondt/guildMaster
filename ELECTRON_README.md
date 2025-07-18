# Guild Master - Application Electron

Ce projet a été converti pour fonctionner comme une application Electron, permettant de créer une application desktop native à partir du jeu web Guild Master.

## Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn

## Installation

1. **Installer les dépendances :**
   ```bash
   npm install
   ```

2. **Lancer l'application en mode développement :**
   ```bash
   npm start
   ```

3. **Lancer avec les outils de développement :**
   ```bash
   npm run dev
   ```

## Construction de l'application

### Pour Windows
```bash
npm run build
```
L'exécutable sera créé dans le dossier `dist/`.

### Pour macOS
```bash
npm run build
```

### Pour Linux
```bash
npm run build
```

## Fonctionnalités Electron

### Sauvegarde native
- Les sauvegardes sont stockées dans le dossier de données utilisateur d'Electron
- Compatible avec le système de sauvegarde existant (fallback vers localStorage)

### Menu natif
- Menu Fichier avec raccourcis clavier
- Menu Édition avec copier/coller
- Menu Affichage avec zoom et outils de développement
- Menu Aide avec informations sur l'application

### Raccourcis clavier
- `Ctrl+N` : Nouvelle partie
- `Ctrl+S` : Sauvegarder
- `Ctrl+O` : Charger partie
- `Ctrl+Q` : Quitter

## Structure des fichiers

```
guildMaster/
├── main.js              # Point d'entrée principal d'Electron
├── preload.js           # Script de préchargement sécurisé
├── package.json         # Configuration npm et Electron
├── index.html           # Interface principale (inchangée)
├── js/                  # Code JavaScript du jeu (inchangé)
├── css/                 # Styles CSS (inchangés)
└── assets/              # Ressources du jeu (inchangées)
```

## Développement

### Mode développement
L'application peut être lancée en mode développement avec les outils de développement ouverts :
```bash
npm run dev
```

### Debugging
- Les outils de développement sont accessibles via `F12` ou le menu Affichage
- Les logs sont disponibles dans la console d'Electron

## Distribution

### Configuration de build
Le fichier `package.json` contient la configuration pour `electron-builder` qui permet de créer des installateurs pour différentes plateformes.

### Personnalisation
Vous pouvez modifier les paramètres de build dans la section `build` du `package.json` :
- Icône de l'application
- Nom du produit
- Configuration spécifique par plateforme

## Compatibilité

L'application fonctionne à la fois :
- **En mode Electron** : Application desktop native
- **En mode navigateur** : Application web classique (fallback automatique)

## Support

Pour toute question ou problème avec la version Electron, consultez :
- La documentation Electron : https://www.electronjs.org/docs
- Les logs de l'application dans la console de développement 