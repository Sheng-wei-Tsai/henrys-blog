// ─── Australian creature evolution registry ───────────────────────────────────
export type CreatureId =
  | 'quokka' | 'wombat' | 'platypus' | 'kookaburra'
  | 'sugarGlider' | 'echidna' | 'tazDevil' | 'numbat';

export type HabitatKey = 'bushland' | 'scrubland' | 'wetland' | 'forest' | 'woodland';

export interface CreatureDef {
  id:            CreatureId;
  idx:           number;        // 0-7, used to index drawing function
  name:          string;
  sciName:       string;
  tier:          1 | 2 | 3 | 4;
  rarity:        'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary';
  region:        string;
  habitat:       HabitatKey;
  unlockFeature: string;
  description:   string;
  funFact:       string;
}

export const CREATURES: CreatureDef[] = [
  {
    id: 'quokka', idx: 0,
    name: 'Quokka', sciName: 'Setonix brachyurus',
    tier: 1, rarity: 'Common',
    region: 'Rottnest Island, WA',
    habitat: 'bushland',
    unlockFeature: 'Interaction sounds unlocked',
    description: 'The happiest animal on Earth',
    funFact: 'Quokkas selfie with tourists on Rottnest Island and always look like they\'re smiling.',
  },
  {
    id: 'wombat', idx: 1,
    name: 'Wombat', sciName: 'Vombatus ursinus',
    tier: 1, rarity: 'Common',
    region: 'SE Australia & Tasmania',
    habitat: 'scrubland',
    unlockFeature: 'Interaction sounds unlocked',
    description: 'The cube-poo architect',
    funFact: 'Wombats produce cube-shaped droppings — the only animal in the world to do so.',
  },
  {
    id: 'platypus', idx: 2,
    name: 'Platypus', sciName: 'Ornithorhynchus anatinus',
    tier: 2, rarity: 'Uncommon',
    region: 'Eastern Australia & Tasmania',
    habitat: 'wetland',
    unlockFeature: 'Habitat ambient sounds unlocked',
    description: 'The duck-billed detective',
    funFact: 'When the first platypus specimen arrived in Britain, scientists thought it was a taxidermist\'s hoax.',
  },
  {
    id: 'kookaburra', idx: 3,
    name: 'Kookaburra', sciName: 'Dacelo novaeguineae',
    tier: 2, rarity: 'Uncommon',
    region: 'Eastern & SW Australia',
    habitat: 'forest',
    unlockFeature: 'Habitat ambient sounds unlocked',
    description: 'The laughing king of the bush',
    funFact: 'Kookaburras use their famous laugh to mark territory — usually at dawn and dusk.',
  },
  {
    id: 'sugarGlider', idx: 4,
    name: 'Sugar Glider', sciName: 'Petaurus breviceps',
    tier: 3, rarity: 'Rare',
    region: 'Northern & Eastern Australia',
    habitat: 'forest',
    unlockFeature: 'GLIDE special interaction unlocked',
    description: 'The night glider',
    funFact: 'Sugar gliders can glide up to 50 metres using their patagium — the membrane between limbs.',
  },
  {
    id: 'echidna', idx: 5,
    name: 'Echidna', sciName: 'Tachyglossus aculeatus',
    tier: 3, rarity: 'Rare',
    region: 'All of Australia',
    habitat: 'bushland',
    unlockFeature: 'CURL special interaction unlocked',
    description: 'The spiky egg-layer',
    funFact: 'Echidnas are one of only two monotremes (egg-laying mammals) alongside the platypus.',
  },
  {
    id: 'tazDevil', idx: 6,
    name: 'Tasmanian Devil', sciName: 'Sarcophilus harrisii',
    tier: 4, rarity: 'Very Rare',
    region: 'Tasmania',
    habitat: 'woodland',
    unlockFeature: 'Full soundscape + SCARE interaction unlocked',
    description: 'The screaming carnivore',
    funFact: 'Tasmanian Devils have the strongest bite relative to body size of any mammal.',
  },
  {
    id: 'numbat', idx: 7,
    name: 'Numbat', sciName: 'Myrmecobius fasciatus',
    tier: 4, rarity: 'Legendary',
    region: 'SW Western Australia',
    habitat: 'woodland',
    unlockFeature: 'Full soundscape + rare tongue animation unlocked',
    description: 'The critically endangered termite eater',
    funFact: 'Fewer than 1,000 Numbats remain in the wild — they are one of Australia\'s rarest mammals.',
  },
];

// ─── Tier pools ────────────────────────────────────────────────────────────────
const TIER_POOLS: Record<number, CreatureId[]> = {
  1: ['quokka', 'wombat'],
  2: ['platypus', 'kookaburra'],
  3: ['sugarGlider', 'echidna'],
  4: ['tazDevil', 'numbat'],
};

/** Returns the evolution tier for a given level (Lv2→1, Lv3→2, etc.) */
export function getTier(level: number): number {
  return Math.max(1, Math.min(4, level - 1));
}

/** Roll a random creature for the given level's tier (different from current if possible) */
export function rollCreature(level: number, currentId?: string): CreatureId {
  const pool = TIER_POOLS[getTier(level)] ?? TIER_POOLS[1];
  const filtered = pool.filter(id => id !== currentId);
  const candidates = filtered.length > 0 ? filtered : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getCreature(id: string): CreatureDef | undefined {
  return CREATURES.find(c => c.id === id);
}

export function getCreatureIdx(id: string): number {
  return CREATURES.find(c => c.id === id)?.idx ?? 0;
}

/** Habitat theme colors for HabitatScene terminal */
export const HABITAT_THEME: Record<HabitatKey, { primary: string; mid: string; dim: string }> = {
  bushland: { primary: '#33FF00', mid: '#1A9900', dim: '#0B5200' },
  scrubland:{ primary: '#FFB000', mid: '#CC8800', dim: '#664400' },
  wetland:  { primary: '#00DDFF', mid: '#008899', dim: '#004455' },
  forest:   { primary: '#44FF88', mid: '#228844', dim: '#0A3320' },
  woodland: { primary: '#FF6633', mid: '#AA3311', dim: '#551A08' },
};
