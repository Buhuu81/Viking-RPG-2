/**
 * VIKING JOURNEY - Master Game Engine
 * Features: Restored Day/Night segmented bar, exhaustion mechanics, 
 * dynamic class-based gear parsing, and robust localStorage persistence.
 */

const STORAGE_VERSION_KEY = 'viking_journey_save_v2';
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;

// Procedural SVG fallback textures with Norse color palette
const createTileSvg = (bg, stroke) =>
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" fill="${bg}" stroke="${stroke}" stroke-width="2"/></svg>`;

const TILE_TYPES = {
  WALL_ROCK: { id: 'wall_rock', symbol: '⛰️', walkable: false, bg: createTileSvg('%2320252f', '%23141820') },
  GROUND_FIELD: { id: 'ground_field', symbol: '', walkable: true, bg: createTileSvg('%23232c25', '%232e3b30') },
  GROUND_STONE: { id: 'ground_stone', symbol: '', walkable: true, bg: createTileSvg('%23333a47', '%23262b35') },
  DOORWAY_HOUSE: { id: 'door_house', symbol: '🚪', walkable: true, action: 'travel', bg: createTileSvg('%23443322', '%23c9933b') },
  DOORWAY_CAVE: { id: 'door_cave', symbol: '🕳️', walkable: true, action: 'travel', bg: createTileSvg('%23161a22', '%235e81ac') }
};

const ENCOUNTER_TYPES = [
  { type: 'enemy', name: 'Draugr Sentry', description: 'A withered undead warrior clad in rusted chainmail.', challenge: 1, symbol: '💀' },
  { type: 'treasure', name: 'Buried Chest', description: 'An iron-banded chest half-swallowed by ice.', challenge: 0, symbol: '📦' },
  { type: 'npc', name: 'Lost Skald', description: 'A singer of verses warming his hands by embers.', challenge: 0, symbol: '🧙' }
];

const GAME_PATHS = [
  { id: 'huscarl', name: 'Huscarl', focus: 'Strength & Warding', desc: 'Heavy shield-bearer who thrives on front-line attrition.' },
  { id: 'volva', name: 'Völva', focus: 'Intellect & Seiðr', desc: 'Weaver of runic magic manipulating life and energy.' },
  { id: 'skirmisher', name: 'Skirmisher', focus: 'Agility & Lethality', desc: 'Fast tracker dealing precision strikes and evasion.' }
];

// Universal Gear Table: Dynamic stat computation per active calling
const GEAR_REGISTRY = {
  seax: {
    id: 'seax',
    name: 'Iron Seax',
    slot: 'mainhand',
    resolveStats: (path) => {
      if (path === 'huscarl') return { attack: 7, block: 4 };
      if (path === 'volva') return { attack: 3, runePower: 6 };
      return { attack: 6, critRate: 6 }; // Skirmisher
    }
  },
  leather: {
    id: 'leather',
    name: 'Boiled Leather',
    slot: 'chest',
    resolveStats: (path) => {
      if (path === 'huscarl') return { defense: 8, poise: 5 };
      if (path === 'volva') return { defense: 4, manaMax: 25 };
      return { defense: 6, evasion: 5 }; // Skirmisher
    }
  },
  shield: {
    id: 'shield',
    name: 'Wooden Shield',
    slot: 'offhand',
    resolveStats: (path) => {
      if (path === 'huscarl') return { block: 10, hpMax: 20 };
      if (path === 'volva') return { block: 4, ward: 8 };
      return { block: 5, parry: 5 };
    }
  },
  wraps: {
    id: 'wraps',
    name: 'Fur Wraps',
    slot: 'boots',
    resolveStats: () => ({ moveStaminaCost: -1 })
  }
};

const DAY_HOURS = [
  { hour: 6, label: 'Dawn', color: '#8a5c36' },
  { hour: 7, label: 'Morning', color: '#b87c42' },
  { hour: 8, label: 'Morning', color: '#c9933b' },
  { hour: 9, label: 'Morning', color: '#d8aa53' },
  { hour: 10, label: 'Forenoon', color: '#e5bf6c' },
  { hour: 11, label: 'Midday', color: '#ecd07f' },
  { hour: 12, label: 'High Sun', color: '#ffea9f' },
  { hour: 13, label: 'Afternoon', color: '#ecd07f' },
  { hour: 14, label: 'Afternoon', color: '#e5bf6c' },
  { hour: 15, label: 'Afternoon', color: '#d8aa53' },
  { hour: 16, label: 'Afternoon', color: '#c9933b' },
  { hour: 17, label: 'Dusk', color: '#b86b42' },
  { hour: 18, label: 'Twilight', color: '#91534b' },
  { hour: 19, label: 'Twilight', color: '#684058' },
  { hour: 20, label: 'Evening', color: '#453556' },
  { hour: 21, label: 'Nightfall', color: '#2d2d4a' }
];

const NIGHT_HOURS = [
  { hour: 22, label: 'Night', color: '#1a1f33' },
  { hour: 23, label: 'Dead of Night', color: '#121626' },
  { hour: 0, label: 'Midnight', color: '#0b0e1a' },
  { hour: 1, label: 'Witching Hour', color: '#0e1120' },
  { hour: 2, label: 'Deep Night', color: '#121626' },
  { hour: 3, label: 'Wolf Hour', color: '#171c2f' },
  { hour: 4, label: 'False Dawn', color: '#22233b' },
  { hour: 5, label: 'First Light', color: '#4d373b' }
];

// Master State
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
      chest: 'leather',
      mainhand: 'seax',
      offhand: 'shield',
      boots: 'wraps'
    },
    stats: { strength: 12, intellect: 10, agility: 11 }
  }
};

// DOM Handles
const screens = {
  title: document.getElementById('title-screen'),
  charSelect: document.getElementById('char-select-screen'),
  gameInterface: document.getElementById('game-interface')
};

const dayCycleBar = document.getElementById('day-cycle-bar');
const nightCycleBar = document.getElementById('night-cycle-bar');
const sunMoonTracker = document.getElementById('sun-moon-tracker');
const locationName = document.getElementById('location-name');
const cyclePhaseLabel = document.getElementById('cycle-phase-label');
const consoleOutput = document.getElementById('console-output');
const gameMap = document.getElementById('game-map');

// --- INITIAL BUILD OF TIME BARS ---
function buildTimeSegments() {
  dayCycleBar.innerHTML = '';
  nightCycleBar.innerHTML = '';

  DAY_HOURS.forEach(entry => {
    const seg = document.createElement('div');
    seg.classList.add('hour-segment');
    seg.dataset.hour = entry.hour;
    seg.style.backgroundColor = entry.color;
    seg.title = `${entry.hour}:00 - ${entry.label}`;
    dayCycleBar.appendChild(seg);
  });

  NIGHT_HOURS.forEach(entry => {
    const seg = document.createElement('div');
    seg.classList.add('hour-segment');
    seg.dataset.hour = entry.hour;
    seg.style.backgroundColor = entry.color;
    seg.title = `${entry.hour}:00 - ${entry.label}`;
    nightCycleBar.appendChild(seg);
  });
}

function updateTimeTracker() {
  const { hour, day } = gameState.time;
  const isNight = hour >= 22 || hour <= 5;
  const activeHourObj = [...DAY_HOURS, ...NIGHT_HOURS].find(h => h.hour === hour);
  const phaseName = activeHourObj ? activeHourObj.label : (isNight ? 'Night' : 'Day');

  cyclePhaseLabel.textContent = `${phaseName} • Day ${day} (${String(hour).padStart(2, '0')}:00)`;
  locationName.textContent = gameState.currentLocation;

  // Position Sun/Moon marker along active timeline bar
  const activeBar = isNight ? nightCycleBar : dayCycleBar;
  const inactiveBar = isNight ? dayCycleBar : nightCycleBar;
  activeBar.style.opacity = '1';
  inactiveBar.style.opacity = '0.4';

  const segments = Array.from(activeBar.children);
  const currentSeg = segments.find(s => parseInt(s.dataset.hour, 10) === hour);

  if (currentSeg) {
    const barRect = activeBar.getBoundingClientRect();
    const segRect = currentSeg.getBoundingClientRect();
    const parentRect = activeBar.parentElement.getBoundingClientRect();

    const relativeCenter = (segRect.left - parentRect.left) + (segRect.width / 2);
    sunMoonTracker.style.left = `${relativeCenter}px`;
    sunMoonTracker.textContent = isNight ? '🌙' : '☀️';
  }
}

function logEvent(msg) {
  const p = document.createElement('p');
  p.textContent = `> ${msg}`;
  consoleOutput.prepend(p);
  while (consoleOutput.children.length > 25) {
    consoleOutput.removeChild(consoleOutput.lastChild);
  }
}

function saveGame() {
  localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(gameState));
  logEvent('Progress etched into the stone (Game Saved).');
}

function loadSavedGame() {
  const raw = localStorage.getItem(STORAGE_VERSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

// --- PLAYER VITALS & ATTRIBUTES ---
function updateVitals() {
  const p = gameState.player;
  document.getElementById('hp-text').textContent = `${Math.round(p.currentHP)} / ${p.maxHP}`;
  document.getElementById('hp-meter-bar').style.width = `${Math.max(0, (p.currentHP / p.maxHP) * 100)}%`;

  document.getElementById('stamina-text').textContent = `${Math.round(p.stamina)} / ${p.maxStamina}`;
  document.getElementById('stamina-meter-bar').style.width = `${Math.max(0, (p.stamina / p.maxStamina) * 100)}%`;

  document.getElementById('exhaustion-text').textContent = `${Math.round(p.exhaustion)}%`;
  document.getElementById('exhaustion-meter-bar').style.width = `${p.exhaustion}%`;

  // Render Attributes
  const attrBox = document.getElementById('attribute-list');
  attrBox.innerHTML = '';
  Object.entries(p.stats).forEach(([stat, val]) => {
    const pill = document.createElement('div');
    pill.className = 'stat-pill';
    pill.innerHTML = `<span>${stat.toUpperCase()}</span><strong>${val}</strong>`;
    attrBox.appendChild(pill);
  });

  // Gear Doll dynamic text
  Object.entries(p.gear).forEach(([slot, itemId]) => {
    const slotEl = document.querySelector(`#slot-${slot} span`);
    if (slotEl) {
      if (itemId && GEAR_REGISTRY[itemId]) {
        const item = GEAR_REGISTRY[itemId];
        const stats = item.resolveStats(p.path);
        const statLabel = Object.entries(stats).map(([k, v]) => `+${v} ${k}`).join(', ');
        slotEl.textContent = `${item.name} (${statLabel})`;
      } else {
        slotEl.textContent = 'Empty';
      }
    }
  });
}

function advanceTime(hours = 1) {
  gameState.time.hour += hours;
  while (gameState.time.hour >= 24) {
    gameState.time.hour -= 24;
    gameState.time.day += 1;
  }

  // Stamina and exhaustion progression
  const p = gameState.player;
  const exhaustionMultiplier = 1 + (p.exhaustion / 100);
  p.stamina = Math.max(0, p.stamina - (hours * 2 * exhaustionMultiplier));
  p.exhaustion = Math.min(100, p.exhaustion + (hours * 1.5));

  if (p.stamina === 0) {
    p.currentHP = Math.max(1, p.currentHP - (hours * 3));
    logEvent('You are exhausted and starving! Health is withering away.');
  }

  updateTimeTracker();
  updateVitals();
  saveGame();
}

// --- MAP & PATHFINDING ---
function generateMap(name = 'Landfall') {
  gameState.currentLocation = name;
  const map = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[y][x] = {
        x, y,
        type: TILE_TYPES.WALL_ROCK,
        encounter: null,
        visited: false
      };
    }
  }

  // Carve walkable path
  let curX = Math.floor(MAP_WIDTH / 2);
  let curY = Math.floor(MAP_HEIGHT / 2);
  const steps = MAP_WIDTH * MAP_HEIGHT * 0.35;
  const carvedTiles = [];

  for (let i = 0; i < steps; i++) {
    map[curY][curX].type = TILE_TYPES.GROUND_FIELD;
    carvedTiles.push({ x: curX, y: curY });

    const dir = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }][Math.floor(Math.random() * 4)];
    curX = Math.max(1, Math.min(MAP_WIDTH - 2, curX + dir.x));
    curY = Math.max(1, Math.min(MAP_HEIGHT - 2, curY + dir.y));
  }

  // Scatter encounters
  carvedTiles.forEach(({ x, y }) => {
    if (Math.random() < 0.05) {
      map[y][x].encounter = ENCOUNTER_TYPES[Math.floor(Math.random() * ENCOUNTER_TYPES.length)];
    }
  });

  // End doorway
  const last = carvedTiles[carvedTiles.length - 1];
  map[last.y][last.x].type = TILE_TYPES.DOORWAY_HOUSE;
  map[last.y][last.x].encounter = null;

  gameState.currentMap = map;
  gameState.playerPos = { x: carvedTiles[0].x, y: carvedTiles[0].y };
  gameState.currentMap[carvedTiles[0].y][carvedTiles[0].x].visited = true;
}

function renderMap() {
  gameMap.innerHTML = '';
  const { x: px, y: py } = gameState.playerPos;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = gameState.currentMap[y][x];
      const cell = document.createElement('div');
      cell.className = 'tile';
      cell.style.backgroundImage = `url("${tile.type.bg}")`;

      if (x === px && y === py) cell.classList.add('player');
      if (tile.visited) cell.classList.add('visited');

      const isAdjacent = Math.abs(x - px) + Math.abs(y - py) === 1;
      if (isAdjacent && tile.type.walkable) {
        cell.classList.add('can-move');
        cell.addEventListener('click', () => stepTo(x, y));
      }

      if (tile.encounter) {
        cell.textContent = tile.encounter.symbol;
      } else if (tile.type.symbol) {
        cell.textContent = tile.type.symbol;
      }

      gameMap.appendChild(cell);
    }
  }
}

function stepTo(nx, ny) {
  const tile = gameState.currentMap[ny][nx];
  if (!tile.type.walkable) return;

  advanceTime(1);
  gameState.playerPos = { x: nx, y: ny };
  tile.visited = true;
  renderMap();
  inspectTile(tile);
}

function inspectTile(tile) {
  const titleEl = document.getElementById('encounter-title');
  const descEl = document.getElementById('encounter-desc');
  const iconEl = document.getElementById('encounter-icon');
  const actionsEl = document.getElementById('encounter-actions');
  actionsEl.innerHTML = '';

  if (tile.encounter) {
    const enc = tile.encounter;
    const isNight = gameState.time.hour >= 22 || gameState.time.hour <= 5;
    iconEl.textContent = enc.symbol;
    titleEl.textContent = enc.name + (isNight && enc.type === 'enemy' ? ' [Frenzied]' : '');
    descEl.textContent = enc.description;

    const actBtn = document.createElement('button');
    actBtn.className = 'rune-btn';
    actBtn.textContent = `Interact with ${enc.name}`;
    actBtn.onclick = () => {
      logEvent(`You resolved the encounter with ${enc.name}.`);
      tile.encounter = null;
      renderMap();
      inspectTile(tile);
    };
    actionsEl.appendChild(actBtn);
  } else if (tile.type.action === 'travel') {
    iconEl.textContent = '🚪';
    titleEl.textContent = 'Longhouse Threshold';
    descEl.textContent = 'A carved wooden entryway leading to an interior hall.';

    const enterBtn = document.createElement('button');
    enterBtn.className = 'rune-btn';
    enterBtn.textContent = 'Enter Threshold';
    enterBtn.onclick = () => {
      const nextArea = gameState.currentLocation === 'Landfall' ? 'Chieftain Longhouse' : 'Landfall';
      generateMap(nextArea);
      renderMap();
      logEvent(`You passed through the doorway into ${nextArea}.`);
      updateTimeTracker();
    };
    actionsEl.appendChild(enterBtn);
  } else {
    iconEl.textContent = '🏕️';
    titleEl.textContent = 'Open Wilderness';
    descEl.textContent = 'Rough terrain stretches in every direction. Safe to set camp.';
  }

  // Rest button
  const restBtn = document.createElement('button');
  restBtn.className = 'rune-btn';
  restBtn.textContent = 'Make Camp & Rest (6h)';
  restBtn.onclick = () => restPlayer();
  actionsEl.appendChild(restBtn);
}

function restPlayer() {
  const hour = gameState.time.hour;
  const isNight = hour >= 22 || hour <= 5;
  logEvent('You build a small fire and rest...');

  if (isNight && Math.random() < 0.3) {
    logEvent('A nocturnal predator stalks into camp! Rest interrupted.');
    gameState.player.currentHP = Math.max(5, gameState.player.currentHP - 15);
  } else {
    gameState.player.stamina = gameState.player.maxStamina;
    gameState.player.exhaustion = Math.max(0, gameState.player.exhaustion - 40);
    gameState.player.currentHP = Math.min(gameState.player.maxHP, gameState.player.currentHP + 30);
    logEvent('You awaken with your stamina restored and exhaustion alleviated.');
  }

  advanceTime(6);
}

// --- NAVIGATION & INIT ---
function switchScreen(screenName) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[screenName].classList.remove('hidden');
  gameState.screen = screenName;
}

function bootGameplay() {
  document.getElementById('char-name-display').textContent =
    gameState.player.gender === 'male' ? 'The Huscarl' : 'The Shieldmaiden';
  document.getElementById('char-class-badge').textContent = gameState.player.path;

  buildTimeSegments();
  updateTimeTracker();
  updateVitals();

  if (gameState.currentMap.length === 0) {
    generateMap('Landfall');
  }
  renderMap();
  inspectTile(gameState.currentMap[gameState.playerPos.y][gameState.playerPos.x]);
}

// Setup Event Handlers
document.getElementById('start-game-button').onclick = () => switchScreen('charSelect');

const savedState = loadSavedGame();
if (savedState) {
  const contBtn = document.getElementById('continue-game-button');
  contBtn.classList.remove('hidden');
  contBtn.onclick = () => {
    Object.assign(gameState, savedState);
    switchScreen('gameInterface');
    bootGameplay();
    logEvent('Saga resumed from your last resting place.');
  };
}

document.querySelectorAll('#gender-selection .choice-btn').forEach(btn => {
  btn.onclick = (e) => {
    gameState.player.gender = e.currentTarget.dataset.gender;
    document.querySelectorAll('#gender-selection .choice-btn').forEach(b => b.classList.remove('selected'));
    e.currentTarget.classList.add('selected');
    document.getElementById('gender-choice-text').textContent = `Chosen: ${e.currentTarget.textContent}`;

    const classBox = document.getElementById('class-selection');
    classBox.classList.remove('hidden');

    const btnContainer = document.getElementById('class-buttons-container');
    btnContainer.innerHTML = '';

    GAME_PATHS.forEach(p => {
      const b = document.createElement('button');
      b.className = 'choice-btn';
      b.textContent = p.name;
      b.onclick = () => {
        gameState.player.path = p.id;
        document.querySelectorAll('#class-buttons-container .choice-btn').forEach(cb => cb.classList.remove('selected'));
        b.classList.add('selected');
        document.getElementById('path-choice-text').textContent = `${p.name}: ${p.desc} (${p.focus})`;
        document.getElementById('confirm-char-button').disabled = false;
      };
      btnContainer.appendChild(b);
    });
  };
});

document.getElementById('confirm-char-button').onclick = () => {
  switchScreen('gameInterface');
  bootGameplay();
};

document.getElementById('manual-save-btn').onclick = saveGame;