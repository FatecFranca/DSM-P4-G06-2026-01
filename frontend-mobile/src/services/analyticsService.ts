import apiClient from './apiClient';
 
export async function getKpis(id: string) {
  const res = await apiClient.get(`/analytics/${id}/kpis`);
  return res.data;
}
 
export async function getTemperature(id: string) {
  const res = await apiClient.get(`/analytics/${id}/temperature`);
  return res.data;
}
 
export async function getSoilMoisture(id: string) {
  const res = await apiClient.get(`/analytics/${id}/soil-moisture`);
  return res.data;
}