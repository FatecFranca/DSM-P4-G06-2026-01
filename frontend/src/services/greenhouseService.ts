// src/services/greenhouseService.ts
// Serviço central para chamadas à API de Estufas AgroTech

import apiClient from './apiClient';

export async function getGreenhouses(_token: string) {
  const res = await apiClient.get('/greenhouses');
  return res.data;
}

export async function getGreenhouseById(_token: string, id: string) {
  const res = await apiClient.get(`/greenhouses/${id}`);
  return res.data;
}

export async function createGreenhouse(_token: string, data: any) {
  const res = await apiClient.post('/greenhouses', data);
  return res.data;
}

export async function updateGreenhouseConfig(_token: string, id: string, config: any) {
  const res = await apiClient.patch(`/greenhouses/${id}/config`, config);
  return res.data;
}

export async function deleteGreenhouse(_token: string, id: string) {
  const res = await apiClient.delete(`/greenhouses/${id}`);
  return res.data;
}
