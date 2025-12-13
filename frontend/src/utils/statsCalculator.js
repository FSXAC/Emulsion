/**
 * Statistics Calculator Utility
 * Pure functions for computing statistics from film roll and chemistry data
 */

/**
 * Calculate total spending across all rolls
 * Handles "not_mine" rolls correctly (only count dev cost, not film cost)
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {number} Total spending
 */
export function calculateTotalSpending(rolls) {
  return rolls.reduce((sum, roll) => {
    if (roll.not_mine) {
      // Friend's roll - only count dev cost (user doesn't pay for film)
      return sum + Number(roll.dev_cost || 0);
    }
    // User's roll - count total cost (film + dev)
    return sum + Number(roll.total_cost || roll.film_cost || 0);
  }, 0);
}

/**
 * Calculate total shots taken across all rolls
 * Uses actual_exposures if available, falls back to expected_exposures
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {number} Total shots
 */
export function calculateTotalShots(rolls) {
  return rolls.reduce((sum, roll) => {
    return sum + (roll.actual_exposures || roll.expected_exposures || 0);
  }, 0);
}

/**
 * Calculate average cost per shot
 * 
 * @param {number} totalSpending - Total spending
 * @param {number} totalShots - Total shots
 * @returns {number} Average cost per shot (0 if no shots)
 */
export function calculateAvgCostPerShot(totalSpending, totalShots) {
  if (totalShots === 0) return 0;
  return totalSpending / totalShots;
}

/**
 * Calculate rolls grouped by status
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Object} Object with status counts {NEW: 5, LOADED: 3, etc.}
 */
export function calculateStatusDistribution(rolls) {
  const distribution = {
    NEW: 0,
    LOADED: 0,
    EXPOSED: 0,
    DEVELOPED: 0,
    SCANNED: 0,
  };

  rolls.forEach((roll) => {
    const status = roll.status || 'NEW';
    if (distribution.hasOwnProperty(status)) {
      distribution[status]++;
    }
  });

  return distribution;
}

/**
 * Calculate rolls grouped by format
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Object} Object with format counts {35mm: 10, 120: 5, etc.}
 */
export function calculateFormatDistribution(rolls) {
  return rolls.reduce((acc, roll) => {
    const format = roll.film_format || 'Unknown';
    acc[format] = (acc[format] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Calculate top film stocks by usage count
 * 
 * @param {Array} rolls - Array of film roll objects
 * @param {number} limit - Maximum number of stocks to return (default: 10)
 * @returns {Array} Array of [stockName, count] tuples, sorted by count descending
 */
export function calculateTopFilmStocks(rolls, limit = 10) {
  const stockCounts = rolls.reduce((acc, roll) => {
    const stock = roll.film_stock_name || 'Unknown';
    acc[stock] = (acc[stock] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(stockCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

/**
 * Calculate rating distribution (1-5 stars)
 * Only includes rolls that have been rated (stars > 0)
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Object} Object with star counts {1: 0, 2: 1, 3: 5, 4: 10, 5: 8}
 */
export function calculateRatingDistribution(rolls) {
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  rolls.forEach((roll) => {
    if (roll.stars && roll.stars > 0 && roll.stars <= 5) {
      distribution[roll.stars]++;
    }
  });

  return distribution;
}

/**
 * Calculate cost breakdown (film vs development)
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Object} {filmCost: number, devCost: number, totalCost: number}
 */
export function calculateCostBreakdown(rolls) {
  let filmCost = 0;
  let devCost = 0;

  rolls.forEach((roll) => {
    if (!roll.not_mine) {
      // Only count film cost for user's rolls
      filmCost += Number(roll.film_cost || 0);
    }
    devCost += Number(roll.dev_cost || 0);
  });

  return {
    filmCost,
    devCost,
    totalCost: filmCost + devCost,
  };
}

/**
 * Calculate chemistry usage by batch
 * Groups rolls by chemistry_id and counts usage
 * 
 * @param {Array} rolls - Array of film roll objects
 * @param {Array} chemistry - Array of chemistry batch objects
 * @returns {Array} Array of {batchName, rollCount, chemistryId} objects
 */
export function calculateChemistryUsage(rolls, chemistry) {
  // Count rolls per chemistry batch
  const usageCounts = rolls.reduce((acc, roll) => {
    if (roll.chemistry_id) {
      acc[roll.chemistry_id] = (acc[roll.chemistry_id] || 0) + 1;
    }
    return acc;
  }, {});

  // Map to chemistry batch names
  return Object.entries(usageCounts)
    .map(([chemistryId, rollCount]) => {
      const batch = chemistry.find((c) => c.id === chemistryId);
      return {
        batchName: batch ? batch.name : `Unknown (${chemistryId})`,
        rollCount,
        chemistryId,
      };
    })
    .sort((a, b) => b.rollCount - a.rollCount); // Sort by usage descending
}

/**
 * Find most expensive roll
 * Properly calculates total cost including film + dev costs
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Object|null} Roll object with highest total_cost, or null if no rolls
 */
export function findMostExpensiveRoll(rolls) {
  if (rolls.length === 0) return null;

  // Helper to get total cost for a roll
  const getTotalCost = (roll) => {
    if (roll.total_cost) return Number(roll.total_cost);
    const filmCost = roll.not_mine ? 0 : Number(roll.film_cost || 0);
    const devCost = Number(roll.dev_cost || 0);
    return filmCost + devCost;
  };

  return rolls.reduce((mostExpensive, roll) => {
    const rollCost = getTotalCost(roll);
    const currentMax = getTotalCost(mostExpensive);
    return rollCost > currentMax ? roll : mostExpensive;
  }, rolls[0]);
}

/**
 * Find cheapest cost per shot
 * Only considers user's rolls (not_mine=false) with actual_exposures and positive cost_per_shot
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Object|null} Roll object with lowest cost_per_shot, or null if no valid rolls
 */
export function findCheapestPerShot(rolls) {
  const validRolls = rolls.filter(
    (roll) => !roll.not_mine && roll.cost_per_shot && roll.cost_per_shot > 0
  );

  if (validRolls.length === 0) return null;

  return validRolls.reduce((cheapest, roll) => {
    return Number(roll.cost_per_shot) < Number(cheapest.cost_per_shot) ? roll : cheapest;
  }, validRolls[0]);
}

/**
 * Format currency value
 * 
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string (e.g., "$12.34")
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `$${Number(value).toFixed(2)}`;
}

/**
 * Calculate average rating across all rated rolls
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {number} Average rating (0 if no rated rolls)
 */
export function calculateAverageRating(rolls) {
  const ratedRolls = rolls.filter((roll) => roll.stars && roll.stars > 0);
  if (ratedRolls.length === 0) return 0;
  
  const totalStars = ratedRolls.reduce((sum, roll) => sum + roll.stars, 0);
  return totalStars / ratedRolls.length;
}

/**
 * Calculate average rating per film stock
 * Only includes film stocks with at least one rated roll
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Array} Array of {filmStock, avgRating, avgCostPerShot, rollCount} objects
 */
export function calculateFilmStockStats(rolls) {
  // Group rolls by film stock
  const stockGroups = rolls.reduce((acc, roll) => {
    const stock = roll.film_stock_name || 'Unknown';
    if (!acc[stock]) {
      acc[stock] = [];
    }
    acc[stock].push(roll);
    return acc;
  }, {});

  // Calculate stats for each film stock
  return Object.entries(stockGroups)
    .map(([filmStock, stockRolls]) => {
      // Calculate average rating (only from rated rolls)
      const ratedRolls = stockRolls.filter((roll) => roll.stars && roll.stars > 0);
      const avgRating = ratedRolls.length > 0
        ? ratedRolls.reduce((sum, roll) => sum + roll.stars, 0) / ratedRolls.length
        : null;

      // Calculate average cost per shot (only from user's rolls with cost_per_shot)
      const validCostRolls = stockRolls.filter(
        (roll) => !roll.not_mine && roll.cost_per_shot && roll.cost_per_shot > 0
      );
      const avgCostPerShot = validCostRolls.length > 0
        ? validCostRolls.reduce((sum, roll) => sum + Number(roll.cost_per_shot), 0) / validCostRolls.length
        : null;

      return {
        filmStock,
        avgRating,
        avgCostPerShot,
        rollCount: stockRolls.length,
        ratedCount: ratedRolls.length,
      };
    })
    .filter((stat) => stat.avgRating !== null && stat.avgCostPerShot !== null) // Only include stocks with both ratings and costs
    .sort((a, b) => b.rollCount - a.rollCount); // Sort by popularity
}

/**
 * Convert distribution object to chart data array
 * 
 * @param {Object} distribution - Object with key-value pairs
 * @param {string} keyName - Name for key field (default: 'name')
 * @param {string} valueName - Name for value field (default: 'count')
 * @returns {Array} Array of objects for charting [{name: 'KEY', count: VALUE}, ...]
 */
export function toChartData(distribution, keyName = 'name', valueName = 'count') {
  return Object.entries(distribution).map(([key, value]) => ({
    [keyName]: key,
    [valueName]: value,
  }));
}

/**
 * Calculate rolls loaded per month for timeline visualization
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Array} Array of {month: 'YYYY-MM', count: number} objects, sorted chronologically
 */
export function calculateRollsLoadedPerMonth(rolls) {
  const monthCounts = rolls.reduce((acc, roll) => {
    if (roll.date_loaded) {
      // Extract YYYY-MM from date
      const month = roll.date_loaded.substring(0, 7); // Assumes ISO format YYYY-MM-DD
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {});

  // Convert to array and sort chronologically
  return Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate rolls unloaded per month for timeline visualization
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Array} Array of {month: 'YYYY-MM', count: number} objects, sorted chronologically
 */
export function calculateRollsUnloadedPerMonth(rolls) {
  const monthCounts = rolls.reduce((acc, roll) => {
    if (roll.date_unloaded) {
      // Extract YYYY-MM from date
      const month = roll.date_unloaded.substring(0, 7); // Assumes ISO format YYYY-MM-DD
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {});

  // Convert to array and sort chronologically
  return Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate duration distribution (days in camera)
 * Groups rolls by duration ranges for histogram visualization
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Array} Array of {range: string, count: number} objects
 */
export function calculateDurationDistribution(rolls) {
  const ranges = {
    '0-7 days': 0,
    '8-14 days': 0,
    '15-30 days': 0,
    '31-60 days': 0,
    '61-90 days': 0,
    '91-180 days': 0,
    '180+ days': 0,
  };

  rolls.forEach((roll) => {
    const duration = roll.duration_days;
    if (duration !== null && duration !== undefined && duration >= 0) {
      if (duration <= 7) ranges['0-7 days']++;
      else if (duration <= 14) ranges['8-14 days']++;
      else if (duration <= 30) ranges['15-30 days']++;
      else if (duration <= 60) ranges['31-60 days']++;
      else if (duration <= 90) ranges['61-90 days']++;
      else if (duration <= 180) ranges['91-180 days']++;
      else ranges['180+ days']++;
    }
  });

  return Object.entries(ranges).map(([range, count]) => ({ range, count }));
}

/**
 * Get unique film stocks with their representative rolls
 * For gallery display - returns one representative roll per unique film stock
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Array} Array of {filmStock, format, roll, count} objects
 */
export function getUniqueFilmStocks(rolls) {
  const stockMap = new Map();

  rolls.forEach((roll) => {
    const key = `${roll.film_stock_name || 'Unknown'}-${roll.film_format || 'Unknown'}`;
    
    if (!stockMap.has(key)) {
      stockMap.set(key, {
        filmStock: roll.film_stock_name || 'Unknown',
        format: roll.film_format || 'Unknown',
        roll: roll, // Representative roll for this stock
        count: 1,
        rolls: [roll],
        totalStars: roll.stars || 0,
        ratedCount: (roll.stars && roll.stars > 0) ? 1 : 0,

        // Intetionally removed expected_exposures to use actual_exposures only
        totalExposures: roll.actual_exposures || 0,
      });
    } else {
      const entry = stockMap.get(key);
      entry.count++;
      entry.rolls.push(roll);
      
      // Update stats
      if (roll.stars && roll.stars > 0) {
        entry.totalStars += roll.stars;
        entry.ratedCount++;
      }

      // Intetionally removed expected_exposures to use actual_exposures only
      entry.totalExposures += (roll.actual_exposures || 0);

      // Update representative roll to highest rated or most recent
      if (roll.stars > (entry.roll.stars || 0)) {
        entry.roll = roll;
      } else if (roll.stars === entry.roll.stars && roll.date_loaded > entry.roll.date_loaded) {
        entry.roll = roll;
      }
    }
  });

  // Convert to array, calculate averages, and sort by count descending
  return Array.from(stockMap.values())
    .map(stock => ({
      ...stock,
      avgRating: stock.ratedCount > 0 ? stock.totalStars / stock.ratedCount : 0
    }))
    .sort((a, b) => b.count - a.count);
}
