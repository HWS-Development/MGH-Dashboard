import api from '@/api/base44Client';

/**
 * Generic query helper that talks to our Laravel API.
 * The Laravel backend handles all MySQL database queries.
 */
export async function dbQuery({ action, table, params, data, id }) {
  const response = await api.post('/data/query', {
    action,
    table,
    params,
    data,
    id,
  });
  return response.data;
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function listProperties(params = {}) {
  return dbQuery({ action: 'list', table: 'mgh_properties_final', params });
}

export async function getProperty(id) {
  const result = await dbQuery({ action: 'get', table: 'mgh_properties_final', id });
  return result.data?.[0] || null;
}

export async function updateProperty(id, data) {
  return dbQuery({ action: 'update', table: 'mgh_properties_final', id, data });
}

export async function insertProperty(data) {
  return dbQuery({ action: 'insert', table: 'mgh_properties_final', data });
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function listContacts(params = {}) {
  return dbQuery({ action: 'list', table: 'mgh_contacts', params });
}

export async function getContact(propertyId) {
  const result = await dbQuery({
    action: 'list',
    table: 'mgh_contacts',
    params: { filters: { property_id: `eq.${propertyId}` } }
  });
  return result.data?.[0] || null;
}

export async function updateContact(propertyId, data) {
  return dbQuery({ action: 'update', table: 'mgh_contacts', id: propertyId, data, params: { pk_field: 'property_id' } });
}

export async function insertContact(data) {
  return dbQuery({ action: 'insert', table: 'mgh_contacts', data });
}

// ─── Reference Tables ─────────────────────────────────────────────────────────

export async function listRefTable(table, orderField = 'id') {
  return dbQuery({ action: 'list', table, params: { order: `${orderField}.asc` } });
}

export async function listCities() {
  return listRefTable('mgh_cities', 'id');
}

export async function listPropertyTypes() {
  return listRefTable('mgh_property_types', 'id');
}

export async function listNeighborhoods(cityId = null) {
  const params = { order: 'id.asc' };
  if (cityId) params.filters = { city_id: `eq.${cityId}` };
  return dbQuery({ action: 'list', table: 'mgh_neighborhoods', params });
}

export async function listAmenities() {
  return dbQuery({ action: 'list', table: 'mgh_amenities_catalog', params: { order: 'id.asc' } });
}

export async function listServices() {
  return dbQuery({ action: 'list', table: 'mgh_services_catalog', params: { order: 'id.asc' } });
}

export async function listBookingConditions() {
  return dbQuery({ action: 'list', table: 'mgh_booking_conditions_catalog', params: { order: 'id.asc' } });
}

export async function testConnection() {
  return dbQuery({ action: 'test_connection', table: 'mgh_properties_final' });
}

// ─── Experiences ──────────────────────────────────────────────────────────────

export async function listExperiences(params = {}) {
  return dbQuery({ action: 'list', table: 'mgh_experiences', params });
}

export async function getExperience(id) {
  const result = await dbQuery({ action: 'get', table: 'mgh_experiences', id });
  return result.data?.[0] || null;
}

export async function insertExperience(data) {
  return dbQuery({ action: 'insert', table: 'mgh_experiences', data });
}

export async function updateExperience(id, data) {
  return dbQuery({ action: 'update', table: 'mgh_experiences', id, data });
}

export async function deleteExperience(id) {
  return dbQuery({ action: 'delete', table: 'mgh_experiences', id });
}

// ─── Experience Ordering ──────────────────────────────────────────────────────

export async function getNextExperienceOrder() {
  const response = await api.get('/experiences/next-order');
  return response.data?.data;
}

export async function reorderExperience(id, newPosition) {
  const response = await api.post('/experiences/reorder', { id, new_position: newPosition });
  return response.data;
}

export async function moveExperience(id, direction) {
  const response = await api.post('/experiences/move', { id, direction });
  return response.data;
}

// ─── Experience Image Upload ──────────────────────────────────────────────────

export async function uploadExperienceImage(file, type = 'image') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await api.post('/experiences/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteExperienceImage(filename) {
  const response = await api.delete('/experiences/delete-image', {
    data: { filename },
  });
  return response.data;
}

// ─── Destinations ─────────────────────────────────────────────────────────────

export async function listDestinations(params = {}) {
  return dbQuery({ action: 'list', table: 'mgh_destinations', params });
}

export async function getDestination(id) {
  const result = await dbQuery({ action: 'get', table: 'mgh_destinations', id });
  return result.data?.[0] || null;
}

export async function insertDestination(data) {
  return dbQuery({ action: 'insert', table: 'mgh_destinations', data });
}

export async function updateDestination(id, data) {
  return dbQuery({ action: 'update', table: 'mgh_destinations', id, data });
}

export async function deleteDestination(id) {
  return dbQuery({ action: 'delete', table: 'mgh_destinations', id });
}

// ─── Destination Ordering ─────────────────────────────────────────────────────

export async function getNextDestinationOrder() {
  const response = await api.get('/destinations/next-order');
  return response.data?.data;
}

export async function reorderDestination(id, newPosition) {
  const response = await api.post('/destinations/reorder', { id, new_position: newPosition });
  return response.data;
}

export async function moveDestination(id, direction) {
  const response = await api.post('/destinations/move', { id, direction });
  return response.data;
}

// ─── Destination Image Upload ─────────────────────────────────────────────────

export async function uploadDestinationImage(file, type = 'image') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await api.post('/destinations/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteDestinationImage(filename) {
  const response = await api.delete('/destinations/delete-image', {
    data: { filename },
  });
  return response.data;
}

// ─── Why Book Direct ──────────────────────────────────────────────────────────

export async function listWhyBookDirect(params = {}) {
  return dbQuery({ action: 'list', table: 'why_book_direct', params });
}

// ─── AMH Quartiers ────────────────────────────────────────────────────────────

export async function listQuartiers(params = {}) {
  return dbQuery({ action: 'list', table: 'amh_quartiers', params });
}

export async function getQuartier(id) {
  const result = await dbQuery({ action: 'get', table: 'amh_quartiers', id });
  return result.data?.[0] || null;
}

export async function insertQuartier(data) {
  return dbQuery({ action: 'insert', table: 'amh_quartiers', data });
}

export async function updateQuartier(id, data) {
  return dbQuery({ action: 'update', table: 'amh_quartiers', id, data });
}

export async function deleteQuartier(id) {
  return dbQuery({ action: 'delete', table: 'amh_quartiers', id });
}

// ─── AMH POIs ─────────────────────────────────────────────────────────────────

export async function listPois(params = {}) {
  return dbQuery({ action: 'list', table: 'amh_pois', params });
}

export async function getPoi(id) {
  const result = await dbQuery({ action: 'get', table: 'amh_pois', id });
  return result.data?.[0] || null;
}

export async function insertPoi(data) {
  return dbQuery({ action: 'insert', table: 'amh_pois', data });
}

export async function updatePoi(id, data) {
  return dbQuery({ action: 'update', table: 'amh_pois', id, data });
}

export async function deletePoi(id) {
  return dbQuery({ action: 'delete', table: 'amh_pois', id });
}

// ─── Pending Updates ──────────────────────────────────────────────────────────

export async function listPendingUpdates(params = {}) {
  return dbQuery({ action: 'list', table: 'pending_updates', params });
}

export async function updatePendingUpdate(id, data) {
  return dbQuery({ action: 'update', table: 'pending_updates', id, data });
}
