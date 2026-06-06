import { Greenhouse } from '../types/greenhouse';

function mapGreenhouse(apiData: any): Greenhouse {
  return {
    id: apiData.id,
    name: apiData.name,
    sector: apiData.description ?? '',

    status: apiData.active ? 'healthy' : 'offline',

    phase: 'Produção',

    sensors: {
      temp: 0,
      temp_solo: 0,
      umid_ar: 0,
      umid_solo: 0,
      luz: 0,
    },

    limits: {
      tempMin: apiData.config?.tempMin ?? 0,
      tempMax: apiData.config?.tempMax ?? 0,
      umidSoloMin: apiData.config?.humidSoilMin ?? 0,
      umidSoloMax: apiData.config?.humidSoilMax ?? 0,
      luzMin: 0,
      luzMax: 0,
    },

    actuators: {
      lampada:
        apiData.actuators?.find((a: any) => a.name === 'lampada')?.state ?? false,

      exaustor:
        apiData.actuators?.find((a: any) => a.name === 'exaustor')?.state ?? false,

      bomba:
        apiData.actuators?.find((a: any) => a.name === 'bomba')?.state ?? false,
    },

    history: {
      temp: [],
      umid_ar: [],
      umid_solo: [],
    },

    heartbeat: apiData.active,

    lastSeen: apiData.updatedAt,
  };
}

export { mapGreenhouse };