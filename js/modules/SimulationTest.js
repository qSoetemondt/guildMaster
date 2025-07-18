// Test simple du simulateur d'équilibrage
import { SimulationEngine } from './SimulationEngine.js';

export async function testSimulation() {
    const engine = new SimulationEngine();
    
    // Configuration de test (très petite simulation)
    const testConfig = {
        numberOfGames: 3,
        maxRounds: 5,
        enableLogging: true,
        saveDetailedLogs: true
    };
    
    try {
        const results = await engine.runSimulation(testConfig);
        
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
    const engine = new SimulationEngine();
    
    try {
        const result = await engine.simulateSingleGame(0);
        return result;
    } catch (error) {
        console.error('❌ Erreur lors du test d\'une partie:', error);
        throw error;
    }
}

// Fonction pour tester rapidement depuis la console
window.testSimulation = testSimulation;
window.testSingleGame = testSingleGame; 