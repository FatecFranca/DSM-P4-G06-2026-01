import apiClient from './apiClient';
 
export async function getGreenhouses() {
  const res = await apiClient.get('/greenhouses');
  return res.data;
}
 
export async function getGreenhouseById(id: string) {
  const res = await apiClient.get(`/greenhouses/${id}`);
  return res.data;
}
 
export async function createGreenhouse(data: { name: string; sector: string }) {
  const res = await apiClient.post('/greenhouses', data);
  return res.data;
}
 
export async function toggleActuator(id: string, actuatorKey: string) {
  const res = await apiClient.patch(`/greenhouses/${id}/toggle`, { actuator: actuatorKey });
  return res.data;
}
 
export async function updateLimits(id: string, limits: any) {
  const res = await apiClient.patch(`/greenhouses/${id}/limits`, limits);
  return res.data;
}
 
export async function deleteGreenhouse(id: string) {
  const res = await apiClient.delete(`/greenhouses/${id}`);
  return res.data;
}