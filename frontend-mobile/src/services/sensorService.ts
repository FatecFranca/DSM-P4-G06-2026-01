import apiClient from './apiClient';
 
export async function getLatestSensorReading(greenhouseId: string) {
  const res = await apiClient.get(`/sensors/${greenhouseId}/latest`);
  return res.data;
}
 
export async function getSensorHistory(
  greenhouseId: string,
  params?: { start?: string; end?: string; window?: string }
) {
  const res = await apiClient.get(`/sensors/${greenhouseId}/history`, { params });
  return res.data;
}
 