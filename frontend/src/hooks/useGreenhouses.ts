import { useState, useCallback, useEffect } from 'react';
import { Greenhouse } from '../types';
import * as actuatorService from '../services/actuatorService';
import * as greenhouseService from '../services/greenhouseService';
import { RuntimeMetricsSnapshot, subscribeToGreenhouseTelemetry, TelemetryPayload } from '../services/realtimeService';
import * as sensorService from '../services/sensorService';

interface UseGreenhousesOptions {
  token: string;
}

interface BackendGreenhouse {
  id: string;
  name: string;
  description?: string | null;
  updatedAt?: string;
  config?: {
    tempMin?: number;
    tempMax?: number;
    humidSoilMin?: number;
    humidSoilMax?: number;
  } | null;
  actuators?: Array<{
    name: keyof Greenhouse['actuators'];
    state: boolean;
  }>;
}

const getStatus = (gh: Pick<Greenhouse, 'heartbeat' | 'sensors' | 'limits'>): Greenhouse['status'] => {
  if (!gh.heartbeat) return 'offline';

  const tempOut = gh.sensors.temp < gh.limits.tempMin || gh.sensors.temp > gh.limits.tempMax;
  const soilOut =
    gh.sensors.umid_solo < gh.limits.umidSoloMin || gh.sensors.umid_solo > gh.limits.umidSoloMax;

  return tempOut || soilOut ? 'warning' : 'healthy';
};

const toGreenhouse = async (token: string, gh: BackendGreenhouse): Promise<Greenhouse> => {
  let latest: sensorService.SensorReading | null = null;
  let historyRows: sensorService.SensorHistoryRow[] = [];

  try {
    latest = await sensorService.getLatestSensorReading(token, gh.id);
  } catch {
    latest = null;
  }

  try {
    historyRows = await sensorService.getSensorHistory(token, gh.id, {
      start: '-12h',
      window: '30m'
    });
  } catch {
    historyRows = [];
  }

  const limits: Greenhouse['limits'] = {
    tempMin: gh.config?.tempMin ?? 0,
    tempMax: gh.config?.tempMax ?? 0,
    umidSoloMin: gh.config?.humidSoilMin ?? 0,
    umidSoloMax: gh.config?.humidSoilMax ?? 0,
    luzMin: 0,
    luzMax: 4095
  };

  const sensors: Greenhouse['sensors'] = {
    temp: latest?.temp ?? 0,
    temp_solo: latest?.temp_solo ?? 0,
    umid_ar: latest?.umid_ar ?? 0,
    umid_solo: latest?.umid_solo ?? 0,
    luz: latest?.luz ?? 0
  };

  const actuators = (gh.actuators ?? []).reduce<Greenhouse['actuators']>(
    (acc, actuator) => ({ ...acc, [actuator.name]: actuator.state }),
    { lampada: false, exaustor: false, bomba: false }
  );

  const history: Greenhouse['history'] = {
    temp: historyRows.flatMap((row) => (typeof row.temp === 'number' ? [row.temp] : [])),
    umid_ar: historyRows.flatMap((row) => (typeof row.umid_ar === 'number' ? [row.umid_ar] : [])),
    umid_solo: historyRows.flatMap((row) =>
      typeof row.umid_solo === 'number' ? [row.umid_solo] : []
    ),
    temp_solo: historyRows.flatMap((row) =>
      typeof row.temp_solo === 'number' ? [row.temp_solo] : []
    ),
    luz: historyRows.flatMap((row) => (typeof row.luz === 'number' ? [row.luz] : []))
  };

  const mapped: Greenhouse = {
    id: gh.id,
    name: gh.name,
    sector: gh.description ?? 'Sem descricao',
    status: 'offline',
    sensors,
    limits,
    actuators,
    history,
    heartbeat: latest !== null,
    lastSeen: latest ? 'Ultima leitura recebida' : 'Sem leitura recente'
  };

  return {
    ...mapped,
    status: getStatus(mapped)
  };
};

export const useGreenhouses = ({ token }: UseGreenhousesOptions) => {
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'unavailable'>('disconnected');
  const [runtimeMetrics, setRuntimeMetrics] = useState<RuntimeMetricsSnapshot | null>(null);
  const greenhouseIds = greenhouses.map((gh) => gh.id).join('|');

  const refreshGreenhouses = useCallback(async () => {
    if (!token) {
      setGreenhouses([]);
      return;
    }

    const data: BackendGreenhouse[] = await greenhouseService.getGreenhouses(token);
    setGreenhouses(await Promise.all(data.map((gh) => toGreenhouse(token, gh))));
  }, [token]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    refreshGreenhouses()
      .then(() => {
        if (mounted) setError(null);
      })
      .catch(() => {
        if (mounted) setError('Erro ao buscar estufas');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [refreshGreenhouses]);

  useEffect(() => {
    if (!token) return;

    let unsubscribe: (() => void) | undefined;
    let active = true;

    const applyTelemetry = (payload: TelemetryPayload) => {
      const greenhouseId = payload.greenhouseId ?? payload.id;
      if (!greenhouseId) return;
      const telemetry = payload.latestTelemetry ?? payload;
      const lastSeen =
        payload.latestTelemetry?.timestamp ?? payload.timestamp ?? new Date().toLocaleTimeString();

      setGreenhouses((prev) =>
        prev.map((item) => {
          if (item.id !== greenhouseId) return item;

          const sensors = {
            ...item.sensors,
            ...payload.sensors,
            ...(typeof telemetry.temp === 'number' && { temp: telemetry.temp }),
            ...(typeof telemetry.temp_solo === 'number' && { temp_solo: telemetry.temp_solo }),
            ...(typeof telemetry.umid_ar === 'number' && { umid_ar: telemetry.umid_ar }),
            ...(typeof telemetry.umid_solo === 'number' && { umid_solo: telemetry.umid_solo }),
            ...(typeof telemetry.luz === 'number' && { luz: telemetry.luz })
          };

          const next: Greenhouse = {
            ...item,
            id: item.id,
            sensors,
            history: {
              temp: typeof sensors.temp === 'number' ? [...item.history.temp.slice(-47), sensors.temp] : item.history.temp,
              temp_solo:
                typeof sensors.temp_solo === 'number'
                  ? [...item.history.temp_solo.slice(-47), sensors.temp_solo]
                  : item.history.temp_solo,
              umid_ar:
                typeof sensors.umid_ar === 'number'
                  ? [...item.history.umid_ar.slice(-47), sensors.umid_ar]
                  : item.history.umid_ar,
              umid_solo:
                typeof sensors.umid_solo === 'number'
                  ? [...item.history.umid_solo.slice(-47), sensors.umid_solo]
                  : item.history.umid_solo,
              luz: typeof sensors.luz === 'number' ? [...item.history.luz.slice(-47), sensors.luz] : item.history.luz
            },
            heartbeat: true,
            lastSeen
          };

          return {
            ...next,
            status: getStatus(next)
          };
        })
      );
    };

    const ids = greenhouseIds.split('|').filter(Boolean);
    subscribeToGreenhouseTelemetry(
      token,
      ids,
      applyTelemetry,
      setRuntimeMetrics,
      (status) => {
        if (active) setRealtimeStatus(status);
      }
    )
      .then((cleanup) => {
        unsubscribe = cleanup;
      })
      .catch(() => {
        if (active) setRealtimeStatus('unavailable');
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [greenhouseIds, token]);

  const addGreenhouse = useCallback(
    async (newGh: { name: string; description?: string }) => {
      if (!token) {
        setError('Faça login para adicionar estufas');
        return;
      }

      try {
        setLoading(true);
        await greenhouseService.createGreenhouse(token, newGh);
        await refreshGreenhouses();
        setError(null);
      } catch {
        setError('Erro ao adicionar estufa');
      } finally {
        setLoading(false);
      }
    },
    [refreshGreenhouses, token]
  );

  const toggleActuator = useCallback(
    async (greenhouseId: string, actuatorKey: keyof Greenhouse['actuators']) => {
      if (!token) return;

      const gh = greenhouses.find((item) => item.id === greenhouseId);
      if (!gh) return;

      const nextState = !gh.actuators[actuatorKey];
      await actuatorService.sendManualCommand(token, greenhouseId, actuatorKey, nextState);

      setGreenhouses((prev) =>
        prev.map((item) =>
          item.id === greenhouseId
            ? {
                ...item,
                actuators: {
                  ...item.actuators,
                  [actuatorKey]: nextState
                }
              }
            : item
        )
      );
    },
    [greenhouses, token]
  );

  const updateLimits = useCallback(
    async (greenhouseId: string, newLimits: Partial<Greenhouse['limits']>) => {
      if (!token) return;

      await greenhouseService.updateGreenhouseConfig(token, greenhouseId, {
        ...(newLimits.tempMin !== undefined && { t_min: newLimits.tempMin }),
        ...(newLimits.tempMax !== undefined && { t_max: newLimits.tempMax }),
        ...(newLimits.umidSoloMin !== undefined && { u_solo_min: newLimits.umidSoloMin }),
        ...(newLimits.umidSoloMax !== undefined && { u_solo_max: newLimits.umidSoloMax })
      });

      setGreenhouses((prev) =>
        prev.map((item) => {
          if (item.id !== greenhouseId) return item;

          const limits = {
            ...item.limits,
            ...newLimits
          };

          return {
            ...item,
            limits,
            status: getStatus({ ...item, limits })
          };
        })
      );
    },
    [token]
  );

  return {
    greenhouses,
    toggleActuator,
    updateLimits,
    addGreenhouse,
    loading,
    error,
    realtimeStatus,
    runtimeMetrics,
    setGreenhouses
  };
};
