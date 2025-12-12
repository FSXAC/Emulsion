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
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Object|null} Roll object with highest total_cost, or null if no rolls
 */
export function findMostExpensiveRoll(rolls) {
  if (rolls.length === 0) return null;

  return rolls.reduce((mostExpensive, roll) => {
    const rollCost = roll.total_cost || roll.film_cost || 0;
    const currentMax = mostExpensive.total_cost || mostExpensive.film_cost || 0;
    return rollCost > currentMax ? roll : mostExpensive;
  }, rolls[0]);
}

/**
 * Find cheapest cost per shot
 * Only considers rolls with actual_exposures and positive cost_per_shot
 * 
 * @param {Array} rolls - Array of film roll objects
 * @returns {Object|null} Roll object with lowest cost_per_shot, or null if no valid rolls
 */
export function findCheapestPerShot(rolls) {
  const validRolls = rolls.filter(
    (roll) => roll.cost_per_shot && roll.cost_per_shot > 0
  );

  if (validRolls.length === 0) return null;

  return validRolls.reduce((cheapest, roll) => {
    return roll.cost_per_shot < cheapest.cost_per_shot ? roll : cheapest;
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
