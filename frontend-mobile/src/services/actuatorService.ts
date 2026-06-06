import apiClient from './apiClient';
 
export async function getActuators(id: string) {
  const res = await apiClient.get(`/actuators/${id}`);
  return res.data;
}
 
export async function sendManualCommand(
  greenhouseId: string,
  name: string,
  state: boolean,
  timeoutSecs?: number
) {
  const body: any = { state };
  if (timeoutSecs) body.timeoutSecs = timeoutSecs;
  const res = await apiClient.post(`/actuators/${greenhouseId}/${name}/command`, body);
  return res.data;
}
 
export async function getActuatorLogs(id: string, actuatorId: string) {
  const res = await apiClient.get(`/actuators/${id}/${actuatorId}/logs`);
  return res.data;
}