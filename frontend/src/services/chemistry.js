import api from './api';

/**
 * Chemistry Batches API Service
 * Provides functions to interact with the /api/chemistry endpoints
 */

// List all chemistry batches with optional filtering and pagination
export const getChemistry = async ({ skip = 0, limit = 100, activeOnly = false, chemistryType = null } = {}) => {
  const params = { skip, limit };
  if (activeOnly) params.active_only = true;
  if (chemistryType) params.chemistry_type = chemistryType;
  
  return api.get('/api/chemistry', { params });
};

// Get single chemistry batch by ID
export const getChemistryBatch = async (batchId) => {
  return api.get(`/api/chemistry/${batchId}`);
};

// Create new chemistry batch
export const createChemistry = async (batchData) => {
  return api.post('/api/chemistry', batchData);
};

// Update existing chemistry batch (partial update)
export const updateChemistry = async (batchId, batchData) => {
  return api.put(`/api/chemistry/${batchId}`, batchData);
};

// Delete chemistry batch
export const deleteChemistry = async (batchId) => {
  return api.delete(`/api/chemistry/${batchId}`);
};

// Export all functions as a named object for convenience
export default {
  getChemistry,
  getChemistryBatch,
  createChemistry,
  updateChemistry,
  deleteChemistry
};
