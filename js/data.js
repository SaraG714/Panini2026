// === Datos iniciales del álbum Panini FIFA World Cup 2026™ ===
// Estructura de 12 grupos x 4 equipos x 20 cromos = 960 + 20 especiales = 980

const ALBUM = {
  groups: [
    {
      letter: 'A',
      color: '#1a7e3c',
      teams: [
        { name: 'México',       flag: '🇲🇽', short: 'MEX', start: 10 },
        { name: 'Sudáfrica',    flag: '🇿🇦', short: 'RSA', start: 30 },
        { name: 'Corea del Sur',flag: '🇰🇷', short: 'KOR', start: 50 },
        { name: 'Rep. Checa',   flag: '🇨🇿', short: 'CZE', start: 70 },
      ],
    },
    {
      letter: 'B',
      color: '#1f3a8a',
      teams: [
        { name: 'Canadá',             flag: '🇨🇦', short: 'CAN', start: 90 },
        { name: 'Bosnia-Herzegovina', flag: '🇧🇦', short: 'BIH', start: 110 },
        { name: 'Qatar',              flag: '🇶🇦', short: 'QAT', start: 130 },
        { name: 'Suiza',              flag: '🇨🇭', short: 'SWI', start: 150 },
      ],
    },
    {
      letter: 'C',
      color: '#4c1d95',
      teams: [
        { name: 'Brasil',     flag: '🇧🇷', short: 'BRA', start: 170 },
        { name: 'Marruecos',  flag: '🇲🇦', short: 'MAR', start: 190 },
        { name: 'Haití',      flag: '🇭🇹', short: 'HAI', start: 210 },
        { name: 'Escocia',    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', short: 'SCO', start: 230 },
      ],
    },
    {
      letter: 'D',
      color: '#b91c1c',
      teams: [
        { name: 'EE.UU.',    flag: '🇺🇸', short: 'USA', start: 250 },
        { name: 'Paraguay',  flag: '🇵🇾', short: 'PAR', start: 270 },
        { name: 'Australia', flag: '🇦🇺', short: 'AUS', start: 290 },
        { name: 'Turquía',   flag: '🇹🇷', short: 'TUR', start: 310 },
      ],
    },
    {
      letter: 'E',
      color: '#c2410c',
      teams: [
        { name: 'Alemania',       flag: '🇩🇪', short: 'GER', start: 330 },
        { name: 'Curazao',        flag: '🇨🇼', short: 'CUW', start: 350 },
        { name: 'Costa de Marfil',flag: '🇨🇮', short: 'CIV', start: 370 },
        { name: 'Ecuador',        flag: '🇪🇨', short: 'ECU', start: 390 },
      ],
    },
    {
      letter: 'F',
      color: '#0f766e',
      teams: [
        { name: 'Países Bajos', flag: '🇳🇱', short: 'NED', start: 410 },
        { name: 'Japón',        flag: '🇯🇵', short: 'JPN', start: 430 },
        { name: 'Suecia',       flag: '🇸🇪', short: 'SWE', start: 450 },
        { name: 'Túnez',        flag: '🇹🇳', short: 'TUN', start: 470 },
      ],
    },
    {
      letter: 'G',
      color: '#334155',
      teams: [
        { name: 'Bélgica',       flag: '🇧🇪', short: 'BEL', start: 490 },
        { name: 'Egipto',        flag: '🇪🇬', short: 'EGY', start: 510 },
        { name: 'Irán',          flag: '🇮🇷', short: 'IRN', start: 530 },
        { name: 'Nueva Zelanda', flag: '🇳🇿', short: 'NZL', start: 550 },
      ],
    },
    {
      letter: 'H',
      color: '#9d174d',
      teams: [
        { name: 'España',       flag: '🇪🇸', short: 'ESP', start: 570 },
        { name: 'Cabo Verde',   flag: '🇨🇻', short: 'CPV', start: 590 },
        { name: 'Arabia Saudí', flag: '🇸🇦', short: 'KSA', start: 610 },
        { name: 'Uruguay',      flag: '🇺🇾', short: 'URU', start: 630 },
      ],
    },
    {
      letter: 'I',
      color: '#1e40af',
      teams: [
        { name: 'Francia', flag: '🇫🇷', short: 'FRA', start: 650 },
        { name: 'Senegal', flag: '🇸🇳', short: 'SEN', start: 670 },
        { name: 'Irak',    flag: '🇮🇶', short: 'IRQ', start: 690 },
        { name: 'Noruega', flag: '🇳🇴', short: 'NOR', start: 710 },
      ],
    },
    {
      letter: 'J',
      color: '#15803d',
      teams: [
        { name: 'Argentina',flag: '🇦🇷', short: 'ARG', start: 730 },
        { name: 'Argelia',  flag: '🇩🇿', short: 'ALG', start: 750 },
        { name: 'Austria',  flag: '🇦🇹', short: 'AUT', start: 770 },
        { name: 'Jordania', flag: '🇯🇴', short: 'JOR', start: 790 },
      ],
    },
    {
      letter: 'K',
      color: '#78350f',
      teams: [
        { name: 'Portugal',   flag: '🇵🇹', short: 'POR', start: 810 },
        { name: 'Congo DR',   flag: '🇨🇩', short: 'COD', start: 830 },
        { name: 'Uzbekistán', flag: '🇺🇿', short: 'UZB', start: 850 },
        { name: 'Colombia',   flag: '🇨🇴', short: 'COL', start: 870 },
      ],
    },
    {
      letter: 'L',
      color: '#0c4a6e',
      teams: [
        { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', short: 'ENG', start: 890 },
        { name: 'Croacia',    flag: '🇭🇷', short: 'CRO', start: 910 },
        { name: 'Ghana',      flag: '🇬🇭', short: 'GHA', start: 930 },
        { name: 'Panamá',     flag: '🇵🇦', short: 'PAN', start: 950 },
      ],
    },
  ],

  // Cromos especiales (Panini + FWC 1-19)
  specials: [
    { id: 'FWC0',  label: '00',     desc: 'Panini (sticker especial)' },
    { id: 'FWC1',  label: 'FWC 1',  desc: 'Official Emblem' },
    { id: 'FWC2',  label: 'FWC 2',  desc: 'Official Emblem cont. / Intro' },
    { id: 'FWC3',  label: 'FWC 3',  desc: 'Official Mascots' },
    { id: 'FWC4',  label: 'FWC 4',  desc: 'Official Slogan' },
    { id: 'FWC5',  label: 'FWC 5',  desc: 'Official Ball' },
    { id: 'FWC6',  label: 'FWC 6',  desc: 'CAN (anfitrión)' },
    { id: 'FWC7',  label: 'FWC 7',  desc: 'MEX (anfitrión)' },
    { id: 'FWC8',  label: 'FWC 8',  desc: 'USA (anfitrión)' },
    { id: 'FWC9',  label: 'FWC 9',  desc: 'Italia 1934' },
    { id: 'FWC10', label: 'FWC 10', desc: 'Brasil 1950' },
    { id: 'FWC11', label: 'FWC 11', desc: 'Switzerland 1954' },
    { id: 'FWC12', label: 'FWC 12', desc: 'Chile 1962' },
    { id: 'FWC13', label: 'FWC 13', desc: 'Germany 1974' },
    { id: 'FWC14', label: 'FWC 14', desc: 'México 1986' },
    { id: 'FWC15', label: 'FWC 15', desc: 'USA 1994' },
    { id: 'FWC16', label: 'FWC 16', desc: 'Korea/Japan 2002' },
    { id: 'FWC17', label: 'FWC 17', desc: 'Germany 2006' },
    { id: 'FWC18', label: 'FWC 18', desc: 'Brasil 2014' },
    { id: 'FWC19', label: 'FWC 19', desc: 'Qatar 2022' },
  ],
};

// === Estado inicial: cromos FALTANTES según el PDF (todo lo demás = conseguido) ===
const INITIAL_MISSING = new Set([
  // Grupo A (11)
  '12','20','22','24','50','54','66','71','74','78','82',
  // Grupo B (6)
  '111','119','126','129','134','148',
  // Grupo C (12)
  '171','174','175','179','182','184','194','202','203','218','240','245',
  // Grupo D (3)
  '273','311','329',
  // Grupo E (6)
  '330','338','345','366','374','381',
  // Grupo F (11)
  '418','431','434','438','446','462','464','468','472','475','480',
  // Grupo G (7)
  '513','519','531','537','549','552','567',
  // Grupo H (13)
  '595','598','602','604','607','613','615','620','634','635','641','643','646',
  // Grupo I (7)
  '675','692','707','708','709','721','722',
  // Grupo J (7)
  '738','739','748','758','762','772','789',
  // Grupo K (5)
  '820','838','843','849','853',
  // Grupo L (6)
  '897','904','929','934','935','969',
  // Especiales (3)
  'FWC6','FWC13','FWC18',
]);

// Construye el set inicial de cromos CONSEGUIDOS a partir de los faltantes
function buildInitialOwned() {
  const owned = new Set();
  // Cromos normales: 10..969
  ALBUM.groups.forEach(g => {
    g.teams.forEach(t => {
      for (let i = 0; i < 20; i++) {
        const num = String(t.start + i);
        if (!INITIAL_MISSING.has(num)) owned.add(num);
      }
    });
  });
  // Especiales
  ALBUM.specials.forEach(s => {
    if (!INITIAL_MISSING.has(s.id)) owned.add(s.id);
  });
  return owned;
}

// Gastos iniciales del PDF
const INITIAL_GASTOS = [
  { fecha: '25-4', sobres: 4,  cromos: 28,  gasto: 5.00 },
  { fecha: '26-4', sobres: 5,  cromos: 35,  gasto: 7.50 },
  { fecha: '28-4', sobres: 3,  cromos: 21,  gasto: 4.50 },
  { fecha: '2-5',  sobres: 8,  cromos: 56,  gasto: 12.00 },
  { fecha: '3-5',  sobres: 1,  cromos: 11,  gasto: 0 },
  { fecha: '10-5', sobres: 50, cromos: 350, gasto: 65.00 },
  { fecha: '16-5', sobres: 50, cromos: 350, gasto: 65.00 },
  { fecha: '',     sobres: 12, cromos: 84,  gasto: 0 },
];

// Colores disponibles para miembros de la familia
const MEMBER_COLORS = [
  '#ec4899','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444','#14b8a6','#f97316',
];

// Construye el mapa inicial de cromos (id → cantidad) a partir de los faltantes del PDF
function buildInitialOwnedMap() {
  const owned = {};
  ALBUM.groups.forEach(g => {
    g.teams.forEach(t => {
      for (let i = 0; i < 20; i++) {
        const num = String(t.start + i);
        if (!INITIAL_MISSING.has(num)) owned[num] = 1;
      }
    });
  });
  ALBUM.specials.forEach(s => {
    if (!INITIAL_MISSING.has(s.id)) owned[s.id] = 1;
  });
  return owned;
}

// Etiqueta de un cromo: "Escudo / Badge", "Foto grupal", o "Jugador N"
function stickerLabel(team, num) {
  const offset = num - team.start;
  if (offset === 0)  return 'Escudo / Badge';
  if (offset === 12) return 'Foto grupal';
  return `Jugador ${offset + 1}`;
}
