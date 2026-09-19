import './src/style.css';

/**
 * VIKING JOURNEY - Master Game Engine
 * Featuring: Grid Movement, Time Cycle, Drag-and-Drop Inventory, and Dynamic Scaling
 */

const STORAGE_ROSTER_KEY = 'viking_journey_roster_v3';
const STORAGE_CURRENT_HERO_KEY = 'viking_journey_active_hero_id';
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;
const ASSET_PATH = './src/assets/pictures/tiles';

const createTileSvg = (bg, stroke) =>
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><rect width="26" height="26" fill="${bg}" stroke="${stroke}" stroke-width="2"/></svg>`;

const TILE_TYPES = {
  WALL_ROCK: { id: 'wall_rock', name: 'Steep Mountain', symbol: '⛰️', walkable: false, image: `${ASSET_PATH}/wall_rock.png`, fallback: createTileSvg('%2320252f', '%23141820') },
  WALL_CASTLE: { id: 'wall_castle', name: 'Keep Wall', symbol: '🏰', walkable: false, image: `${ASSET_PATH}/wall_castle.png`, fallback: createTileSvg('%231a1e24', '%23333a47') },
  WALL_HOUSE: { id: 'wall_house', name: 'Timber Wall', symbol: '🏠', walkable: false, image: `${ASSET_PATH}/wall_house.png`, fallback: createTileSvg('%23443322', '%23261a10') },
  GROUND_FIELD: { id: 'ground_field', name: 'Frozen Meadow', symbol: '', walkable: true, image: `${ASSET_PATH}/ground_field.png`, fallback: createTileSvg('%23232c25', '%232e3b30') },
  GROUND_ROAD: { id: 'ground_road', name: 'Packed Dirt Road', symbol: '', walkable: true, image: `${ASSET_PATH}/ground_road.png`, fallback: createTileSvg('%233e362a', '%232a241c') },
  GROUND_STONE: { id: 'ground_stone', name: 'Flagstone Walkway', symbol: '', walkable: true, image: `${ASSET_PATH}/stone_floor.png`, fallback: createTileSvg('%23333a47', '%23262b35') },
  GROUND_WOOD: { id: 'ground_wood', name: 'Longhouse Plank', symbol: '', walkable: true, image: `${ASSET_PATH}/ground_wooden_floor.png`, fallback: createTileSvg('%234a3319', '%2338240f') },
  WATER_LAKE: { id: 'water_lake', name: 'Glacial Waters', symbol: '🌊', walkable: false, image: `${ASSET_PATH}/water_lake.png`, fallback: createTileSvg('%2319334d', '%23102234') },
  DOORWAY_HOUSE: { id: 'door_house', name: 'Longhouse Threshold', symbol: '🚪', walkable: true, action: 'travel_house', image: `${ASSET_PATH}/ground_road.png`, fallback: createTileSvg('%23443322', '%23c9933b') },
  DOORWAY_CAVE: { id: 'door_cave', name: 'Cave Mouth', symbol: '🕳️', walkable: true, action: 'travel_cave', image: `${ASSET_PATH}/rock_field.png`, fallback: createTileSvg('%23161a22', '%235e81ac') }
};

const ENCOUNTER_TYPES = [
  { type: 'enemy', name: 'Draugr Sentry', description: 'An undead warrior clad in rusted mail.', threat: 1, hp: 40, maxHp: 40, attackPower: 7, symbol: '💀' },
  { type: 'treasure', name: 'Buried Norse Cache', description: 'An iron chest in the earth.', threat: 0, symbol: '📦' },
  { type: 'npc', name: 'Sigurd the Skald', description: 'A weathered wanderer trading goods.', threat: 0, symbol: '🧙' }
];

const GEAR_REGISTRY = {
  seax: { id: 'seax', name: 'Iron Seax', slot: 'mainhand', rarity: 'common', symbol: '🔪', resolveStats: (c) => c === 'Warrior' ? { attack: 8, rageBonus: 5 } : { attack: 4, spellPower: 6, manaMax: 15 } },
  leather: { id: 'leather', name: 'Boiled Leather', slot: 'chest', rarity: 'common', symbol: '👕', resolveStats: (c) => c === 'Warrior' ? { defense: 8, physicalBlock: 4 } : { defense: 5, manaRegen: 3 } },
  shield: { id: 'shield', name: 'Oak Shield', slot: 'offhand', rarity: 'common', symbol: '🛡️', resolveStats: (c) => c === 'Warrior' ? { blockRate: 12, hpMax: 25 } : { ward: 10, runeSpell: 5 } },
  wraps: { id: 'wraps', name: 'Fur Wraps', slot: 'boots', rarity: 'common', symbol: '👢', resolveStats: () => ({ moveStaminaCost: -1 }) }
};

const DAY_HOURS = [
  { hour: 6, label: 'Dawn', color: '#8a5c36' }, { hour: 7, label: 'Morning', color: '#b87c42' }, { hour: 8, label: 'Morning', color: '#c9933b' },
  { hour: 9, label: 'Morning', color: '#d8aa53' }, { hour: 10, label: 'Forenoon', color: '#e5bf6c' }, { hour: 11, label: 'Midday', color: '#ecd07f' },
  { hour: 12, label: 'High Sun', color: '#ffea9f' }, { hour: 13, label: 'Afternoon', color: '#ecd07f' }, { hour: 14, label: 'Afternoon', color: '#e5bf6c' },
  { hour: 15, label: 'Afternoon', color: '#d8aa53' }, { hour: 16, label: 'Afternoon', color: '#c9933b' }, { hour: 17, label: 'Dusk', color: '#b86b42' },
  { hour: 18, label: 'Twilight', color: '#91534b' }, { hour: 19, label: 'Twilight', color: '#684058' }, { hour: 20, label: 'Evening', color: '#453556' },
  { hour: 21, label: 'Nightfall', color: '#2d2d4a' }
];

const NIGHT_HOURS = [
  { hour: 22, label: 'Night', color: '#1a1f33' }, { hour: 23, label: 'Dead of Night', color: '#121626' }, { hour: 0, label: 'Midnight', color: '#0b0e1a' },
  { hour: 1, label: 'Witching Hour', color: '#0e1120' }, { hour: 2, label: 'Deep Night', color: '#121626' }, { hour: 3, label: 'Wolf Hour', color: '#171c2f' },
  { hour: 4, label: 'False Dawn', color: '#22233b' }, { hour: 5, label: 'First Light', color: '#4d373b' }
];

const CRAFTED_MAPS = {
  Landfall: {
    name: 'Landfall Coast',
    spawn: { x: 9, y: 17 },
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 8, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 2, 2, 2, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 2, 2, 2, 2, 1],
      [1, 0, 0, 0, 6, 6, 6, 0, 0, 3, 0, 0, 0, 0, 0, 2, 2, 2, 2, 1],
      [1, 0, 0, 0, 6, 5, 6, 0, 0, 3, 3, 3, 3, 0, 0, 0, 2, 2, 2, 1],
      [1, 0, 0, 0, 6, 7, 6, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 2, 2, 1],
      [1, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 2, 1],
      [1, 0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
      [1, 0, 2, 2, 2, 2, 0, 0, 0, 3, 0, 0, 6, 6, 6, 6, 0, 0, 0, 1],
      [1, 0, 2, 2, 2, 2, 0, 0, 0, 3, 0, 0, 6, 5, 5, 6, 0, 0, 0, 1],
      [1, 0, 0, 2, 2, 0, 0, 0, 0, 3, 0, 0, 6, 7, 5, 6, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  Longhouse: {
    name: 'Chieftain Hall',
    spawn: { x: 9, y: 16 },
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 4, 4, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 5, 5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 5, 5, 6, 1, 1],
      [1, 1, 6, 6, 6, 6, 6, 6, 6, 7, 7, 6, 6, 6, 6, 6, 6, 6, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  }
};

function decodeTile(num) {
  switch (num) {
    case 1: return TILE_TYPES.WALL_ROCK;
    case 2: return TILE_TYPES.WATER_LAKE;
    case 3: return TILE_TYPES.GROUND_ROAD;
    case 4: return TILE_TYPES.GROUND_STONE;
    case 5: return TILE_TYPES.GROUND_WOOD;
    case 6: return TILE_TYPES.WALL_HOUSE;
    case 7: return TILE_TYPES.DOORWAY_HOUSE;
    case 8: return TILE_TYPES.DOORWAY_CAVE;
    case 0: default: return TILE_TYPES.GROUND_FIELD;
  }
}

// Global Game State
let currentHero = null;
let activeMapData = null;
let isMoving = false; 

// Roster Storage
function getSavedRoster() {
  const raw = localStorage.getItem(STORAGE_ROSTER_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveRoster(roster) {
  localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(roster));
}

function persistCurrentHero() {
  if (!currentHero) return;
  const roster = getSavedRoster();
  const idx = roster.findIndex(h => h.id === currentHero.id);
  if (idx >= 0) roster[idx] = currentHero;
  else roster.push(currentHero);
  saveRoster(roster);
  localStorage.setItem(STORAGE_CURRENT_HERO_KEY, currentHero.id);
}

// DOM Handles
const screens = {
  title: document.getElementById('title-screen'),
  roster: document.getElementById('roster-screen'),
  chooseGender: document.getElementById('screen-choose-gender'),
  chooseClass: document.getElementById('screen-choose-class'),
  chooseName: document.getElementById('screen-choose-name'),
  gameInterface: document.getElementById('game-interface')
};

const dayCycleBar = document.getElementById('day-cycle-bar');
const nightCycleBar = document.getElementById('night-cycle-bar');
const sunMoonTracker = document.getElementById('sun-moon-tracker');
const locationName = document.getElementById('location-name');
const cyclePhaseLabel = document.getElementById('cycle-phase-label');
const consoleOutput = document.getElementById('console-output');
const gameMap = document.getElementById('game-map');

function switchScreen(screenKey) {
  Object.values(screens).forEach(el => el.classList.add('hidden'));
  if (screens[screenKey]) screens[screenKey].classList.remove('hidden');
}

// 24-Hour Cycle
function buildTimeSegments() {
  dayCycleBar.innerHTML = '';
  nightCycleBar.innerHTML = '';
  DAY_HOURS.forEach(entry => {
    const seg = document.createElement('div');
    seg.classList.add('hour-segment');
    seg.dataset.hour = entry.hour;
    seg.style.backgroundColor = entry.color;
    dayCycleBar.appendChild(seg);
  });
  NIGHT_HOURS.forEach(entry => {
    const seg = document.createElement('div');
    seg.classList.add('hour-segment');
    seg.dataset.hour = entry.hour;
    seg.style.backgroundColor = entry.color;
    nightCycleBar.appendChild(seg);
  });
}

function updateTimeTracker() {
  if (!currentHero) return;
  const { hour, day } = currentHero.time;
  const isNight = hour >= 22 || hour <= 5;
  const activeHourObj = [...DAY_HOURS, ...NIGHT_HOURS].find(h => h.hour === hour);
  const phaseName = activeHourObj ? activeHourObj.label : (isNight ? 'Night' : 'Day');

  cyclePhaseLabel.textContent = `${phaseName} • Day ${day} (${String(hour).padStart(2, '0')}:00)`;
  locationName.textContent = currentHero.currentLocation;

  const activeBar = isNight ? nightCycleBar : dayCycleBar;
  const inactiveBar = isNight ? dayCycleBar : nightCycleBar;
  activeBar.style.opacity = '1';
  inactiveBar.style.opacity = '0.35';

  const segments = Array.from(activeBar.children);
  const currentSeg = segments.find(s => parseInt(s.dataset.hour, 10) === hour);
  if (currentSeg) {
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
  while (consoleOutput.children.length > 35) consoleOutput.removeChild(consoleOutput.lastChild);
}

function updateVitals() {
  if (!currentHero) return;
  const p = currentHero;
  document.getElementById('hud-player-name').textContent = p.name;
  document.getElementById('hud-player-class').textContent = p.class;
  document.getElementById('hud-player-gender').textContent = p.gender;

  document.getElementById('hp-text').textContent = `${Math.round(p.currentHP)} / ${p.maxHP}`;
  document.getElementById('hp-meter-bar').style.width = `${Math.max(0, (p.currentHP / p.maxHP) * 100)}%`;

  const resourceLabel = document.getElementById('resource-name-label');
  const resourceText = document.getElementById('resource-text');
  const resourceBar = document.getElementById('resource-meter-bar');

  if (p.class === 'Warrior') {
    resourceLabel.textContent = 'Stamina / Rage';
    resourceBar.className = 'meter-bar stamina-bar';
  } else {
    resourceLabel.textContent = 'Mana / Seiðr';
    resourceBar.className = 'meter-bar mana-bar';
  }
  resourceText.textContent = `${Math.round(p.resource)} / ${p.maxResource}`;
  resourceBar.style.width = `${Math.max(0, (p.resource / p.maxResource) * 100)}%`;

  document.getElementById('exhaustion-text').textContent = `${Math.round(p.exhaustion)}%`;
  document.getElementById('exhaustion-meter-bar').style.width = `${p.exhaustion}%`;
}

function handleDeath() {
  isMoving = false;
  logEvent('You have fallen... The Valkyries return you to your last camp.');
  currentHero.currentHP = Math.floor(currentHero.maxHP / 2); 
  currentHero.exhaustion = 0; 
  currentHero.resource = currentHero.maxResource;

  if (currentHero.campPos) {
    const destMap = currentHero.campPos.mapName.includes('Hall') ? 'Longhouse' : 'Landfall';
    loadMap(destMap);
    currentHero.pos = { x: currentHero.campPos.x, y: currentHero.campPos.y };
  } else {
    loadMap('Landfall');
    currentHero.pos = { x: 9, y: 17 };
  }

  activeMapData[currentHero.pos.y][currentHero.pos.x].visited = true;
  updateTimeTracker();
  updateVitals();
  renderMap();
  inspectTile(activeMapData[currentHero.pos.y][currentHero.pos.x], true);
  persistCurrentHero();
}

function advanceTime(hours = 1) {
  currentHero.time.hour += hours;
  while (currentHero.time.hour >= 24) {
    currentHero.time.hour -= 24;
    currentHero.time.day += 1;
  }

  currentHero.exhaustion = Math.min(100, currentHero.exhaustion + (hours * 1.5));

  if (currentHero.exhaustion >= 100) {
    currentHero.currentHP = Math.max(0, currentHero.currentHP - (hours * 5));
    logEvent('Exhaustion overtakes your body! You take damage.');
  }

  if (currentHero.currentHP <= 0) {
    handleDeath();
  } else {
    updateTimeTracker();
    updateVitals();
    persistCurrentHero();
  }
}

// --- Pathfinding & Automated Movement ---
function findPath(startX, startY, goalX, goalY) {
  const queue = [{ x: startX, y: startY, path: [] }];
  const visited = new Set();
  visited.add(`${startX},${startY}`);

  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.x === goalX && current.y === goalY) {
      return current.path;
    }

    for (let [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        const tile = activeMapData[ny][nx];
        if (tile.type.walkable && !visited.has(`${nx},${ny}`)) {
          visited.add(`${nx},${ny}`);
          queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
        }
      }
    }
  }
  return null;
}

function initiateTravel(tx, ty) {
  if (isMoving) return;
  const path = findPath(currentHero.pos.x, currentHero.pos.y, tx, ty);
  
  if (path && path.length > 0) {
    isMoving = true;
    walkNextStep(path);
  } else {
    logEvent("No safe path through the wild.");
  }
}

function walkNextStep(path) {
  if (path.length === 0 || !isMoving) {
    isMoving = false;
    return;
  }

  const nextNode = path.shift();
  const tile = activeMapData[nextNode.y][nextNode.x];

  advanceTime(1);
  
  if (!isMoving) return; 

  if (currentHero.currentHP > 0) {
    currentHero.pos = { x: nextNode.x, y: nextNode.y };
    tile.visited = true;
    renderMap();
    inspectTile(tile, true);

    if (tile.encounter || tile.type.action || currentHero.exhaustion >= 100) {
      isMoving = false;
      logEvent(tile.encounter ? "Movement interrupted by an encounter!" : "Movement halted.");
      return;
    }

    setTimeout(() => walkNextStep(path), 250);
  }
}

function loadMap(mapId) {
  const blueprint = CRAFTED_MAPS[mapId] || CRAFTED_MAPS.Landfall;
  currentHero.currentLocation = blueprint.name;

  const grid = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tileCode = blueprint.layout[y][x];
      grid[y][x] = { x, y, type: decodeTile(tileCode), encounter: null, visited: false };
    }
  }

  if (mapId === 'Landfall') {
    grid[3][3].encounter = ENCOUNTER_TYPES[0];
    grid[8][14].encounter = ENCOUNTER_TYPES[1];
    grid[5][10].encounter = ENCOUNTER_TYPES[2];
  }
  activeMapData = grid;
}

function renderMap() {
  gameMap.innerHTML = '';
  const { x: px, y: py } = currentHero.pos;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = activeMapData[y][x];
      const cell = document.createElement('div');
      cell.className = 'tile';

      const bgImg = tile.type.image || tile.type.fallback;
      cell.style.backgroundImage = `url("${bgImg}")`;

      if (x === px && y === py) cell.classList.add('player');
      if (tile.visited) cell.classList.add('visited');

      if (tile.type.walkable && !(x === px && y === py)) {
        cell.classList.add('can-move');
        cell.addEventListener('click', () => {
          if (!isMoving) initiateTravel(x, y);
        });
      }

      cell.addEventListener('mouseenter', () => inspectTile(tile, false));

      if (tile.encounter) {
        cell.textContent = tile.encounter.symbol;
      } else if (tile.type.symbol && !tile.type.image) {
        cell.textContent = tile.type.symbol;
      }

      if (currentHero.campPos && currentHero.campPos.mapName === currentHero.currentLocation && 
          currentHero.campPos.x === x && currentHero.campPos.y === y) {
        const campMarker = document.createElement('span');
        campMarker.className = 'camp-marker';
        campMarker.textContent = '🔥';
        cell.appendChild(campMarker);
      }

      gameMap.appendChild(cell);
    }
  }
}

function restHero() {
  if (isMoving) return; 
  const isNight = currentHero.time.hour >= 22 || currentHero.time.hour <= 5;
  logEvent('You kindle a camp fire and rest. Saga Saved.');

  currentHero.campPos = { 
    mapName: currentHero.currentLocation, 
    x: currentHero.pos.x, 
    y: currentHero.pos.y 
  };

  if (isNight && Math.random() < 0.28) {
    logEvent('A nocturnal prowler ambushes your camp! Rest was broken.');
    currentHero.currentHP = Math.max(5, currentHero.currentHP - 18);
  } else {
    currentHero.resource = currentHero.maxResource;
    currentHero.exhaustion = Math.max(0, currentHero.exhaustion - 45);
    currentHero.currentHP = Math.min(currentHero.maxHP, currentHero.currentHP + 35);
    logEvent('Rest complete. Your exhaustion has receded.');
  }

  advanceTime(6);
  persistCurrentHero();
  renderMap();
}

function inspectTile(tile, isInteracting = false) {
  const typeBadge = document.getElementById('inspector-type-badge');
  const targetIcon = document.getElementById('target-icon');
  const targetName = document.getElementById('target-name');
  const targetSubtitle = document.getElementById('target-subtitle');
  const statsBlock = document.getElementById('target-stats-block');
  const targetDesc = document.getElementById('target-description');
  const actionsList = document.getElementById('inspector-actions');
  actionsList.innerHTML = '';

  const isNight = currentHero.time.hour >= 22 || currentHero.time.hour <= 5;

  if (tile.encounter) {
    const enc = tile.encounter;
    targetIcon.textContent = enc.symbol;
    targetName.textContent = enc.name;
    targetDesc.textContent = enc.description;

    if (enc.type === 'enemy') {
      typeBadge.textContent = isNight ? 'Frenzied Foe' : 'Hostile';
      targetSubtitle.textContent = isNight ? 'Stalking in the Dark (+50% Power)' : 'Undead Warrior';
      statsBlock.classList.remove('hidden');

      const nightBonus = isNight ? 1.5 : 1.0;
      document.getElementById('target-threat').textContent = `${enc.threat} ${isNight ? '(Night Buff)' : ''}`;
      document.getElementById('target-hp').textContent = `${enc.hp} / ${enc.maxHp}`;
      document.getElementById('target-attack').textContent = `${Math.round(enc.attackPower * nightBonus)} (Physical)`;

      if (isInteracting) {
        const battleBtn = document.createElement('button');
        battleBtn.className = 'rune-btn';
        battleBtn.textContent = `Strike with ${currentHero.gear.mainhand ? 'Weapon' : 'Fists'}`;
        battleBtn.onclick = () => {
          logEvent(`You engaged in combat with ${enc.name}!`);
          tile.encounter = null;
          renderMap();
          inspectTile(tile, false);
        };
        actionsList.appendChild(battleBtn);
      }
    } else if (enc.type === 'npc') {
      typeBadge.textContent = 'Friendly NPC';
      targetSubtitle.textContent = 'Skald & Merchant';
      statsBlock.classList.add('hidden');

      if (isInteracting) {
        const chatBtn = document.createElement('button');
        chatBtn.className = 'rune-btn';
        chatBtn.textContent = 'Speak with Sigurd';
        chatBtn.onclick = () => {
          logEvent('Sigurd chants: "The frost honors only the resilient."');
        };
        actionsList.appendChild(chatBtn);
      }
    } else {
      typeBadge.textContent = 'Cache';
      targetSubtitle.textContent = 'Buried Loot';
      statsBlock.classList.add('hidden');

      if (isInteracting) {
        const openBtn = document.createElement('button');
        openBtn.className = 'rune-btn';
        openBtn.textContent = 'Pry Chest Open';
        openBtn.onclick = () => {
          logEvent('You opened the chest and gained silver coins!');
          tile.encounter = null;
          renderMap();
          inspectTile(tile, false);
        };
        actionsList.appendChild(openBtn);
      }
    }
  } else if (tile.type.action === 'travel_house') {
    typeBadge.textContent = 'Structure';
    targetIcon.textContent = '🚪';
    targetName.textContent = 'Longhouse Threshold';
    targetSubtitle.textContent = 'Carved Timber Entry';
    statsBlock.classList.add('hidden');
    targetDesc.textContent = 'Thick timbers shield the warmth of the hearth from the northern gale.';

    if (isInteracting) {
      const enterBtn = document.createElement('button');
      enterBtn.className = 'rune-btn';
      enterBtn.textContent = currentHero.currentLocation.includes('Coast') ? 'Enter Chieftain Hall' : 'Exit to Coast';
      enterBtn.onclick = () => {
        if (currentHero.currentLocation.includes('Coast')) {
          loadMap('Longhouse');
          currentHero.pos = { x: 9, y: 15 };
        } else {
          loadMap('Landfall');
          currentHero.pos = { x: 5, y: 7 };
        }
        activeMapData[currentHero.pos.y][currentHero.pos.x].visited = true;
        renderMap();
        updateTimeTracker();
        inspectTile(activeMapData[currentHero.pos.y][currentHero.pos.x], true);
        logEvent(`Entered ${currentHero.currentLocation}.`);
      };
      actionsList.appendChild(enterBtn);
    }
  } else {
    typeBadge.textContent = 'Terrain';
    targetIcon.textContent = tile.type.symbol || '🏕️';
    targetName.textContent = tile.type.name;
    targetSubtitle.textContent = tile.type.walkable ? 'Traversable Terrain' : 'Impassable Barrier';
    statsBlock.classList.add('hidden');
    targetDesc.textContent = tile.type.walkable
      ? 'An open stretch of northern wild. Safe to set up camp and rest.'
      : 'Natural barriers block direct progress.';
  }
}

function renderRosterScreen() {
  const slotsList = document.getElementById('character-slots-list');
  slotsList.innerHTML = '';
  const roster = getSavedRoster();

  if (roster.length === 0) {
    slotsList.innerHTML = `<p class="screen-subtitle">No sagas etched yet. Begin a new journey!</p>`;
    return;
  }

  roster.forEach(hero => {
    const slotCard = document.createElement('div');
    slotCard.className = 'char-slot-card';
    slotCard.innerHTML = `
      <div class="char-slot-meta">
        <strong>${hero.name}</strong>
        <span>${hero.gender} • ${hero.class}</span>
      </div>
      <div>
        <span class="badge">Day ${hero.time.day}</span>
      </div>
    `;
    slotCard.onclick = () => {
      currentHero = hero;
      launchGameplay();
    };
    slotsList.appendChild(slotCard);
  });
}

function launchGameplay() {
  switchScreen('gameInterface');
  buildTimeSegments();
  updateTimeTracker();
  updateVitals();

  const startingMap = currentHero.currentLocation.includes('Hall') ? 'Longhouse' : 'Landfall';
  loadMap(startingMap);
  activeMapData[currentHero.pos.y][currentHero.pos.x].visited = true;
  renderMap();
  inspectTile(activeMapData[currentHero.pos.y][currentHero.pos.x], true);
  logEvent(`Saga resumed for ${currentHero.name}. Entered ${currentHero.currentLocation}.`);
}

let newHeroDraft = { gender: 'Man', class: 'Warrior', name: 'EINAR' };

document.getElementById('btn-new-journey').onclick = () => switchScreen('chooseGender');
document.getElementById('btn-continue-journey').onclick = () => { renderRosterScreen(); switchScreen('roster'); };
document.getElementById('btn-roster-back').onclick = () => switchScreen('title');

document.querySelectorAll('#screen-choose-gender .card-choice-btn').forEach(btn => {
  btn.onclick = (e) => { newHeroDraft.gender = e.currentTarget.dataset.gender; switchScreen('chooseClass'); };
});
document.getElementById('btn-gender-back').onclick = () => switchScreen('title');

document.querySelectorAll('#screen-choose-class .card-choice-btn').forEach(btn => {
  btn.onclick = (e) => { newHeroDraft.class = e.currentTarget.dataset.class; switchScreen('chooseName'); };
});
document.getElementById('btn-class-back').onclick = () => switchScreen('chooseGender');

const nameInput = document.getElementById('player-name-input');
const charLimit = document.getElementById('char-limit-indicator');
nameInput.addEventListener('input', () => {
  nameInput.value = nameInput.value.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase();
  charLimit.textContent = `${nameInput.value.length} / 5`;
});

document.getElementById('btn-name-back').onclick = () => switchScreen('chooseClass');

document.getElementById('btn-name-confirm').onclick = () => {
  const finalName = nameInput.value.trim().toUpperCase() || 'EINAR';
  
  const startingInventory = new Array(25).fill(null);
  startingInventory[0] = { id: '001', name: 'Odin\'s Fang', slot: 'mainhand', rarity: 'legendary', symbol: '🗡️', stats: { attack: 15, fire: 5 } };
  startingInventory[1] = { id: '002', name: 'Iron Coif', slot: 'head', rarity: 'common', symbol: '🪖', stats: { defense: 2 } };

  currentHero = {
    id: `hero_${Date.now()}`,
    name: finalName,
    gender: newHeroDraft.gender,
    class: newHeroDraft.class,
    level: 1,
    currentLocation: 'Landfall Coast',
    pos: { x: 9, y: 17 },
    campPos: null,
    time: { hour: 6, day: 1 },
    maxHP: 100, currentHP: 100,
    maxResource: 100, resource: 100,
    exhaustion: 0,
    gear: { 
      head: null, 
      chest: { ...GEAR_REGISTRY.leather, stats: GEAR_REGISTRY.leather.resolveStats(newHeroDraft.class) }, 
      mainhand: { ...GEAR_REGISTRY.seax, stats: GEAR_REGISTRY.seax.resolveStats(newHeroDraft.class) }, 
      offhand: { ...GEAR_REGISTRY.shield, stats: GEAR_REGISTRY.shield.resolveStats(newHeroDraft.class) }, 
      legs: null,
      boots: { ...GEAR_REGISTRY.wraps, stats: GEAR_REGISTRY.wraps.resolveStats(newHeroDraft.class) } 
    },
    inventory: startingInventory,
    stats: newHeroDraft.class === 'Warrior' ? { str: 14, int: 8, agi: 10 } : { str: 7, int: 15, agi: 9 }
  };
  
  persistCurrentHero();
  launchGameplay();
};

document.getElementById('make-camp-btn').onclick = () => restHero();

document.getElementById('manual-save-btn').onclick = () => {
  if (isMoving) return;
  persistCurrentHero();
  logEvent('Progress etched in stone (Saved).');
};

document.getElementById('exit-to-title-btn').onclick = () => {
  if (isMoving) return;
  persistCurrentHero();
  switchScreen('title');
};

// --- INVENTORY & CHARACTER SHEET SYSTEM ---
const sheetScreen = document.getElementById('character-sheet-screen');
let isSheetOpen = false;

function openCharacterSheet() {
  if (isMoving) return;
  isSheetOpen = true;
  sheetScreen.classList.remove('hidden');
  
  document.getElementById('sheet-char-name').textContent = currentHero.name;
  document.getElementById('sheet-char-class').textContent = `Level ${currentHero.level} ${currentHero.class}`;
  
  if (!currentHero.inventory) currentHero.inventory = new Array(25).fill(null);
  
  adjustAndRenderInventory();
  renderEquipment();
  calculateStats();
}

function closeCharacterSheet() {
  isSheetOpen = false;
  sheetScreen.classList.add('hidden');
}

document.getElementById('close-sheet-btn').onclick = closeCharacterSheet;
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'c') {
    if (currentHero && currentHero.currentHP > 0) {
      isSheetOpen ? closeCharacterSheet() : openCharacterSheet();
    }
  }
});

// Dynamic Scaling Grid
function adjustAndRenderInventory() {
  const invGrid = document.getElementById('inventory-grid');
  invGrid.innerHTML = '';
  
  let filledSlots = currentHero.inventory.filter(i => i !== null).length;
  let maxSlots = 25;
  let gridClass = 'grid-5x5';

  if (currentHero.inventory.length > 25 || filledSlots > 25) {
    maxSlots = 100;
    gridClass = 'grid-10x10';
  }
  if (currentHero.inventory.length > 100 || filledSlots > 100) {
    maxSlots = 225;
    gridClass = 'grid-15x15';
  }

  while (currentHero.inventory.length < maxSlots) {
    currentHero.inventory.push(null);
  }

  invGrid.className = `inv-grid ${gridClass}`;

  for (let i = 0; i < maxSlots; i++) {
    const slot = document.createElement('div');
    slot.className = 'inv-slot';
    slot.setAttribute('ondragover', 'allowDrop(event)');
    slot.setAttribute('ondrop', `dropToInventory(event, ${i})`);
    
    const item = currentHero.inventory[i];
    if (item) {
      slot.appendChild(createItemElement(item, `inv-${i}`));
    }
    invGrid.appendChild(slot);
  }
}

function renderEquipment() {
  const slots = ['head', 'chest', 'legs', 'boots', 'mainhand', 'offhand'];
  slots.forEach(slot => {
    const slotElement = document.querySelector(`.equip-slot[data-slot="${slot}"]`);
    if(slotElement) {
        slotElement.innerHTML = slot.charAt(0).toUpperCase() + slot.slice(1);
        
        if (currentHero.gear[slot]) {
          slotElement.innerHTML = ''; 
          slotElement.appendChild(createItemElement(currentHero.gear[slot], `equip-${slot}`));
        }
    }
  });
}

function createItemElement(item, dragId) {
  const el = document.createElement('div');
  el.className = `draggable-item rarity-${item.rarity}`;
  el.textContent = item.symbol || '🗡️'; 
  el.draggable = true;
  el.id = dragId;
  
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      itemData: item,
      sourceId: dragId
    }));
  });

  el.addEventListener('mouseenter', () => {
    document.getElementById('item-hover-details').innerHTML = `
      <h4 style="color: ${getRarityColor(item.rarity)}; font-size: 1.1rem; margin-bottom: 5px;">${item.name}</h4>
      <p style="font-size: 0.8rem; color: #8592a6;">Item ID: #${String(item.id).padStart(3, '0')}</p>
      <p style="font-size: 0.8rem; color: #8592a6;">Rarity: <span style="color: ${getRarityColor(item.rarity)}; text-transform: uppercase;">${item.rarity}</span></p>
      <p style="font-size: 0.8rem; color: #8592a6;">Slot: ${item.slot.toUpperCase()}</p>
      <hr style="border-color:#262d3a; margin: 10px 0;">
      <p style="font-size: 0.9rem; color: #e7ecf2;">${formatStats(item.stats)}</p>
    `;
  });
  
  el.addEventListener('mouseleave', () => {
    document.getElementById('item-hover-details').innerHTML = '<p class="placeholder-text" style="color: #8592a6; font-size: 0.8rem;">Hover over an item to inspect its runes and stats.</p>';
  });

  return el;
}

function getRarityColor(rarity) {
  const colors = { common: '#4ade80', rare: '#60a5fa', epic: '#c084fc', legendary: '#fb923c' };
  return colors[rarity] || '#fff';
}

function formatStats(stats) {
  if (!stats) return 'No combat stats.';
  return Object.entries(stats).map(([key, val]) => `+${val} ${key.toUpperCase()}`).join('<br>');
}

// Drag & Drop Handlers
window.allowDrop = function(e) {
  e.preventDefault();
}

window.dropToEquip = function(e, targetSlot) {
  e.preventDefault();
  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
  const item = data.itemData;

  if (item.slot !== targetSlot && item.slot !== 'anyhand') {
    logEvent(`You cannot equip ${item.name} in the ${targetSlot} slot.`);
    return;
  }

  if (data.sourceId.includes('inv-')) {
    const invIndex = parseInt(data.sourceId.split('-')[1]);
    currentHero.inventory[invIndex] = null;
  }

  if (currentHero.gear[targetSlot]) {
    const oldItem = currentHero.gear[targetSlot];
    const emptySlot = currentHero.inventory.findIndex(i => i === null || i === undefined);
    if (emptySlot !== -1) currentHero.inventory[emptySlot] = oldItem;
    else currentHero.inventory.push(oldItem); 
  }

  currentHero.gear[targetSlot] = item;
  
  persistCurrentHero();
  openCharacterSheet(); 
}

window.dropToInventory = function(e, targetIndex) {
  e.preventDefault();
  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
  const item = data.itemData;

  if (data.sourceId.includes('equip-')) {
    const slot = data.sourceId.split('-')[1];
    currentHero.gear[slot] = null;
  } else if (data.sourceId.includes('inv-')) {
    const sourceIndex = parseInt(data.sourceId.split('-')[1]);
    currentHero.inventory[sourceIndex] = currentHero.inventory[targetIndex];
  }

  currentHero.inventory[targetIndex] = item;
  
  persistCurrentHero();
  openCharacterSheet(); 
}

window.dropToTrash = function(e) {
  e.preventDefault();
  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
  
  if (data.sourceId.includes('inv-')) {
    const invIndex = parseInt(data.sourceId.split('-')[1]);
    currentHero.inventory[invIndex] = null;
  } else if (data.sourceId.includes('equip-')) {
    const slot = data.sourceId.split('-')[1];
    currentHero.gear[slot] = null;
  }

  logEvent(`You destroyed the item.`);
  persistCurrentHero();
  openCharacterSheet(); 
}

function calculateStats() {
  let atk = currentHero.stats.str;
  let def = currentHero.stats.agi;
  
  Object.values(currentHero.gear).forEach(item => {
    if (item && item.stats) {
      if (item.stats.attack) atk += item.stats.attack;
      if (item.stats.defense) def += item.stats.defense;
    }
  });

  const statAtk = document.getElementById('stat-atk');
  const statDef = document.getElementById('stat-def');
  const statHp = document.getElementById('stat-hp');
  
  if(statAtk) statAtk.textContent = atk;
  if(statDef) statDef.textContent = def;
  if(statHp) statHp.textContent = currentHero.maxHP;
}
// --- KEYBOARD MOVEMENT SYSTEM ---
function moveHero(dx, dy) {
  // Prevent moving if dead, already moving, or if character sheet is open
  if (!currentHero || isMoving || currentHero.currentHP <= 0 || isSheetOpen) return;

  const newX = currentHero.pos.x + dx;
  const newY = currentHero.pos.y + dy;

  // Prevent walking off the edge of the world map
  if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
    logEvent("The world ends here. You cannot go further.");
    return;
  }

  const targetTile = activeMapData[newY][newX];

  // Collision detection (Mountains, Water, Walls)
  if (!targetTile.type.walkable) {
    logEvent(`The way is blocked by ${targetTile.type.name}.`);
    return;
  }

  // Execute Move
  currentHero.pos = { x: newX, y: newY };
  targetTile.visited = true;
  
  // 1 step equals 1 hour in the wild
  advanceTime(1); 

  renderMap();
  inspectTile(targetTile, true);
  persistCurrentHero();

  // Check for encounters on the new tile
  if (targetTile.encounter) {
    logEvent(`You stumbled upon a ${targetTile.encounter.name}!`);
  } else if (targetTile.type.action) {
    logEvent(`You arrived at ${targetTile.type.name}.`);
  }
}

// Listen for keyboard presses
document.addEventListener('keydown', (e) => {
  // Ignore input if user is typing in the name input field
  if (document.activeElement.tagName === 'INPUT') return;

  switch(e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      moveHero(0, -1);
      break;
    case 's':
    case 'arrowdown':
      moveHero(0, 1);
      break;
    case 'a':
    case 'arrowleft':
      moveHero(-1, 0);
      break;
    case 'd':
    case 'arrowright':
      moveHero(1, 0);
      break;
  }
});