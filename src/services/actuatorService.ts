// Serviço para chamadas à API de Atuadores AgroTech (mobile)
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function getActuators(token: string, id: string) {
  const res = await axios.get(`${API_BASE}/actuators/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function sendManualCommand(token: string, greenhouseId: string, name: string, state: boolean, timeoutSecs?: number) {
  const body: any = { state };
  if (timeoutSecs) body.timeoutSecs = timeoutSecs;
  const res = await axios.post(`${API_BASE}/actuators/${greenhouseId}/${name}/command`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getActuatorLogs(token: string, id: string, actuatorId: string) {
  const res = await axios.get(`${API_BASE}/actuators/${id}/${actuatorId}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
