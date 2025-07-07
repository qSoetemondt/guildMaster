// Configuration globale pour les tests Jest
global.console = {
  ...console,
  // Réduire le bruit des logs dans les tests
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock des éléments DOM globaux
global.document = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  createElement: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
};

global.window = {
  ...global.window,
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  setTimeout: jest.fn(),
  clearTimeout: jest.fn(),
};

// Mock des fonctions de notification
global.showNotification = jest.fn();

// Mock des fonctions d'animation
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(); 