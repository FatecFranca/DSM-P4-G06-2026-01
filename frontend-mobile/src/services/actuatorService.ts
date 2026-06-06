
import apiClient from './apiClient';

export async function getActuators(_token: string, id: string) {
  const res = await apiClient.get(`/actuators/${id}`);
  return res.data;
}

export async function sendManualCommand(_token: string, greenhouseId: string, name: string, state: boolean, timeoutSecs?: number) {
  const body: any = { state };
  if (timeoutSecs) body.timeoutSecs = timeoutSecs;
  const res = await apiClient.post(`/actuators/${greenhouseId}/${name}/command`, body);
  return res.data;
}

export async function getActuatorLogs(_token: string, id: string, actuatorId: string) {
  const res = await apiClient.get(`/actuators/${id}/${actuatorId}/logs`);
  return res.data;
}