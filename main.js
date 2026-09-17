/**
 * VIKING JOURNEY - Master Game Engine
 * Features: Adjacency NPC triggering, Step-on Enemy combat triggering,
 * Interface Modal popups (Fight, Quest, Shop, Char Sheet).
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

const CRAFTED_MAPS = {
  Landfall: {
    name: 'Landfall Coast',
    spawn: { x: 9, y: 17 },
    layout: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,8,1,0,0,0,0,0,0,3,0,0,0,0,0,0,0,2,2,1],
      [1,0,1,0,0,0,0,0,0,3,0,0,0,0,0,0,2,2,2,1],
      [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,2,2,2,2,1],
      [1,0,0,0,6,6,6,0,0,3,0,0,0,0,0,2,2,2,2,1],
      [1,0,0,0,6,5,6,0,0,3,3,3,3,0,0,0,2,2,2,1],
      [1,0,0,0,6,7,6,0,0,3,0,0,3,0,0,0,0,2,2,1],
      [1,0,0,0,0,3,0,0,0,3,0,0,3,0,0,0,0,0,2,1],
      [1,0,0,0,0,3,3,3,3,3,0,0,3,3,3,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,1],
      [1,0,0,2,2,0,0,0,0,3,0,0,0,0,3,0,0,0,0,1],
      [1,0,2,2,2,2,0,0,0,3,0,0,6,6,6,6,0,0,0,1],
      [1,0,2,2,2,2,0,0,0,3,0,0,6,5,5,6,0,0,0,1],
      [1,0,0,2,2,0,0,0,0,3,0,0,6,7,5,6,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  },
  Longhouse: {
    name: 'Chieftain Hall',
    spawn: { x: 9, y: 16 },
    layout: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,5,5,4,4,5,5,4,4,5,5,4,4,5,5,6,1,1],
      [1,1,6,5,5,4,4,5,5,4,4,5,5,4,4,5,5,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,5,5,4,4,5,5,4,4,5,5,4,4,5,5,6,1,1],
      [1,1,6,5,5,4,4,5,5,4,4,5,5,4,4,5,5,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,5,5,5,5,5,5,4,4,5,5,5,5,5,5,6,1,1],
      [1,1,6,6,6,6,6,6,6,7,7,6,6,6,6,6,6,6,1,1],
      [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
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

let currentHero = null;
let activeMapData = null;
let currentEncounterTile = null;

// Screens & HUD
const screens = {
  title: document.getElementById('title-screen'),
  roster: document.getElementById('roster-screen'),
  chooseGender: document.getElementById('screen-choose-gender'),
  chooseClass: document.getElementById('screen-choose-class'),
  chooseName: document.getElementById('screen-choose-name'),
  gameInterface: document.getElementById('game-interface')
};
const gameMap = document.getElementById('game-map');
const consoleOutput = document.getElementById('console-output');

// Modal Elements
const modalContainer = document.getElementById('modal-container');
const modals = {
  combat: document.getElementById('modal-combat'),
  quest: document.getElementById('modal-quest'),
  shop: document.getElementById('modal-shop'),
  charsheet: document.getElementById('modal-charsheet')
};

// Open specific modal
function openModal(modalId) {
  modalContainer.classList.remove('hidden');
  Object.values(modals).forEach(m => m.classList.add('hidden'));
  modals[modalId].classList.remove('hidden');
}
function closeModal() {
  modalContainer.classList.add('hidden');
  if (currentEncounterTile && currentEncounterTile.encounter && currentEncounterTile.encounter.type === 'enemy') {
    // If fleeing, we step back or just close window. 
    logEvent("Fled from combat.");
  }
}
document.querySelectorAll('.close-modal-btn').forEach(btn => btn.onclick = closeModal);
document.getElementById('btn-open-char-sheet').onclick = () => openModal('charsheet');

function logEvent(msg) {
  const p = document.createElement('p');
  p.textContent = `> ${msg}`;
  consoleOutput.prepend(p);
  while (consoleOutput.children.length > 35) consoleOutput.removeChild(consoleOutput.lastChild);
}

function loadMap(mapName) {
  const blueprint = CRAFTED_MAPS[mapName] || CRAFTED_MAPS.Landfall;
  currentHero.currentLocation = blueprint.name;
  const grid = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      grid[y][x] = { x, y, type: decodeTile(blueprint.layout[y][x]), encounter: null, visited: false };
    }
  }
  if (mapName === 'Landfall') {
    grid[3][3].encounter = ENCOUNTER_TYPES[0]; // Draugr
    grid[8][14].encounter = ENCOUNTER_TYPES[1]; // Chest
    grid[5][10].encounter = ENCOUNTER_TYPES[2]; // NPC
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
      cell.style.backgroundImage = `url("${tile.type.image || tile.type.fallback}")`;

      if (x === px && y === py) cell.classList.add('player');
      if (tile.visited) cell.classList.add('visited');

      const isAdjacent = Math.abs(x - px) + Math.abs(y - py) === 1;
      if (isAdjacent && tile.type.walkable) {
        cell.classList.add('can-move');
        cell.addEventListener('click', () => stepTo(x, y));
      }
      cell.addEventListener('mouseenter', () => inspectTile(tile, isAdjacent));

      if (tile.encounter) cell.textContent = tile.encounter.symbol;
      else if (tile.type.symbol && !tile.type.image) cell.textContent = tile.type.symbol;
      
      gameMap.appendChild(cell);
    }
  }
}

// THE NEW STEP LOGIC
function stepTo(nx, ny) {
  const tile = activeMapData[ny][nx];
  if (!tile.type.walkable) return;

  // RULE: Step ON enemy triggers combat popup[cite: 2]
  if (tile.encounter && tile.encounter.type === 'enemy') {
    currentEncounterTile = tile;
    triggerCombatModal(tile.encounter);
    return; // Block actual movement until combat resolves
  }

  // Advance time & move
  advanceTime(1);
  currentHero.pos = { x: nx, y: ny };
  tile.visited = true;
  renderMap();
  inspectTile(tile, true);
}

// THE POPUP INITIATORS
function triggerCombatModal(enemy) {
  document.getElementById('combat-hero-name').textContent = currentHero.name;
  document.getElementById('combat-enemy-name').textContent = enemy.name;
  document.getElementById('combat-enemy-icon').textContent = enemy.symbol;
  document.getElementById('combat-enemy-hp').style.width = '100%';
  openModal('combat');
  logEvent(`Ambushed by ${enemy.name}! Prepare for battle.`);
}

function triggerQuestModal(npc) {
  document.getElementById('quest-npc-name').textContent = npc.name;
  document.getElementById('quest-npc-icon').textContent = npc.symbol;
  openModal('quest');
}

function triggerShopModal(npc) {
  openModal('shop');
}

// INSPECTOR & ADJACENCY LOGIC
function inspectTile(tile, isAdjacent = false) {
  const typeBadge = document.getElementById('inspector-type-badge');
  const targetIcon = document.getElementById('target-icon');
  const targetName = document.getElementById('target-name');
  const targetSubtitle = document.getElementById('target-subtitle');
  const statsBlock = document.getElementById('target-stats-block');
  const actionsList = document.getElementById('inspector-actions');
  actionsList.innerHTML = '';

  if (tile.encounter) {
    const enc = tile.encounter;
    targetIcon.textContent = enc.symbol;
    targetName.textContent = enc.name;

    if (enc.type === 'enemy') {
      typeBadge.textContent = 'Hostile';
      targetSubtitle.textContent = 'Will attack if stepped on.';
      statsBlock.classList.remove('hidden');
      document.getElementById('target-threat').textContent = enc.threat;
      document.getElementById('target-hp').textContent = `${enc.hp} / ${enc.maxHp}`;
      document.getElementById('target-attack').textContent = enc.attackPower;
    } else if (enc.type === 'npc') {
      typeBadge.textContent = 'NPC';
      targetSubtitle.textContent = 'Skald & Merchant';
      statsBlock.classList.add('hidden');

      // RULE: Talk/Shop available when Adjacent to NPC (Not stepping on)[cite: 3, 4]
      if (isAdjacent) {
        const questBtn = document.createElement('button');
        questBtn.className = 'rune-btn';
        questBtn.textContent = 'Speak (Quest)';
        questBtn.onclick = () => triggerQuestModal(enc);
        actionsList.appendChild(questBtn);

        const shopBtn = document.createElement('button');
        shopBtn.className = 'rune-btn secondary-btn';
        shopBtn.textContent = 'Trade (Shop)';
        shopBtn.onclick = () => triggerShopModal(enc);
        actionsList.appendChild(shopBtn);
      }
    } else if (enc.type === 'treasure') {
      typeBadge.textContent = 'Loot';
      targetSubtitle.textContent = 'Buried Cache';
      statsBlock.classList.add('hidden');
      if (isAdjacent) {
        const openBtn = document.createElement('button');
        openBtn.className = 'rune-btn';
        openBtn.textContent = 'Pry Open';
        openBtn.onclick = () => {
          logEvent('Opened chest! (+Gold)');
          tile.encounter = null;
          renderMap();
        };
        actionsList.appendChild(openBtn);
      }
    }
  } else {
    typeBadge.textContent = 'Terrain';
    targetIcon.textContent = tile.type.symbol || '🏕️';
    targetName.textContent = tile.type.name;
    statsBlock.classList.add('hidden');
    
    if (isAdjacent && tile.type.walkable) {
      const restBtn = document.createElement('button');
      restBtn.className = 'rune-btn';
      restBtn.textContent = 'Camp (Rest 6h)';
      restBtn.onclick = () => { advanceTime(6); logEvent('Rested 6h.'); };
      actionsList.appendChild(restBtn);
    }
  }
}

// Mock advance time to keep logic compiling
function advanceTime(hours) {
  // Logic from previous step remains here...
}
function updateTimeTracker() {}
function updateVitals() {}
function launchGameplay() {
  switchScreen('gameInterface');
  loadMap('Landfall');
  activeMapData[currentHero.pos.y][currentHero.pos.x].visited = true;
  renderMap();
}

// Temporary Creation Selection State (Simplified for brevity, refer to prev build for flow)
currentHero = {
  id: 'h1', name: 'EINAR', gender: 'Man', class: 'Warrior',
  currentLocation: 'Landfall', pos: {x:9, y:17}, time: {hour:8, day:1}
};

document.getElementById('btn-new-journey').onclick = launchGameplay;
document.getElementById('btn-continue-journey').onclick = launchGameplay;