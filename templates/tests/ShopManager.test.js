// Tests pour ShopManager
import { ShopManager } from '../js/modules/ShopManager.js';
import { GameState } from '../js/modules/GameState.js';

describe('ShopManager - Réutilisabilité des unités', () => {
    let shopManager;
    let gameState;

    beforeEach(() => {
        shopManager = new ShopManager();
        gameState = new GameState();
    });

    test('Les unités achetées dans le shop doivent être réutilisables', () => {
        // Simuler l'achat d'une unité dans le shop
        const purchasedUnit = {
            name: 'Épéiste Légendaire',
            icon: '⚔️',
            type: 'Corps à corps',
            damage: 15,
            multiplier: 3,
            id: 'Épéiste Légendaire_1234567890_0.123456789',
            rarity: 'legendary'
        };

        // Ajouter l'unité achetée
        gameState.addTroop(purchasedUnit);
        
        // Vérifier qu'elle est dans availableTroops
        expect(gameState.availableTroops).toContain(purchasedUnit);
        
        // Simuler l'utilisation en combat
        gameState.selectedTroops = [purchasedUnit];
        
        // Simuler la fin de combat (removeUsedTroopsFromCombat)
        gameState.removeUsedTroopsFromCombat([purchasedUnit]);
        
        // Vérifier que l'unité est toujours dans availableTroops (réutilisable)
        expect(gameState.availableTroops).toContain(purchasedUnit);
        
        // Vérifier qu'elle n'est plus dans selectedTroops
        expect(gameState.selectedTroops).not.toContain(purchasedUnit);
    });

    test('Les unités de base doivent être temporaires (non réutilisables)', () => {
        // Simuler une unité de base
        const baseUnit = {
            name: 'Épéiste',
            icon: '⚔️',
            type: 'Corps à corps',
            damage: 5,
            multiplier: 1,
            id: 'Épéiste_0',
            rarity: 'common'
        };

        // Ajouter l'unité de base
        gameState.addTroop(baseUnit);
        
        // Vérifier qu'elle est dans availableTroops
        expect(gameState.availableTroops).toContain(baseUnit);
        
        // Simuler l'utilisation en combat
        gameState.selectedTroops = [baseUnit];
        
        // Simuler la fin de combat
        gameState.removeUsedTroopsFromCombat([baseUnit]);
        
        // Vérifier que l'unité de base n'est plus dans availableTroops (temporaire)
        expect(gameState.availableTroops).not.toContain(baseUnit);
    });

    test('isPermanentUnit doit correctement identifier les unités permanentes', () => {
        // Unités permanentes (achetées/transformées)
        const permanentUnits = [
            { id: 'Épéiste_1234567890_0.123456789' },
            { id: 'Archer_1234567890' },
            { id: 'Magicien_1234567890_0.987654321' }
        ];

        // Unités temporaires (de base)
        const temporaryUnits = [
            { id: 'Épéiste_0' },
            { id: 'Archer_1' },
            { id: 'Magicien_2' }
        ];

        // Vérifier que les unités permanentes sont bien identifiées
        permanentUnits.forEach(unit => {
            expect(gameState.isPermanentUnit(unit)).toBe(true);
        });

        // Vérifier que les unités temporaires sont bien identifiées
        temporaryUnits.forEach(unit => {
            expect(gameState.isPermanentUnit(unit)).toBe(false);
        });
    });
}); 