// Test simple du simulateur d'équilibrage
import { SimulationEngine } from './SimulationEngine.js';

export async function testSimulation() {
    console.log('🧪 Test du simulateur d\'équilibrage...');
    
    const engine = new SimulationEngine();
    
    // Configuration de test (très petite simulation)
    const testConfig = {
        numberOfGames: 3,
        maxRounds: 5,
        enableLogging: true,
        saveDetailedLogs: true
    };
    
    try {
        console.log('Configuration de test:', testConfig);
        
        const results = await engine.runSimulation(testConfig);
        
        console.log('✅ Test terminé avec succès !');
        console.log('Résultats globaux:', results.globalStats);
        console.log('Détail des parties:', results.results);
        
        // Afficher un résumé
        engine.displaySummary();
        
        return results;
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        throw error;
    }
}

// Test d'une seule partie pour debug
export async function testSingleGame() {
    console.log('🔍 Test d\'une seule partie...');
    
    const engine = new SimulationEngine();
    
    try {
        const result = await engine.simulateSingleGame(0);
        console.log('Résultat de la partie:', result);
        return result;
    } catch (error) {
        console.error('❌ Erreur lors du test d\'une partie:', error);
        throw error;
    }
}

// Fonction pour tester rapidement depuis la console
window.testSimulation = testSimulation;
window.testSingleGame = testSingleGame; 