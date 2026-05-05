import { base44 } from '@/api/base44Client';

export async function supabaseQuery({ action, table, params, data, id }) {
  const response = await base44.functions.invoke('supabaseProxy', {
    action,
    table,
    params,
    data,
    id,
  });
  return response.data;
}

export async function listProperties(params = {}) {
  return supabaseQuery({ action: 'list', table: 'mgh_properties_final', params });
}

export async function getProperty(id) {
  const result = await supabaseQuery({ action: 'get', table: 'mgh_properties_final', id });
  return result.data?.[0] || null;
}

export async function updateProperty(id, data) {
  return supabaseQuery({ action: 'update', table: 'mgh_properties_final', id, data });
}

export async function insertProperty(data) {
  return supabaseQuery({ action: 'insert', table: 'mgh_properties_final', data });
}

export async function listContacts(params = {}) {
  return supabaseQuery({ action: 'list', table: 'mgh_contacts', params });
}

export async function getContact(supabaseId) {
  const result = await supabaseQuery({
    action: 'list',
    table: 'mgh_contacts',
    params: { filters: { supabaseid: `eq.${supabaseId}` } }
  });
  return result.data?.[0] || null;
}

export async function updateContact(supabaseId, data) {
  return supabaseQuery({ action: 'update', table: 'mgh_contacts', id: supabaseId, data, params: { pk_field: 'supabaseid' } });
}

export async function insertContact(data) {
  return supabaseQuery({ action: 'insert', table: 'mgh_contacts', data });
}

export async function listRefTable(table, orderField = 'name') {
  return supabaseQuery({ action: 'list', table, params: { order: `${orderField}.asc` } });
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
  return supabaseQuery({ action: 'list', table: 'mgh_neighborhoods', params });
}

export async function listAmenities() {
  return supabaseQuery({ action: 'list', table: 'mgh_amenities_catalog', params: { order: 'id.asc' } });
}

export async function listServices() {
  return supabaseQuery({ action: 'list', table: 'mgh_services_catalog', params: { order: 'id.asc' } });
}

export async function listBookingConditions() {
  return supabaseQuery({ action: 'list', table: 'mgh_booking_conditions_catalog', params: { order: 'id.asc' } });
}

export async function testConnection() {
  return supabaseQuery({ action: 'test_connection', table: 'mgh_properties_final' });
}