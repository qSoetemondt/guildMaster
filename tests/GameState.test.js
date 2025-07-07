import { GameState } from '../js/modules/GameState.js';

// Mock des éléments DOM
const mockDOMElements = {
  'current-rank': { textContent: '' },
  'gold-amount': { textContent: '' },
  'guild-name-input': { value: '' },
  'available-troops': { innerHTML: '' },
  'selected-troops': { innerHTML: '' },
  'synergies-display': { innerHTML: '' },
  'active-bonuses': { innerHTML: '' },
  'combat-target-display': { textContent: '' },
  'combat-enemy-name': { textContent: '' },
  'boss-mechanic-display': { style: { display: '' } },
  'boss-name': { textContent: '' },
  'boss-mechanic-text': { textContent: '' },
  'enemy-image': { src: '' },
  'enemy-image-modal': { src: '' },
  'start-combat-btn': { textContent: '', disabled: false },
  'combat-progress-container': { remove: jest.fn() },
  'combat-modal': { style: { display: '' }, classList: { add: jest.fn() } },
  'combat-target': { textContent: '' },
  'combat-progress': { style: { width: '' } },
  'combat-log': { innerHTML: '', scrollTop: 0, scrollHeight: 0 },
  'pre-combat-section': { style: { display: '' } },
  'combat-section': { style: { display: '' } },
  'pre-combat-shop': { innerHTML: '' },
  'consumables-display': { innerHTML: '' },
  'troops-selected': { parentNode: { insertBefore: jest.fn() } },
  'all-troops-list': { innerHTML: '', querySelectorAll: jest.fn(() => []) },
  'troops-modal': { style: { display: '' } },
  'combat-animation-container': { style: { display: '' } },
  'close-combat-animation': { addEventListener: jest.fn(), removeEventListener: jest.fn() },
  'total-damage-counter': { textContent: '' },
  'total-multiplier-counter': { textContent: '' },
  'final-result': { textContent: '' },
  'units-slider-content': { innerHTML: '' },
  'synergies-animation-content': { innerHTML: '' },
  'bonuses-animation-content': { innerHTML: '' },
  'combat-progress-fill': { style: { width: '' } },
  'enemy-image-animation': { src: '' },
  'units-slider-content-mobile': { innerHTML: '' },
  'synergies-animation-content-mobile': { innerHTML: '' },
  'bonuses-animation-content-mobile': { innerHTML: '' },
  'boss-damage-gauge': { style: { display: '' } },
  'boss-damage-fill': { style: { width: '' } },
  'boss-damage-current': { textContent: '' },
  'boss-damage-target': { textContent: '' },
  'synergy-upgrade-list': { innerHTML: '' },
  'synergy-upgrade-modal': { remove: jest.fn() }
};

// Configuration des mocks DOM
beforeEach(() => {
  // Reset des mocks
  jest.clearAllMocks();
  
  // Mock de getElementById
  document.getElementById.mockImplementation((id) => {
    return mockDOMElements[id] || null;
  });
  
  // Mock de querySelector
  document.querySelector.mockImplementation((selector) => {
    if (selector === '.combat-animation') {
      return {
        querySelector: jest.fn(() => ({})),
        insertBefore: jest.fn(),
        appendChild: jest.fn()
      };
    }
    if (selector === '.troops-selected') {
      return { parentNode: { insertBefore: jest.fn() } };
    }
    if (selector === '.combat-progress-fill') {
      return { style: { width: '' } };
    }
    if (selector === '.boss-malus-container') {
      return null;
    }
    if (selector === '.boss-mechanic') {
      return null;
    }
    return null;
  });
  
  // Mock de createElement
  document.createElement.mockImplementation((tag) => {
    return {
      className: '',
      innerHTML: '',
      textContent: '',
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false)
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      parentNode: {
        removeChild: jest.fn()
      }
    };
  });
  
  // Mock de localStorage
  localStorage.getItem.mockReturnValue(null);
  localStorage.setItem.mockImplementation(() => {});
});

describe('GameState', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('Initialisation', () => {
    test('devrait initialiser avec les valeurs par défaut', () => {
      expect(gameState.rank).toBe('F-');
      expect(gameState.gold).toBe(100);
      expect(gameState.guildName).toBe('Guilde d\'Aventuriers');
      expect(gameState.availableTroops).toEqual([]);
      expect(gameState.selectedTroops).toEqual([]);
      expect(gameState.combatTroops).toHaveLength(7);
      expect(gameState.unlockedBonuses).toEqual([]);
      expect(gameState.consumables).toEqual([]);
    });

    test('devrait initialiser les statistiques de jeu', () => {
      expect(gameState.gameStats).toBeDefined();
      expect(gameState.gameStats.combatsPlayed).toBe(0);
      expect(gameState.gameStats.goldEarned).toBe(0);
      expect(gameState.gameStats.highestRank).toBe('F-');
    });

    test('devrait initialiser le combat actuel', () => {
      expect(gameState.currentCombat).toBeDefined();
      expect(gameState.currentCombat.isActive).toBe(false);
      expect(gameState.currentCombat.round).toBe(0);
    });
  });

  describe('Gestion des ressources', () => {
    test('devrait ajouter de l\'or correctement', () => {
      const initialGold = gameState.gold;
      gameState.addGold(50);
      expect(gameState.gold).toBe(initialGold + 50);
      expect(gameState.gameStats.goldEarned).toBe(50);
    });

    test('devrait dépenser de l\'or correctement', () => {
      const initialGold = gameState.gold;
      const success = gameState.spendGold(30);
      expect(success).toBe(true);
      expect(gameState.gold).toBe(initialGold - 30);
      expect(gameState.gameStats.goldSpent).toBe(30);
    });

    test('ne devrait pas dépenser plus d\'or que disponible', () => {
      const initialGold = gameState.gold;
      const success = gameState.spendGold(initialGold + 100);
      expect(success).toBe(false);
      expect(gameState.gold).toBe(initialGold);
    });

    test('devrait calculer le bonus de richesse correctement', () => {
      // Test avec différentes valeurs d'or
      gameState.gold = 25;
      expect(gameState.calculateWealthBonus()).toBe(5);
      
      gameState.gold = 75;
      expect(gameState.calculateWealthBonus()).toBe(10);
      
      gameState.gold = 150;
      expect(gameState.calculateWealthBonus()).toBe(15);
      
      gameState.gold = 1000;
      expect(gameState.calculateWealthBonus()).toBe(50);
    });
  });

  describe('Gestion des rangs', () => {
    test('devrait promouvoir le rang correctement', () => {
      const initialRank = gameState.rank;
      gameState.rankProgress = 100;
      gameState.promoteRank();
      expect(gameState.rank).toBe('F');
      expect(gameState.rankProgress).toBe(0);
      expect(gameState.gold).toBe(150); // +50 or pour la promotion
    });

    test('devrait gagner un rang après combat', () => {
      const initialRank = gameState.rank;
      gameState.gainRank();
      expect(gameState.rank).toBe('F');
      expect(gameState.gold).toBe(125); // +25 or pour le gain de rang
      expect(gameState.usedTroopsThisRank).toEqual([]);
    });

    test('devrait calculer l\'objectif de rang correctement', () => {
      expect(gameState.calculateRankTarget()).toBe(100);
      gameState.rank = 'F';
      expect(gameState.calculateRankTarget()).toBe(125);
    });
  });

  describe('Gestion des troupes', () => {
    test('devrait tirer des troupes de combat', () => {
      gameState.combatTroops = [];
      gameState.drawCombatTroops();
      expect(gameState.combatTroops).toHaveLength(7);
      expect(gameState.combatTroops.every(troop => troop.id)).toBe(true);
    });

    test('devrait sélectionner une troupe pour le combat', () => {
      const initialSelected = gameState.selectedTroops.length;
      gameState.selectTroopForCombat(0);
      expect(gameState.selectedTroops).toHaveLength(initialSelected + 1);
      expect(gameState.combatTroops).toHaveLength(6);
    });

    test('ne devrait pas sélectionner plus de 5 troupes', () => {
      // Sélectionner 5 troupes
      for (let i = 0; i < 5; i++) {
        gameState.selectTroopForCombat(i);
      }
      expect(gameState.selectedTroops).toHaveLength(5);
      
      // La 6ème sélection devrait échouer
      gameState.selectTroopForCombat(5);
      expect(gameState.selectedTroops).toHaveLength(5);
    });

    test('devrait désélectionner une troupe', () => {
      gameState.selectTroopForCombat(0);
      const initialSelected = gameState.selectedTroops.length;
      gameState.deselectTroopFromCombat(0);
      expect(gameState.selectedTroops).toHaveLength(initialSelected - 1);
    });
  });

  describe('Calcul des synergies', () => {
    test('devrait calculer les synergies de base', () => {
      const testTroops = [
        { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2 },
        { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2 },
        { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2 }
      ];
      
      const synergies = gameState.calculateSynergies(testTroops);
      expect(synergies.length).toBeGreaterThan(0);
      expect(synergies.some(s => s.name === 'Formation Corps à Corps')).toBe(true);
    });

    test('devrait calculer la Sainte Trinité', () => {
      const testTroops = [
        { name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2 },
        { name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3 },
        { name: 'Soigneur', type: ['Soigneur', 'Magique'], damage: 1, multiplier: 1 }
      ];
      
      const synergies = gameState.calculateSynergies(testTroops);
      expect(synergies.some(s => s.name === 'Sainte Trinité')).toBe(true);
    });

    test('devrait vérifier les types de troupes correctement', () => {
      const troop = { name: 'Épéiste', type: ['Corps à corps', 'Physique'] };
      expect(gameState.hasTroopType(troop, 'Corps à corps')).toBe(true);
      expect(gameState.hasTroopType(troop, 'Physique')).toBe(true);
      expect(gameState.hasTroopType(troop, 'Distance')).toBe(false);
    });
  });

  describe('Gestion des bonus', () => {
    test('devrait débloquer un bonus', () => {
      const initialBonuses = gameState.unlockedBonuses.length;
      const success = gameState.unlockBonus('gold_bonus');
      expect(success).toBe(true);
      expect(gameState.unlockedBonuses).toHaveLength(initialBonuses + 1);
      expect(gameState.unlockedBonuses).toContain('gold_bonus');
    });

    test('ne devrait pas débloquer un bonus invalide', () => {
      const initialBonuses = gameState.unlockedBonuses.length;
      const success = gameState.unlockBonus('bonus_invalide');
      expect(success).toBe(false);
      expect(gameState.unlockedBonuses).toHaveLength(initialBonuses);
    });

    test('devrait calculer les bonus d\'équipement', () => {
      gameState.unlockedBonuses = ['epee_aiguisee', 'epee_aiguisee'];
      const bonuses = gameState.calculateEquipmentBonuses();
      expect(bonuses.length).toBeGreaterThan(0);
      expect(bonuses.some(b => b.name === 'Épée Aiguisée' && b.damage === 4)).toBe(true);
    });

    test('devrait nettoyer les bonus invalides', () => {
      gameState.unlockedBonuses = ['gold_bonus', 'bonus_invalide', 'epee_aiguisee'];
      gameState.cleanInvalidBonuses();
      expect(gameState.unlockedBonuses).toContain('gold_bonus');
      expect(gameState.unlockedBonuses).toContain('epee_aiguisee');
      expect(gameState.unlockedBonuses).not.toContain('bonus_invalide');
    });
  });

  describe('Gestion des combats', () => {
    test('devrait démarrer un combat normal', () => {
      gameState.startNewCombat();
      expect(gameState.currentCombat.isActive).toBe(true);
      expect(gameState.currentCombat.isBossFight).toBe(false);
      expect(gameState.currentCombat.targetDamage).toBeGreaterThan(0);
    });

    test('devrait démarrer un combat de boss aux rangs appropriés', () => {
      gameState.rank = 'F+';
      gameState.startNewCombat();
      expect(gameState.currentCombat.isActive).toBe(true);
      expect(gameState.currentCombat.isBossFight).toBe(true);
      expect(gameState.currentCombat.bossName).toBeDefined();
      expect(gameState.currentCombat.bossMechanic).toBeDefined();
    });

    test('devrait calculer les dégâts d\'un tour', () => {
      const testTroops = [
        { id: 'test1', name: 'Épéiste', type: ['Corps à corps', 'Physique'], damage: 5, multiplier: 2 },
        { id: 'test2', name: 'Archer', type: ['Distance', 'Physique'], damage: 4, multiplier: 3 }
      ];
      
      const damage = gameState.calculateTurnDamage(testTroops);
      expect(damage).toBeGreaterThan(0);
      expect(typeof damage).toBe('number');
    });

    test('devrait terminer un combat victorieux', () => {
      gameState.startNewCombat();
      gameState.currentCombat.totalDamage = gameState.currentCombat.targetDamage;
      gameState.endCombat(true);
      
      expect(gameState.currentCombat.isActive).toBe(false);
      expect(gameState.gameStats.combatsWon).toBe(1);
      expect(gameState.gameStats.combatsPlayed).toBe(1);
    });

    test('devrait terminer un combat en défaite', () => {
      gameState.startNewCombat();
      gameState.currentCombat.round = 5;
      gameState.endCombat(false);
      
      expect(gameState.currentCombat.isActive).toBe(false);
      expect(gameState.gameStats.combatsLost).toBe(1);
      expect(gameState.gameStats.combatsPlayed).toBe(1);
    });
  });

  describe('Gestion des consomables', () => {
    test('devrait ajouter un consommable', () => {
      const initialCount = gameState.consumables.length;
      gameState.addConsumable('refreshShop');
      expect(gameState.consumables).toHaveLength(initialCount + 1);
      expect(gameState.consumables[0].type).toBe('refreshShop');
    });

    test('ne devrait pas dépasser la limite de 3 consomables', () => {
      gameState.addConsumable('refreshShop');
      gameState.addConsumable('transformSword');
      gameState.addConsumable('upgradeSynergy');
      gameState.addConsumable('transformArcher'); // Devrait échouer
      
      expect(gameState.consumables).toHaveLength(3);
    });

    test('devrait utiliser un consommable', () => {
      gameState.addConsumable('refreshShop');
      const consumableId = gameState.consumables[0].id;
      const success = gameState.useConsumable(consumableId);
      expect(success).toBe(true);
    });
  });

  describe('Sauvegarde et chargement', () => {
    test('devrait sauvegarder l\'état du jeu', () => {
      gameState.gold = 500;
      gameState.rank = 'E';
      gameState.save();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'guildMasterSave',
        expect.stringContaining('"gold":500')
      );
    });

    test('devrait charger l\'état du jeu', () => {
      const saveData = {
        rank: 'E',
        gold: 500,
        guildName: 'Test Guild',
        availableTroops: [],
        selectedTroops: [],
        combatTroops: [],
        usedTroopsThisRank: [],
        combatHistory: [],
        isFirstTime: false,
        unlockedBonuses: [],
        gameStats: {
          combatsPlayed: 0,
          combatsWon: 0,
          combatsLost: 0,
          goldSpent: 0,
          goldEarned: 0,
          unitsPurchased: 0,
          bonusesPurchased: 0,
          unitsUsed: {},
          maxDamageInTurn: 0,
          bestTurnDamage: 0,
          bestTurnRound: 0,
          totalDamageDealt: 0,
          highestRank: 'F-',
          startTime: Date.now()
        },
        currentCombat: {
          targetDamage: 0,
          totalDamage: 0,
          round: 0,
          maxRounds: 5,
          isActive: false,
          isBossFight: false,
          bossName: '',
          bossMechanic: ''
        },
        currentShopItems: null,
        consumables: [],
        transformedBaseUnits: {},
        synergyLevels: {
          'Formation Corps à Corps': 1,
          'Formation Distance': 1,
          'Formation Magique': 1,
          'Horde Corps à Corps': 1,
          'Volée de Flèches': 1,
          'Tempête Magique': 1,
          'Tactique Mixte': 1,
          'Force Physique': 1
        }
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(saveData));
      const success = gameState.load();
      
      expect(success).toBe(true);
      expect(gameState.rank).toBe('E');
      expect(gameState.gold).toBe(500);
      expect(gameState.guildName).toBe('Test Guild');
    });

    test('devrait gérer l\'absence de sauvegarde', () => {
      localStorage.getItem.mockReturnValue(null);
      const success = gameState.load();
      expect(success).toBe(false);
    });
  });

  describe('Nouvelle partie', () => {
    test('devrait réinitialiser complètement l\'état du jeu', () => {
      // Modifier l'état
      gameState.gold = 1000;
      gameState.rank = 'S';
      gameState.guildName = 'Test Guild';
      gameState.unlockedBonuses = ['gold_bonus'];
      gameState.consumables = [{ type: 'refreshShop' }];
      
      // Nouvelle partie
      gameState.newGame();
      
      expect(gameState.rank).toBe('F-');
      expect(gameState.gold).toBe(100);
      expect(gameState.guildName).toBe('Guilde d\'Aventuriers');
      expect(gameState.unlockedBonuses).toEqual([]);
      expect(gameState.consumables).toEqual([]);
      expect(gameState.gameStats.combatsPlayed).toBe(0);
    });
  });

  describe('Gestion du magasin', () => {
    test('devrait générer des items de magasin', () => {
      const items = gameState.generateShopItems();
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(8);
      
      // Vérifier qu'il y a au moins un item
      const firstItem = items[0];
      expect(firstItem).toHaveProperty('type');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('price');
    });

    test('devrait rafraîchir le magasin', () => {
      const initialGold = gameState.gold;
      gameState.shopRefreshCost = 10;
      
      gameState.refreshShop();
      
      expect(gameState.gold).toBe(initialGold - 10);
      expect(gameState.shopRefreshCount).toBe(1);
      expect(gameState.shopRefreshCost).toBe(15); // 10 + (1 * 5)
    });

    test('ne devrait pas rafraîchir sans assez d\'or', () => {
      gameState.gold = 5;
      gameState.shopRefreshCost = 10;
      const initialGold = gameState.gold;
      
      gameState.refreshShop();
      
      expect(gameState.gold).toBe(initialGold); // Ne devrait pas changer
    });
  });

  describe('Transformations d\'unités', () => {
    test('devrait transformer une unité de base', () => {
      gameState.addConsumable('transformSword');
      const initialTransformed = gameState.transformedBaseUnits['Épéiste'] || 0;
      
      gameState.transformUnitFromModal('Épéiste', 'Archer');
      
      expect(gameState.transformedBaseUnits['Épéiste']).toBe(initialTransformed + 1);
      expect(gameState.consumables).toHaveLength(0); // Consommable consommé
    });

    test('ne devrait pas transformer sans consommable', () => {
      const initialTroops = gameState.availableTroops.length;
      
      gameState.transformUnitFromModal('Épéiste', 'Archer');
      
      expect(gameState.availableTroops.length).toBe(initialTroops); // Ne devrait pas changer
    });
  });

  describe('Amélioration des synergies', () => {
    test('devrait améliorer une synergie', () => {
      gameState.addConsumable('upgradeSynergy');
      const initialLevel = gameState.synergyLevels['Formation Corps à Corps'];
      
      gameState.upgradeSynergy('Formation Corps à Corps');
      
      expect(gameState.synergyLevels['Formation Corps à Corps']).toBe(initialLevel + 1);
      expect(gameState.consumables).toHaveLength(0); // Consommable consommé
    });
  });

  describe('Utilitaires', () => {
    test('devrait obtenir l\'icône de rareté', () => {
      expect(gameState.getRarityIcon('common')).toBe('⚪');
      expect(gameState.getRarityIcon('uncommon')).toBe('🟢');
      expect(gameState.getRarityIcon('rare')).toBe('🔵');
      expect(gameState.getRarityIcon('epic')).toBe('🟣');
      expect(gameState.getRarityIcon('legendary')).toBe('🟡');
    });

    test('devrait obtenir la couleur de rareté', () => {
      expect(gameState.getRarityColor('common')).toBe('#666666');
      expect(gameState.getRarityColor('uncommon')).toBe('#00b894');
      expect(gameState.getRarityColor('rare')).toBe('#74b9ff');
      expect(gameState.getRarityColor('epic')).toBe('#a29bfe');
      expect(gameState.getRarityColor('legendary')).toBe('#fdcb6e');
    });

    test('devrait obtenir l\'icône d\'une unité', () => {
      expect(gameState.getUnitIcon('Épéiste')).toBe('⚔️');
      expect(gameState.getUnitIcon('Archer')).toBe('🏹');
      expect(gameState.getUnitIcon('Unité Inconnue')).toBe('❓');
    });
  });
}); 