// Script de débogage pour identifier les problèmes
console.log('=== DÉBUT DU DÉBOGAGE ===');

// Vérifier que tous les scripts sont chargés
window.addEventListener('load', function() {
    console.log('Page chargée');
    
    // Vérifier les éléments DOM
    const elements = [
        'new-game-btn',
        'load-game-btn', 
        'tutorial-btn',
        'recruit-btn',
        'start-combat-btn',
        'shop-btn',
        'save-btn',
        'menu-btn'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ ${id} trouvé`);
        } else {
            console.log(`❌ ${id} MANQUANT`);
        }
    });
    
    // Vérifier les variables globales
    console.log('Variables globales:');
    console.log('- gameState:', typeof gameState);
    console.log('- saveSystem:', typeof saveSystem);
    console.log('- combatSystem:', typeof combatSystem);
    console.log('- shopSystem:', typeof shopSystem);
    console.log('- tutorialSystem:', typeof tutorialSystem);
    console.log('- UNITS:', typeof UNITS);
    
    // Vérifier les fonctions
    console.log('Fonctions:');
    console.log('- showScreen:', typeof showScreen);
    console.log('- showModal:', typeof showModal);
    console.log('- hideModal:', typeof hideModal);
    console.log('- initGame:', typeof initGame);
    
    console.log('=== FIN DU DÉBOGAGE ===');
}); 