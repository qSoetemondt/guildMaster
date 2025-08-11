#!/usr/bin/env python3
"""
Serveur Python simple pour Guild Master
Sert les fichiers statiques du jeu via HTTP
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configuration du serveur
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class GuildMasterHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Gestionnaire de requêtes HTTP personnalisé pour Guild Master"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Ajouter des en-têtes CORS pour permettre l'accès depuis d'autres domaines
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Log personnalisé pour le serveur Guild Master
        print(f"[Guild Master Server] {format % args}")

def start_server():
    """Démarre le serveur HTTP"""
    try:
        with socketserver.TCPServer(("", PORT), GuildMasterHTTPRequestHandler) as httpd:
            print(f"🚀 Serveur Guild Master démarré sur http://localhost:{PORT}")
            print(f"📁 Répertoire racine: {DIRECTORY}")
            print(f"🌐 Ouvrez votre navigateur sur: http://localhost:{PORT}")
            print(f"⏹️  Appuyez sur Ctrl+C pour arrêter le serveur")
            print("-" * 50)
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Serveur arrêté par l'utilisateur")
    except OSError as e:
        if e.errno == 48:  # Port déjà utilisé
            print(f"❌ Erreur: Le port {PORT} est déjà utilisé")
            print(f"💡 Essayez un autre port ou arrêtez le processus qui utilise le port {PORT}")
        else:
            print(f"❌ Erreur lors du démarrage du serveur: {e}")
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")

if __name__ == "__main__":
    start_server()
