import apiClient from './apiClient';
 
export async function getAlerts(params?: { greenhouse?: string; status?: string }) {
  const res = await apiClient.get('/alerts', { params });
  return res.data;
}
 
export async function createAlert(data: any) {
  const res = await apiClient.post('/alerts', data);
  return res.data;
}
 
export async function acknowledgeAlert(id: string) {
  const res = await apiClient.patch(`/alerts/${id}/acknowledge`);
  return res.data;
}
 
export async function resolveAlert(id: string) {
  const res = await apiClient.patch(`/alerts/${id}/resolve`);
  return res.data;
}