export const BODY_ZONES = [
  { id: 'head', label: 'Cabeça' },
  { id: 'neck', label: 'Pescoço' },
  { id: 'thorax', label: 'Tórax' },
  { id: 'lumbar', label: 'Lombar' },
  { id: 'sacrum', label: 'Sacro / Cauda' },
  { id: 'front_right', label: 'MMA Direito' },
  { id: 'front_left', label: 'MMA Esquerdo' },
  { id: 'rear_right', label: 'MMP Direito' },
  { id: 'rear_left', label: 'MMP Esquerdo' },
  { id: 'abdomen', label: 'Abdômen' },
];

// Percentual positions over the generated photographs. The hit areas are
// intentionally transparent: the photo remains the only visual map.
export const BODY_ZONE_HOTSPOTS = {
  lateral: [
    { id: 'head', left: 3, top: 8, width: 18, height: 32 },
    { id: 'neck', left: 15, top: 22, width: 15, height: 39 },
    { id: 'thorax', left: 27, top: 28, width: 18, height: 32 },
    { id: 'lumbar', left: 45, top: 28, width: 22, height: 31 },
    { id: 'sacrum', left: 66, top: 28, width: 24, height: 35 },
    { id: 'front_right', left: 17, top: 58, width: 10, height: 34 },
    { id: 'front_left', left: 25, top: 60, width: 12, height: 32 },
    { id: 'rear_right', left: 59, top: 60, width: 11, height: 32 },
    { id: 'rear_left', left: 69, top: 58, width: 12, height: 34 },
    { id: 'abdomen', left: 36, top: 51, width: 29, height: 20 },
  ],
  superior: [
    { id: 'head', left: 2, top: 31, width: 18, height: 35 },
    { id: 'neck', left: 17, top: 32, width: 14, height: 38 },
    { id: 'thorax', left: 28, top: 30, width: 20, height: 40 },
    { id: 'lumbar', left: 47, top: 30, width: 22, height: 40 },
    { id: 'sacrum', left: 68, top: 33, width: 24, height: 35 },
    { id: 'front_right', left: 16, top: 18, width: 14, height: 22 },
    { id: 'front_left', left: 16, top: 64, width: 14, height: 22 },
    { id: 'rear_right', left: 62, top: 18, width: 14, height: 22 },
    { id: 'rear_left', left: 62, top: 64, width: 14, height: 22 },
    { id: 'abdomen', left: 37, top: 46, width: 29, height: 25 },
  ],
};

const CANINE_ANATOMY = {
  label: 'Canino',
  images: {
    lateral: '/anatomy/canine-lateral.png',
    superior: '/anatomy/canine-superior.png',
  },
};

const FELINE_ANATOMY = {
  label: 'Felino',
  images: {
    lateral: '/anatomy/feline-lateral.png',
    superior: '/anatomy/feline-superior.png',
  },
};

export const ANIMAL_SVG_BY_SPECIES = {
  canino: CANINE_ANATOMY,
  felino: FELINE_ANATOMY,
};

export const normalizeSpecies = (species) => (
  String(species || '').trim().toLowerCase() === 'felino' ? 'felino' : 'canino'
);
