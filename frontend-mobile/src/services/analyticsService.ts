import apiClient from './apiClient';

export async function getKpis(_token: string, id: string) {
  const res = await apiClient.get(`/analytics/${id}/kpis`);
  return res.data;
}

export async function getTemperature(_token: string, id: string) {
  const res = await apiClient.get(`/analytics/${id}/temperature`);
  return res.data;
}

export async function getSoilTemperature(_token: string, id: string) {
  const res = await apiClient.get(`/analytics/${id}/soil-temperature`);
  return res.data;
}

export async function getSoilMoisture(_token: string, id: string) {
  const res = await apiClient.get(`/analytics/${id}/soil-moisture`);
  return res.data;
}