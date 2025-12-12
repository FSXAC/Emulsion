/**
 * Mapping utility for film stock names to their corresponding icon images
 */

import fuji400Icon from '../assets/film-stocks/fuji-400.png';
import fuji200Icon from '../assets/film-stocks/fuji-200.png';
import fujiSuperiaXTRA200Icon from '../assets/film-stocks/fuji-superia-xtra-200.png';
import fujiSuperiaXTRA100Icon from '../assets/film-stocks/fuji-superia-xtra-100.png';
import ilfordDelta400Icon from '../assets/film-stocks/ilford-delta-400.png';
import ilfordHp5Plus400Icon from '../assets/film-stocks/ilford-hp5.png';
import ilfordSfx200Icon from '../assets/film-stocks/ilford-sfx-200.png';
import kentmerePan100Icon from '../assets/film-stocks/kentmere-200.png';
import kentmerePan400Icon from '../assets/film-stocks/kentmere-400.png';
import kodakUltra400Icon from '../assets/film-stocks/kodak-400.png';
import kodak200Icon from '../assets/film-stocks/kodak-200.png';
import kodakColorPlus200Icon from '../assets/film-stocks/kodak-colorplus-200.png';
import kodakPro100Icon from '../assets/film-stocks/kodak-pro-100.png';
import kodakPortra400Icon from '../assets/film-stocks/kodak-portra-400.png';
import kodakVision3500TIcon from '../assets/film-stocks/kodak-vision3-500t.png';
import kodakEktar100Icon from '../assets/film-stocks/kodak-ektar-100.png';
import fomapan100Icon from '../assets/film-stocks/fomapan-100.png';
import harmanPhoenix200Icon from '../assets/film-stocks/harman-phoenix-200.png';
import harmanPhoenix200IIIcon from '../assets/film-stocks/harman-phoenix-200-ii.png';
import flicAurora800 from '../assets/film-stocks/flic-aurora-800.png';
import cinestill800T from '../assets/film-stocks/cinestill-800t.png';
import cinestill50D from '../assets/film-stocks/cinestill-50d.png';
import cinestill400D from '../assets/film-stocks/cinestill-400d.png';
import reflx800 from '../assets/film-stocks/reflx-800.png';
import reflx400 from '../assets/film-stocks/reflx-400.png';
import onesec640t from '../assets/film-stocks/onesec-640t.png';
import unknownRollIcon from '../assets/film-stocks/unknown.png';

// These are for 35mm but the images are actually of disposable cameras
import fujiQuickSnapIcon from '../assets/film-stocks/fuji-quicksnap-400.png';
import kodakFunSaver800Icon from '../assets/film-stocks/kodak-funsaver-800.png';


// 120 film
import kodakEktar100_120 from '../assets/film-stocks/kodak-ektar-100-120.png';
import kentmere400_120 from '../assets/film-stocks/kentmere-400-120.png';
import unknownRollIcon120 from '../assets/film-stocks/unknown-120.png';

// Direct mapping from exact film stock names to images
const filmStockImageMap = {
  // Fujifilm stocks
  'Fujifilm 400': fuji400Icon,
  'Fujifilm 200': fuji200Icon,
  'Fujicolor Superia X-TRA 200': fujiSuperiaXTRA200Icon,
  'Fujicolor Superia X-TRA 100': fujiSuperiaXTRA100Icon,
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
  'Kodak ColorPlus 200': kodakColorPlus200Icon,
  'Kodak Portra 400': kodakPortra400Icon,
  'Kodak Vision3 500T': kodakVision3500TIcon,
  
  // Fomapan stocks
  'Fomapan 100': fomapan100Icon,
  
  // OneSec stocks
  'OneSec 640T': onesec640t,
  
  // Harman stocks
  'Harman Phoenix 200': harmanPhoenix200Icon,
  'Harman Phoenix 200 II': harmanPhoenix200IIIcon,
  
  // Reflx stocks
  'Reflx Lab 800': reflx800,
  'Reflx Lab 400': reflx400,

  // Flic film stocks
  'Flic Film Aurora 800': flicAurora800,

  // Cinestill stocks
  'Cinestill 800T': cinestill800T,
  'Cinestill 50D': cinestill50D,
  'Cinestill 400D': cinestill400D,

  // Disposable cameras (35mm)
  'Fujifilm QuickSnap 400': fujiQuickSnapIcon,
  'Kodak FunSaver 800': kodakFunSaver800Icon,
};

const filmStockImageMap120 = {
  'Kodak Ektar 100': kodakEktar100_120,
  'Kentmere Pan 400': kentmere400_120,
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
 * @param {string} filmFormat - The film format (e.g., '35mm', '120')
 * @returns {string} - The image URL or path to the icon
 */
export const getFilmStockImage = (filmStockName, filmFormat = '35mm') => {
  if (!filmStockName) {
    return filmFormat === '120' ? unknownRollIcon120 : unknownRollIcon;
  }

  // Select the appropriate map based on format
  const is120 = filmFormat === '120';
  const primaryMap = is120 ? filmStockImageMap120 : filmStockImageMap;
  const fallbackMap = is120 ? filmStockImageMap : null; // 120 can fallback to 35mm if no 120 version exists

  // Try exact match first in primary map
  if (primaryMap[filmStockName]) {
    return primaryMap[filmStockName];
  }

  // Try fuzzy match in primary map
  const normalizedInput = normalizeFilmStockName(filmStockName);
  
  let matchedKey = Object.keys(primaryMap).find(key => {
    const normalizedKey = normalizeFilmStockName(key);
    return normalizedKey === normalizedInput || 
           normalizedKey.includes(normalizedInput) ||
           normalizedInput.includes(normalizedKey);
  });

  if (matchedKey) {
    return primaryMap[matchedKey];
  }

  // For 120, try fallback to 35mm map if no 120-specific image found
  if (is120 && fallbackMap) {
    // Try exact match in fallback
    if (fallbackMap[filmStockName]) {
      return fallbackMap[filmStockName];
    }

    // Try fuzzy match in fallback
    matchedKey = Object.keys(fallbackMap).find(key => {
      const normalizedKey = normalizeFilmStockName(key);
      return normalizedKey === normalizedInput || 
             normalizedKey.includes(normalizedInput) ||
             normalizedInput.includes(normalizedKey);
    });

    if (matchedKey) {
      return fallbackMap[matchedKey];
    }
  }

  // No match found, return default unknown icon based on format
  return is120 ? unknownRollIcon120 : unknownRollIcon;
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
