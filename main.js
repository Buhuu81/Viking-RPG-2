/**
 * VIKING JOURNEY - Master Game Engine
 */

const STORAGE_ROSTER_KEY = 'viking_journey_roster_v3';
const STORAGE_CURRENT_HERO_KEY = 'viking_journey_active_hero_id';
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;
const ASSET_PATH = '/src/assets/pictures/tiles';

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
  { type: 'enemy', name: 'Draugr Sentry', description: 'An undead warrior clad in rusted mail, gripping a chipped spear.', threat: 1, hp: 40, maxHp: 40, attackPower: 7, symbol: '💀' },
  { type: 'treasure', name: 'Buried Norse Cache', description: 'An iron-reinforced chest embedded into frozen earth.', threat: 0, symbol: '📦' },
  { type: 'npc', name: 'Sigurd the Skald', description: 'A weathered wanderer who trades chants, rumors, and forged goods.', threat: 0, symbol: '🧙' }
];

const GEAR_REGISTRY = {
  seax: { id: 'seax', name: 'Iron Seax', slot: 'mainhand', rarity: 'common', resolveStats: (cls) => cls === 'Warrior' ? { attack: 8, rageBonus: 5 } : { attack: 4, spellPower: 6, manaMax: 15 } },
  leather: { id: 'leather', name: 'Boiled Leather', slot: 'chest', rarity: 'common', resolveStats: (cls) => cls === 'Warrior' ? { defense: 8, physicalBlock: 4 } : { defense: 5, manaRegen: 3 } },
  shield: { id: 'shield', name: 'Oak Shield', slot: 'offhand', rarity: 'common', resolveStats: (cls) => cls === 'Warrior' ? { blockRate: 12, hpMax: 25 } : { ward: 10, runeSpell: 5 } },
  wraps: { id: 'wraps', name: 'Fur Wraps', slot: 'boots', rarity: 'common', resolveStats: () => ({ moveStaminaCost: -1 }) }
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

  const attrBox = document.getElementById('attribute-list');
  attrBox.innerHTML = '';
  Object.entries(p.stats).forEach(([stat, val]) => {
    const pill = document.createElement('div');
    pill.className = 'stat-pill';
    pill.innerHTML = `<span>${stat.toUpperCase()}</span><strong>${val}</strong>`;
    attrBox.appendChild(pill);
  });

  Object.entries(p.gear).forEach(([slot, itemId]) => {
    const slotEl = document.querySelector(`#slot-${slot} span`);
    if (slotEl) {
      if (itemId && GEAR_REGISTRY[itemId]) {
        const item = GEAR_REGISTRY[itemId];
        const stats = item.resolveStats(p.class);
        const statLabel = Object.entries(stats).map(([k, v]) => `+${v} ${k}`).join(', ');
        slotEl.textContent = `${item.name} (${statLabel})`;
      } else {
        slotEl.textContent = 'Empty';
      }
    }
  });
}

function handleDeath() {
  logEvent('You have fallen... The Valkyries return you to your last camp.');
  currentHero.currentHP = Math.floor(currentHero.maxHP / 2); 
  currentHero.exhaustion = 0; 
  currentHero.resource = currentHero.maxResource;

  if (currentHero.campPos) {
    currentHero.currentLocation = currentHero.campPos.mapName;
    currentHero.pos = { x: currentHero.campPos.x, y: currentHero.campPos.y };
    loadMap(currentHero.campPos.mapId);
  } else {
    currentHero.currentLocation = 'Landfall Coast';
    currentHero.pos = { x: 9, y: 17 };
    loadMap('Landfall');
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

  // Exhaustion goes up from walking. Mana/Stam DO NOT drain outside of combat anymore.
  currentHero.exhaustion = Math.min(100, currentHero.exhaustion + (hours * 1.5));

  // If exhaustion hits 100, take damage instead.
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

      const isAdjacent = Math.abs(x - px) + Math.abs(y - py) === 1;
      if (isAdjacent && tile.type.walkable) {
        cell.classList.add('can-move');
        cell.addEventListener('click', () => stepTo(x, y));
      }

      cell.addEventListener('mouseenter', () => inspectTile(tile, false));

      if (tile.encounter) {
        cell.textContent = tile.encounter.symbol;
      } else if (tile.type.symbol && !tile.type.image) {
        cell.textContent = tile.type.symbol;
      }

      // Draw Campfire if it exists here
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

function stepTo(nx, ny) {
  const tile = activeMapData[ny][nx];
  if (!tile.type.walkable) return;
  advanceTime(1);
  currentHero.pos = { x: nx, y: ny };
  tile.visited = true;
  renderMap();
  inspectTile(tile, true);
}

function restHero() {
  const isNight = currentHero.time.hour >= 22 || currentHero.time.hour <= 5;
  logEvent('You kindle a camp fire and rest. Saga Saved.');

  // Place or move campfire save point
  const mapId = currentHero.currentLocation.includes('Hall') ? 'Longhouse' : 'Landfall';
  currentHero.campPos = { 
    mapId: mapId, 
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
  renderMap(); // Re-render to show the fire immediately
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

    if (isInteracting && tile.type.walkable) {
      const restBtn = document.createElement('button');
      restBtn.className = 'rune-btn';
      restBtn.textContent = 'Make Camp & Rest (Save)';
      restBtn.onclick = () => restHero();
      actionsList.appendChild(restBtn);
    }
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
  currentHero = {
    id: `hero_${Date.now()}`,
    name: finalName,
    gender: newHeroDraft.gender,
    class: newHeroDraft.class,
    level: 1,
    currentLocation: 'Landfall Coast',
    pos: { x: 9, y: 17 },
    campPos: null, // Track solitary save point
    time: { hour: 6, day: 1 },
    maxHP: 100, currentHP: 100,
    maxResource: 100, resource: 100,
    exhaustion: 0,
    gear: { head: null, chest: 'leather', mainhand: 'seax', offhand: 'shield', boots: 'wraps' },
    stats: newHeroDraft.class === 'Warrior' ? { str: 14, int: 8, agi: 10 } : { str: 7, int: 15, agi: 9 }
  };
  persistCurrentHero();
  launchGameplay();
};

document.getElementById('manual-save-btn').onclick = () => {
  persistCurrentHero();
  logEvent('Progress etched in stone (Saved).');
};

document.getElementById('exit-to-title-btn').onclick = () => {
  persistCurrentHero();
  switchScreen('title');
};