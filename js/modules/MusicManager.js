/**
 * Gestionnaire de musique pour GuildMaster
 * Gère la lecture, pause et contrôle du volume de la musique de fond
 */
export class MusicManager {
    constructor() {
        this.audio = document.getElementById('background-music');
        
        // Contrôles du jeu principal
        this.musicToggle = document.getElementById('music-toggle');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeDisplay = document.getElementById('volume-display');
        
        // Contrôles du menu principal
        this.titleMusicToggle = document.getElementById('title-music-toggle');
        this.titleVolumeSlider = document.getElementById('title-volume-slider');
        this.titleVolumeDisplay = document.getElementById('title-volume-display');
        
        this.musicIcon = this.musicToggle?.querySelector('.music-icon');
        this.musicText = this.musicToggle?.querySelector('.music-text');
        this.titleMusicIcon = this.titleMusicToggle?.querySelector('.music-icon');
        this.titleMusicText = this.titleMusicToggle?.querySelector('.music-text');
        
        this.isPlaying = false;
        this.volume = 0.3; // Volume par défaut à 30%
        
        this.init();
    }
    
    init() {
        if (!this.audio) {
            console.warn('Élément audio non trouvé');
            return;
        }
        
        // Initialiser le volume à 30%
        this.setVolume(this.volume);
        
        // Événements pour les boutons play/pause (jeu et menu)
        if (this.musicToggle) {
            this.musicToggle.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
        
        if (this.titleMusicToggle) {
            this.titleMusicToggle.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
        
        // Événements pour les contrôles du volume (jeu et menu)
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                this.setVolume(volume);
            });
        }
        
        if (this.titleVolumeSlider) {
            this.titleVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                this.setVolume(volume);
            });
        }
        
        // Événements pour l'audio
        this.audio.addEventListener('play', () => {
            this.updatePlayButton(true);
        });
        
        this.audio.addEventListener('pause', () => {
            this.updatePlayButton(false);
        });
        
        this.audio.addEventListener('ended', () => {
            this.updatePlayButton(false);
        });
        
        // Gérer les erreurs de chargement audio
        this.audio.addEventListener('error', (e) => {
            console.error('Erreur de chargement audio:', e);
            this.disableControls();
        });
        
        // Vérifier si l'audio est prêt
        this.audio.addEventListener('canplaythrough', () => {
            // Audio prêt
        });
    }
    
    togglePlayPause() {
        if (!this.audio) return;
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        if (!this.audio) return;
        
        // Essayer de jouer la musique
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.isPlaying = true;
                    this.updatePlayButton(true);
                })
                .catch(error => {
                    console.error('Erreur lors du démarrage de la musique:', error);
                    // Gérer les erreurs de politique autoplay
                    if (error.name === 'NotAllowedError') {
                        this.showAutoplayMessage();
                    }
                });
        }
    }
    
    pause() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton(false);
    }
    
    setVolume(volume) {
        if (!this.audio) return;
        
        
        
        this.volume = volume;
        this.audio.volume = volume;
        
        // Mettre à jour l'affichage pour les deux contrôles
        const volumePercent = Math.round(volume * 100);
        
        if (this.volumeSlider) {
            this.volumeSlider.value = volumePercent;
        }
        if (this.volumeDisplay) {
            this.volumeDisplay.textContent = `${volumePercent}%`;
        }
        
        if (this.titleVolumeSlider) {
            this.titleVolumeSlider.value = volumePercent;
        }
        if (this.titleVolumeDisplay) {
            this.titleVolumeDisplay.textContent = `${volumePercent}%`;
        }
        

    }
    
    updatePlayButton(isPlaying) {
        this.isPlaying = isPlaying;
        
        // Mettre à jour le bouton du jeu principal
        if (this.musicToggle && this.musicIcon && this.musicText) {
            if (isPlaying) {
                this.musicToggle.classList.add('playing');
                this.musicIcon.textContent = '⏸️';
                this.musicText.textContent = 'Pause';
            } else {
                this.musicToggle.classList.remove('playing');
                this.musicIcon.textContent = '▶️';
                this.musicText.textContent = 'Play';
            }
        }
        
        // Mettre à jour le bouton du menu principal
        if (this.titleMusicToggle && this.titleMusicIcon && this.titleMusicText) {
            if (isPlaying) {
                this.titleMusicToggle.classList.add('playing');
                this.titleMusicIcon.textContent = '⏸️';
                this.titleMusicText.textContent = 'Pause';
            } else {
                this.titleMusicToggle.classList.remove('playing');
                this.titleMusicIcon.textContent = '▶️';
                this.titleMusicText.textContent = 'Play';
            }
        }
    }
    
    disableControls() {
        // Désactiver les contrôles du jeu principal
        if (this.musicToggle) {
            this.musicToggle.disabled = true;
            this.musicToggle.style.opacity = '0.5';
        }
        
        if (this.volumeSlider) {
            this.volumeSlider.disabled = true;
            this.volumeSlider.style.opacity = '0.5';
        }
        
        // Désactiver les contrôles du menu principal
        if (this.titleMusicToggle) {
            this.titleMusicToggle.disabled = true;
            this.titleMusicToggle.style.opacity = '0.5';
        }
        
        if (this.titleVolumeSlider) {
            this.titleVolumeSlider.disabled = true;
            this.titleVolumeSlider.style.opacity = '0.5';
        }
    }
    
    showAutoplayMessage() {
        // Créer une notification pour informer l'utilisateur
        const notification = document.createElement('div');
        
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
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
            z-index: 10000;
            font-weight: 600;
            max-width: 300px;
        `;
        notification.textContent = 'Cliquez sur le bouton Play pour démarrer la musique';
        
        document.body.appendChild(notification);
        
        // Supprimer la notification après 5 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // Méthodes publiques pour l'intégration avec le jeu
    startMusic() {
        this.play();
    }
    
    stopMusic() {
        this.pause();
    }
    
    getVolume() {
        return this.volume;
    }
    
    setMaxVolume(maxVolume = 0.3) {
        this.setVolume(Math.min(this.volume, maxVolume));
    }
}

// Instance singleton
let musicManagerInstance = null;

export function getMusicManager() {
    if (!musicManagerInstance) {
        musicManagerInstance = new MusicManager();
    }
    return musicManagerInstance;
} 