/**
 * VIKING JOURNEY - Core Engine
 */

const SAVE_KEY = 'viking_journey_save_v1';
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;

// Fallback procedural visual tiles
const createPattern = (bg, border) =>
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="${bg}" stroke="${border}" stroke-width="2"/></svg>`;

const TILE_TYPES = {
  WALL_CASTLE: { id: 'wall_castle', symbol: '🏰', walkable: false, color: '#3b4252', bg: createPattern('%233b4252', '%232e3440') },
  WALL_HOUSE: { id: 'wall_house', symbol: '🏠', walkable: false, color: '#4c566a', bg: createPattern('%235e4b3c', '%233e2f23') },
  WALL_CAVE: { id: 'wall_cave', symbol: '🪨', walkable: false, color: '#2e3440', bg: createPattern('%23282c34', '%231e222a') },
  WALL_ROCK: { id: 'wall_rock', symbol: '⛰️', walkable: false, color: '#2e3440', bg: createPattern('%23373e4d', '%23242933') },
  LAVA: { id: 'lava', symbol: '🔥', walkable: false, color: '#bf616a', bg: createPattern('%23bf616a', '%23d08770') },
  WATER_LAKE: { id: 'water_lake', symbol: '💧', walkable: false, color: '#5e81ac', bg: createPattern('%23434c5e', '%235e81ac') },
  GROUND_FIELD: { id: 'ground_field', symbol: '', walkable: true, color: '#2f3b2f', bg: createPattern('%232e3b2e', '%23394639') },
  GROUND_STONE: { id: 'ground_stone', symbol: '', walkable: true, color: '#434c5e', bg: createPattern('%233b4252', '%234c566a') },
  DOORWAY_HOUSE: { id: 'door_house', symbol: '🚪', walkable: true, action: 'travel', bg: createPattern('%235e4b3c', '%23a3be8c') },
  DOORWAY_CAVE: { id: 'door_cave', symbol: '🕳️', walkable: true, action: 'travel', bg: createPattern('%231e222a', '%23ebcb8b') }
};

const ENCOUNTER_TYPES = [
  { type: 'enemy', name: 'Draugr', description: 'A restless undead warrior.', challenge: 1 },
  { type: 'treasure', name: 'Gilded Chest', description: 'A chest containing ancient iron and gold.', challenge: 0 },
  { type: 'npc', name: 'Wandering Skald', description: 'A traveler sharing news from the south.', challenge: 0 }
];

const GAME_PATHS = [
  { id: 'huscarl', name: 'Huscarl', focus: 'Strength', desc: 'A shield-bearer specializing in brute force and heavy armor.' },
  { id: 'volva', name: 'Völva', focus: 'Intellect', desc: 'A weaver of Seiðr runes manipulating energy and warding.' },
  { id: 'skirmisher', name: 'Skirmisher', focus: 'Agility', desc: 'A swift tracker striking targets with quick strikes.' }
];

// Universal Item System with Class Dynamic Stat Resolution
const ITEM_DEFINITIONS = {
  seax: {
    name: 'Iron Seax',
    slot: 'mainhand',
    getStats: (path) => {
      if (path === 'huscarl') return { attack: 8, staminaMax: 10 };
      if (path === 'volva') return { attack: 4, focusRegen: 2 };
      return { attack: 6, critRate: 5 }; // skirmisher
    }
  },
  tunic: {
    name: 'Boiled Leather',
    slot: 'chest',
    getStats: (path) => {
      if (path === 'huscarl') return { defense: 8 };
      if (path === 'volva') return { defense: 4, manaMax: 20 };
      return { defense: 6, evasion: 4 };
    }
  }
};

const DAY_CYCLE = [
  { start: 6, end: 11, emoji: '🌄', id: 'Morning', color: '#d08770', danger: false },
  { start: 12, end: 17, emoji: '☀️', id: 'Day', color: '#ebcb8b', danger: false },
  { start: 18, end: 21, emoji: '🌥️', id: 'Evening', color: '#b48ead', danger: false },
  { start: 22, end: 23, emoji: '🌙', id: 'Dusk', color: '#4c566a', danger: true },
  { start: 0, end: 5, emoji: '🌑', id: 'Dead of Night', color: '#2e3440', danger: true }
];

const gameState = {
  screen: 'title',
  currentLocation: 'Landfall',
  currentMap: [],
  playerPos: { x: -1, y: -1 },
  time: { hour: 6, day: 1 },
  player: {
    level: 1,
    gender: null,
    path: null,
    maxHP: 100,
    currentHP: 100,
    maxStamina: 100,
    stamina: 100,
    exhaustion: 0,
    gear: {
      head: null,
      chest: 'tunic',
      mainhand: 'seax',
      offhand: null,
      boots: null
    },
    stats: { strength: 10, intellect: 10, agility: 10 }
  }
};

// --- DOM REFERENCES ---
const screens = {
  title: document.getElementById('title-screen'),
  charSelect: document.getElementById('char-select-screen'),
  gameInterface: document.getElementById('game-interface')
};
const gameMapDiv = document.getElementById('game-map');
const gameConsole = document.getElementById('game-console');
const dayNightCycleDiv = document.getElementById('day-night-cycle');
const sunMoonTracker = document.getElementById('sun-moon-tracker');
const locationName = document.getElementById('location-name');
const continueButton = document.getElementById('continue-game-button');

// --- STORAGE SYSTEM ---
function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  logToConsole('Journey progress recorded in the runes (Saved).');
}

function loadSaveData() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// --- CONSOLE & UTILITY ---
function logToConsole(message) {
  const p = document.createElement('p');
  p.textContent = `> ${message}`;
  gameConsole.prepend(p);
  while (gameConsole.children.length > 30) {
    gameConsole.removeChild(gameConsole.lastChild);
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCurrentPhase() {
  const { hour } = gameState.time;
  return DAY_CYCLE.find(phase => {
    if (phase.start <= phase.end) {
      return hour >= phase.start && hour <= phase.end;
    }
    return hour >= phase.start || hour <= phase.end;
  }) || DAY_CYCLE[0];
}

// --- RENDERING & TIME ---
function updateTimeTracker() {
  const phase = getCurrentPhase();
  sunMoonTracker.textContent = phase.emoji;
  locationName.textContent = `${gameState.currentLocation} — ${phase.id} (Day ${gameState.time.day}, ${String(gameState.time.hour).padStart(2, '0')}:00)`;
}

function advanceTime(hours = 1) {
  gameState.time.hour += hours;
  while (gameState.time.hour >= 24) {
    gameState.time.hour -= 24;
    gameState.time.day += 1;
  }

  // Energy & Exhaustion step
  gameState.player.exhaustion = Math.min(100, gameState.player.exhaustion + hours * 2);
  gameState.player.stamina = Math.max(0, gameState.player.stamina - hours * 3);

  updateTimeTracker();
  updateVitalsDisplay();
  saveGame();
}

function updateVitalsDisplay() {
  const { currentHP, maxHP, stamina, maxStamina } = gameState.player;
  document.getElementById('blood-meter-fill').style.width = `${(currentHP / maxHP) * 100}%`;
  document.getElementById('hp-value').textContent = `${Math.round(currentHP)} / ${maxHP}`;

  document.getElementById('stamina-meter-fill').style.width = `${(stamina / maxStamina) * 100}%`;
  document.getElementById('stamina-value').textContent = `${Math.round(stamina)} / ${maxStamina}`;

  const attrList = document.getElementById('attribute-list');
  attrList.innerHTML = '';
  Object.entries(gameState.player.stats).forEach(([stat, val]) => {
    const li = document.createElement('li');
    li.textContent = `${stat.toUpperCase()}: ${val}`;
    attrList.appendChild(li);
  });
}

// --- MAP & PATHFINDING ---
class TileData {
  constructor(x, y, type, encounter = null) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.currentEncounter = encounter;
    this.visited = false;
  }
}

function buildMap(name = 'Landfall') {
  gameState.currentLocation = name;
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[y][x] = new TileData(x, y, TILE_TYPES.WALL_ROCK);
    }
  }

  // Random walk path carver
  let curX = Math.floor(MAP_WIDTH / 2);
  let curY = Math.floor(MAP_HEIGHT / 2);
  const steps = MAP_WIDTH * MAP_HEIGHT * 0.35;
  const pathTiles = [];

  for (let i = 0; i < steps; i++) {
    map[curY][curX].type = TILE_TYPES.GROUND_FIELD;
    pathTiles.push({ x: curX, y: curY });

    const dir = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }][getRandomInt(0, 3)];
    curX = Math.max(1, Math.min(MAP_WIDTH - 2, curX + dir.x));
    curY = Math.max(1, Math.min(MAP_HEIGHT - 2, curY + dir.y));
  }

  // Place doorway & encounters
  pathTiles.forEach(({ x, y }) => {
    if (Math.random() < 0.04) {
      map[y][x].currentEncounter = ENCOUNTER_TYPES[getRandomInt(0, ENCOUNTER_TYPES.length - 1)];
    }
  });

  const lastTile = pathTiles[pathTiles.length - 1];
  map[lastTile.y][lastTile.x].type = TILE_TYPES.DOORWAY_HOUSE;
  map[lastTile.y][lastTile.x].currentEncounter = null;

  gameState.currentMap = map;
  gameState.playerPos = { x: pathTiles[0].x, y: pathTiles[0].y };
  gameState.currentMap[pathTiles[0].y][pathTiles[0].x].visited = true;
}

function renderMap() {
  gameMapDiv.innerHTML = '';
  const { x: px, y: py } = gameState.playerPos;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = gameState.currentMap[y][x];
      const el = document.createElement('div');
      el.classList.add('tile');
      el.style.backgroundImage = `url("${tile.type.bg}")`;

      if (x === px && y === py) el.classList.add('player');
      if (tile.visited) el.classList.add('visited');

      const isAdjacent = Math.abs(x - px) + Math.abs(y - py) === 1;
      if (isAdjacent && tile.type.walkable) {
        el.classList.add('can-move');
        el.addEventListener('click', () => movePlayer(x, y));
      }

      if (tile.currentEncounter) {
        el.textContent = tile.currentEncounter.type === 'enemy' ? '💀' : '📦';
      } else if (tile.type.symbol) {
        el.textContent = tile.type.symbol;
      }

      gameMapDiv.appendChild(el);
    }
  }
}

function movePlayer(nx, ny) {
  const tile = gameState.currentMap[ny][nx];
  if (!tile.type.walkable) return;

  advanceTime(1);
  gameState.playerPos = { x: nx, y: ny };
  tile.visited = true;
  renderMap();
  inspectCurrentTile(tile);
}

function inspectCurrentTile(tile) {
  const encName = document.getElementById('encounter-name');
  const encDesc = document.getElementById('encounter-description');
  const encActions = document.getElementById('encounter-actions');
  encActions.innerHTML = '';

  if (tile.currentEncounter) {
    const enc = tile.currentEncounter;
    const isNight = getCurrentPhase().danger;
    encName.textContent = enc.name + (isNight && enc.type === 'enemy' ? ' (Frenzied by Night)' : '');
    encDesc.textContent = enc.description;

    const btn = document.createElement('button');
    btn.textContent = `Engage ${enc.name}`;
    btn.onclick = () => {
      logToConsole(`You interact with ${enc.name}.`);
      tile.currentEncounter = null;
      renderMap();
      inspectCurrentTile(tile);
    };
    encActions.appendChild(btn);
  } else if (tile.type.action === 'travel') {
    encName.textContent = 'Threshold';
    encDesc.textContent = 'A weathered portal leads into another quarter.';
    const btn = document.createElement('button');
    btn.textContent = 'Step Through';
    btn.onclick = () => {
      buildMap(gameState.currentLocation === 'Landfall' ? "Trader's Stead" : 'Landfall');
      renderMap();
    };
    encActions.appendChild(btn);
  } else {
    encName.textContent = 'Wilderness';
    encDesc.textContent = 'Cold wind cuts through your furs. No immediate danger.';
  }

  // Rest option
  const restBtn = document.createElement('button');
  restBtn.textContent = 'Rest & Recover (6 Hours)';
  restBtn.onclick = restPlayer;
  encActions.appendChild(restBtn);
}

function restPlayer() {
  const isNight = getCurrentPhase().danger;
  logToConsole('You make camp and rest your eyes...');
  if (isNight && Math.random() < 0.25) {
    logToConsole('Prowlers strike while you sleep! You awake to cold steel.');
    gameState.player.currentHP = Math.max(1, gameState.player.currentHP - 20);
  } else {
    gameState.player.currentHP = Math.min(gameState.player.maxHP, gameState.player.currentHP + 35);
    gameState.player.stamina = gameState.player.maxStamina;
    gameState.player.exhaustion = Math.max(0, gameState.player.exhaustion - 50);
    logToConsole('You awaken feeling restored.');
  }
  advanceTime(6);
}

// --- SETUP & BOOTSTRAP ---
function switchScreen(id) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[id].classList.remove('hidden');
  gameState.screen = id;
}

function initializeGameInterface() {
  document.getElementById('char-name-display').textContent =
    gameState.player.gender === 'male' ? 'The Huscarl' : 'The Shieldmaiden';
  document.getElementById('char-class-display').textContent = `Path: ${gameState.player.path.toUpperCase()}`;

  // Gear labels
  Object.entries(gameState.player.gear).forEach(([slot, itemId]) => {
    const slotEl = document.getElementById(`slot-${slot}`);
    if (slotEl) {
      const item = ITEM_DEFINITIONS[itemId];
      slotEl.textContent = `${slot.toUpperCase()}: ${item ? item.name : 'Empty'}`;
    }
  });

  updateTimeTracker();
  updateVitalsDisplay();
  renderMap();
}

// Check for existing save
const existingSave = loadSaveData();
if (existingSave) {
  continueButton.classList.remove('hidden');
  continueButton.addEventListener('click', () => {
    Object.assign(gameState, existingSave);
    switchScreen('gameInterface');
    initializeGameInterface();
    logToConsole('Restored journey from memory.');
  });
}

document.getElementById('start-game-button').onclick = () => switchScreen('charSelect');

document.querySelectorAll('#gender-selection .choice-btn').forEach(btn => {
  btn.onclick = (e) => {
    gameState.player.gender = e.currentTarget.dataset.gender;
    document.querySelectorAll('#gender-selection .choice-btn').forEach(b => b.classList.remove('selected'));
    e.currentTarget.classList.add('selected');
    document.getElementById('class-selection').classList.remove('hidden');

    const container = document.querySelector('#class-selection .choice-buttons');
    container.innerHTML = '';
    GAME_PATHS.forEach(path => {
      const b = document.createElement('button');
      b.className = 'choice-btn';
      b.textContent = path.name;
      b.onclick = () => {
        gameState.player.path = path.id;
        document.querySelectorAll('#class-selection .choice-btn').forEach(pb => pb.classList.remove('selected'));
        b.classList.add('selected');
        document.getElementById('path-choice-text').textContent = `${path.name}: ${path.desc}`;
        document.getElementById('confirm-char-button').disabled = false;
      };
      container.appendChild(b);
    });
  };
});

document.getElementById('confirm-char-button').onclick = () => {
  buildMap('Landfall');
  switchScreen('gameInterface');
  initializeGameInterface();
};

document.getElementById('manual-save-button').onclick = saveGame;