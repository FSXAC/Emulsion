import api from './api';

/**
 * Film Rolls API Service
 * Provides functions to interact with the /api/rolls endpoints
 */

// List all film rolls with optional filtering and pagination
export const getRolls = async ({ skip = 0, limit = 999, status = null, orderId = null, search = null } = {}) => {
  const params = {};
  
  // If search is provided, use it exclusively (no pagination)
  if (search) {
    params.search = search;
  } else {
    // Otherwise use legacy filters with pagination
    params.skip = skip;
    params.limit = limit;
    if (status) params.status = status;
    if (orderId) params.order_id = orderId;
  }
  
  return api.get('/api/rolls', { params });
};

// Get single film roll by ID
export const getRoll = async (rollId) => {
  return api.get(`/api/rolls/${rollId}`);
};

// Create new film roll
export const createRoll = async (rollData) => {
  return api.post('/api/rolls', rollData);
};

// Update existing film roll (partial update)
export const updateRoll = async (rollId, rollData) => {
  return api.put(`/api/rolls/${rollId}`, rollData);
};

// Delete film roll
export const deleteRoll = async (rollId) => {
  return api.delete(`/api/rolls/${rollId}`);
};

// --- Status Transition Actions ---

// Load roll (set date_loaded) - NEW → LOADED
export const loadRoll = async (rollId, dateLoaded) => {
  return api.patch(`/api/rolls/${rollId}/load`, {
    date_loaded: dateLoaded
  });
};

// Unload roll (set date_unloaded) - LOADED → EXPOSED
export const unloadRoll = async (rollId, dateUnloaded) => {
  return api.patch(`/api/rolls/${rollId}/unload`, {
    date_unloaded: dateUnloaded
  });
};

// Assign chemistry to roll - EXPOSED → DEVELOPED
export const assignChemistry = async (rollId, chemistryId) => {
  return api.patch(`/api/rolls/${rollId}/chemistry`, {
    chemistry_id: chemistryId
  });
};

// Rate roll (set stars and optional actual_exposures) - DEVELOPED → SCANNED
export const rateRoll = async (rollId, stars, actualExposures = null) => {
  const payload = { stars };
  if (actualExposures !== null) {
    payload.actual_exposures = actualExposures;
  }
  return api.patch(`/api/rolls/${rollId}/rating`, payload);
};

// Export all functions as a named object for convenience
export default {
  getRolls,
  getRoll,
  createRoll,
  updateRoll,
  deleteRoll,
  loadRoll,
  unloadRoll,
  assignChemistry,
  rateRoll
};
