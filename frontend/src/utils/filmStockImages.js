/**
 * Mapping utility for film stock names to their corresponding icon images
 */

import fuji400Icon from '../assets/film-stocks/fuji-400.png';
import ilfordDelta400Icon from '../assets/film-stocks/ilford-delta-400.png';
import ilfordHp5Plus400Icon from '../assets/film-stocks/ilford-hp5.png';
import ilfordSfx200Icon from '../assets/film-stocks/ilford-sfx-200.png';
import kentmerePan100Icon from '../assets/film-stocks/kentmere-200.png';
import kentmerePan400Icon from '../assets/film-stocks/kentmere-400.png';
import kodakUltra400Icon from '../assets/film-stocks/kodak-400.png';
import kodak200Icon from '../assets/film-stocks/kodak-200.png';
import kodakPro100Icon from '../assets/film-stocks/kodak-pro-100.png';
import kodakEktar100Icon from '../assets/film-stocks/kodak-ektar-100.png';
import flicAurora800 from '../assets/film-stocks/flic-aurora-800.png';
import cinestill800T from '../assets/film-stocks/cinestill-800t.png';
import cinestill50D from '../assets/film-stocks/cinestill-50d.png';
import cinestill400D from '../assets/film-stocks/cinestill-400d.png';
import unknownRollIcon from '../assets/film-stocks/unknown.png';


// Direct mapping from exact film stock names to images
const filmStockImageMap = {
  // Fujifilm stocks
  'Fujifilm 400': fuji400Icon,
  'Fujicolor Superia X-TRA 200': fuji400Icon,
  'Fujicolor Superia 400': fuji400Icon,
  
  // Ilford stocks
  'Ilford Delta 400': ilfordDelta400Icon,
  'Ilford HP5 Plus 400': ilfordHp5Plus400Icon,
  'Ilford SFX 200': ilfordSfx200Icon,
  
  // Kentmere stocks
  'Kentmere Pan 100': kentmerePan100Icon,
  'Kentmere Pan 400': kentmerePan400Icon,
  
  // Kodak stocks
  'Kodak GC400': kodakUltra400Icon,
  'Kodak GB200': kodak200Icon,
  'Kodak UltraMax 400': kodakUltra400Icon,
  'Kodak Gold 200': kodak200Icon,
  'Kodak Pro Image 100': kodakPro100Icon,
  'Kodak Ektar 100': kodakEktar100Icon,

  // Flic film stocks
  'Flic Film Aurora 800': flicAurora800,

  // Cinestill stocks
  'Cinestill 800T': cinestill800T,
  'Cinestill 50D': cinestill50D,
  'Cinestill 400D': cinestill400D,
};

/**
 * Normalize a film stock name for fuzzy matching
 * Removes spaces, dashes, and converts to lowercase
 */
const normalizeFilmStockName = (name) => {
  return name.toLowerCase().replace(/[\s\-+]/g, '');
};

/**
 * Get the image URL for a given film stock name
 * 
 * @param {string} filmStockName - The name of the film stock
 * @param {string} filmFormat - The film format (e.g., '35mm', '120') - currently unused but available for future use
 * @returns {string} - The image URL or path to the icon
 */
export const getFilmStockImage = (filmStockName, filmFormat = '35mm') => {
  if (!filmStockName) {
    return unknownRollIcon;
  }

  // Try exact match first
  if (filmStockImageMap[filmStockName]) {
    return filmStockImageMap[filmStockName];
  }

  // Try fuzzy match by normalizing both the input and map keys
  const normalizedInput = normalizeFilmStockName(filmStockName);
  
  const matchedKey = Object.keys(filmStockImageMap).find(key => {
    const normalizedKey = normalizeFilmStockName(key);
    return normalizedKey === normalizedInput || 
           normalizedKey.includes(normalizedInput) ||
           normalizedInput.includes(normalizedKey);
  });

  if (matchedKey) {
    return filmStockImageMap[matchedKey];
  }

  // No match found, return default unknown icon
  return unknownRollIcon;
};

/**
 * Add a new film stock to image mapping at runtime
 * Useful for dynamically adding new film stocks without code changes
 * 
 * @param {string} filmStockName - The name of the film stock
 * @param {string} imagePath - The imported image module
 */
export const addFilmStockMapping = (filmStockName, imagePath) => {
  filmStockImageMap[filmStockName] = imagePath;
};

/**
 * Get all available film stock mappings
 * Useful for debugging or displaying available stocks
 * 
 * @returns {Object} - Object with film stock names as keys and image paths as values
 */
export const getAllFilmStockMappings = () => {
  return { ...filmStockImageMap };
};
