import apiClient from './apiClient';
import { Greenhouse } from '../types/greenhouse';

type ApiListResponse<T> = T[] | { data?: T[] };
type ApiItemResponse<T> = T | { data?: T };

const unwrapList = <T>(payload: ApiListResponse<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
};

const unwrapItem = <T>(payload: ApiItemResponse<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
};

export async function getGreenhouses(_token: string) {
  const res = await apiClient.get('/greenhouses');
  return unwrapList<unknown>(res.data);
}

export async function getGreenhouseById(_token: string, id: string) {
  const res = await apiClient.get(`/greenhouses/${id}`);
  return unwrapItem<unknown>(res.data);
}

export async function createGreenhouse(_token: string, data: Pick<Greenhouse, 'name' | 'sector'>) {
  const res = await apiClient.post('/greenhouses', data);
  return unwrapItem<unknown>(res.data);
}

export async function updateGreenhouseConfig(_token: string, id: string, config: Partial<Greenhouse['limits']>) {
  const res = await apiClient.patch(`/greenhouses/${id}/config`, config);
  return unwrapItem<unknown>(res.data);
}

export async function deleteGreenhouse(_token: string, id: string) {
  const res = await apiClient.delete(`/greenhouses/${id}`);
  return res.data;
}
