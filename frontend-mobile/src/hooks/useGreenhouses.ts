import { useState, useEffect } from 'react';
import { Greenhouse } from '../types/greenhouse';
import * as greenhouseService from '../services/greenhouseService';
import * as sensorService from '../services/sensorService';
import * as actuatorService from '../services/actuatorService';
import { RuntimeMetricsSnapshot, subscribeToGreenhouseTelemetry, TelemetryPayload } from '../services/realtimeService';
import { mapGreenhouse } from '../mapper/greenhouseMapper';

const ensureToken = (token: string | null): string => {
  if (!token) throw new Error('Sessao invalida.');
  return token;
};

const buildHistory = (history: sensorService.SensorHistoryRow[]) => {
  const toNumArray = (key: keyof sensorService.SensorReading) =>
    history
      .map((row) => row[key])
      .filter((value): value is number => value != null);

  return {
    temp: toNumArray('temp'),
    temp_solo: toNumArray('temp_solo'),
    umid_ar: toNumArray('umid_ar'),
    umid_solo: toNumArray('umid_solo'),
    luz: toNumArray('luz'),
  };
};

const getStatus = (gh: Pick<Greenhouse, 'heartbeat' | 'sensors' | 'limits'>): Greenhouse['status'] => {
  if (!gh.heartbeat) return 'offline';

  const tempOut = gh.sensors.temp < gh.limits.tempMin || gh.sensors.temp > gh.limits.tempMax;
  const soilOut =
    gh.sensors.umid_solo < gh.limits.umidSoloMin || gh.sensors.umid_solo > gh.limits.umidSoloMax;

  return tempOut || soilOut ? 'warning' : 'healthy';
};

const applyRealtimePayload = (gh: Greenhouse, payload: TelemetryPayload): Greenhouse => {
  const telemetry = payload.latestTelemetry ?? payload;
  const sensors = {
    ...gh.sensors,
    ...payload.sensors,
    ...(typeof telemetry.temp === 'number' && { temp: telemetry.temp }),
    ...(typeof telemetry.temp_solo === 'number' && { temp_solo: telemetry.temp_solo }),
    ...(typeof telemetry.umid_ar === 'number' && { umid_ar: telemetry.umid_ar }),
    ...(typeof telemetry.umid_solo === 'number' && { umid_solo: telemetry.umid_solo }),
    ...(typeof telemetry.luz === 'number' && { luz: telemetry.luz }),
  };

  const next: Greenhouse = {
    ...gh,
    sensors,
    history: {
      temp: typeof sensors.temp === 'number' ? [...gh.history.temp.slice(-47), sensors.temp] : gh.history.temp,
      temp_solo:
        typeof sensors.temp_solo === 'number'
          ? [...gh.history.temp_solo.slice(-47), sensors.temp_solo]
          : gh.history.temp_solo,
      umid_ar:
        typeof sensors.umid_ar === 'number' ? [...gh.history.umid_ar.slice(-47), sensors.umid_ar] : gh.history.umid_ar,
      umid_solo:
        typeof sensors.umid_solo === 'number'
          ? [...gh.history.umid_solo.slice(-47), sensors.umid_solo]
          : gh.history.umid_solo,
      luz: typeof sensors.luz === 'number' ? [...gh.history.luz.slice(-47), sensors.luz] : gh.history.luz,
    },
    heartbeat: true,
    lastSeen: payload.latestTelemetry?.timestamp ?? payload.timestamp ?? new Date().toLocaleTimeString(),
  };

  return {
    ...next,
    status: getStatus(next),
  };
};

export const useGreenhouses = (token: string | null) => {
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'unavailable'>('disconnected');
  const [runtimeMetrics, setRuntimeMetrics] = useState<RuntimeMetricsSnapshot | null>(null);
  const greenhouseIds = greenhouses.map((gh) => gh.id).join('|');

  useEffect(() => {
    let mounted = true;

    if (!token) {
      setGreenhouses([]);
      setSelectedGreenhouse(null);
      setLoading(false);
      setError(null);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);

    greenhouseService
      .getGreenhouses(token)
      .then(async (data) => {
        const base = data.map(mapGreenhouse);

        const enriched = await Promise.all(
          base.map(async (gh) => {
            try {
              const [latest, history] = await Promise.all([
                sensorService.getLatestSensorReading(token, gh.id),
                sensorService.getSensorHistory(token, gh.id),
              ]);

              return {
                ...gh,
                sensors: {
                  temp: latest.temp ?? gh.sensors.temp,
                  temp_solo: latest.temp_solo ?? gh.sensors.temp_solo,
                  umid_ar: latest.umid_ar ?? gh.sensors.umid_ar,
                  umid_solo: latest.umid_solo ?? gh.sensors.umid_solo,
                  luz: latest.luz ?? gh.sensors.luz,
                },
                history: buildHistory(history),
              };
            } catch {
              return gh;
            }
          })
        );

        if (!mounted) return;
        setGreenhouses(enriched);
        setSelectedGreenhouse(prev => {
          if (!prev) return enriched[0] ?? null;
          return enriched.find(gh => gh.id === prev.id) ?? enriched[0] ?? null;
        });
        setError(null);
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
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let unsubscribe: (() => void) | undefined;
    let active = true;
    const ids = greenhouseIds.split('|').filter(Boolean);

    if (ids.length === 0) {
      setRealtimeStatus('disconnected');
      return () => {
        active = false;
      };
    }

    try {
      unsubscribe = subscribeToGreenhouseTelemetry(
        token,
        ids,
        (payload) => {
          const greenhouseId = payload.greenhouseId ?? payload.id;
          if (!greenhouseId) return;

          setGreenhouses(prev => prev.map(gh => gh.id === greenhouseId ? applyRealtimePayload(gh, payload) : gh));
          setSelectedGreenhouse(prev => prev?.id === greenhouseId ? applyRealtimePayload(prev, payload) : prev);
        },
        setRuntimeMetrics,
        (status) => {
          if (active) setRealtimeStatus(status);
        }
      );
    } catch {
      if (active) setRealtimeStatus('unavailable');
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [greenhouseIds, token]);

  const refreshSensors = async (id: string) => {
    const validToken = ensureToken(token);

    try {
      const [latest, history] = await Promise.all([
        sensorService.getLatestSensorReading(validToken, id),
        sensorService.getSensorHistory(validToken, id),
      ]);

      const patch = (gh: Greenhouse): Greenhouse => ({
        ...gh,
        sensors: {
          temp: latest.temp ?? gh.sensors.temp,
          temp_solo: latest.temp_solo ?? gh.sensors.temp_solo,
          umid_ar: latest.umid_ar ?? gh.sensors.umid_ar,
          umid_solo: latest.umid_solo ?? gh.sensors.umid_solo,
          luz: latest.luz ?? gh.sensors.luz,
        },
        history: buildHistory(history),
      });

      setGreenhouses(prev => prev.map(gh => gh.id === id ? patch(gh) : gh));
      setSelectedGreenhouse(prev => prev?.id === id ? patch(prev) : prev);
    } catch {
      // Mantem dados anteriores se uma leitura pontual falhar.
    }
  };

  const addGreenhouse = async (name: string, sector: string) => {
    const validToken = ensureToken(token);
    const raw = await greenhouseService.createGreenhouse(validToken, { name, sector });
    const newGh = mapGreenhouse(raw);

    setGreenhouses(prev => [...prev, newGh]);
    setSelectedGreenhouse(newGh);
    refreshSensors(newGh.id);

    return newGh;
  };

  const toggleActuator = async (id: string, actuatorKey: keyof Greenhouse['actuators']) => {
    const validToken = ensureToken(token);
    let nextState = false;

    const optimistic = (gh: Greenhouse): Greenhouse => ({
      ...gh,
      actuators: { ...gh.actuators, [actuatorKey]: !gh.actuators[actuatorKey] },
    });

    setGreenhouses(prev => prev.map(gh => {
      if (gh.id !== id) return gh;
      nextState = !gh.actuators[actuatorKey];
      return optimistic(gh);
    }));
    setSelectedGreenhouse(prev => prev?.id === id ? optimistic(prev) : prev);

    try {
      await actuatorService.sendManualCommand(validToken, id, actuatorKey, nextState);
    } catch (err) {
      setGreenhouses(prev => prev.map(gh => gh.id === id ? optimistic(gh) : gh));
      setSelectedGreenhouse(prev => prev?.id === id ? optimistic(prev) : prev);
      throw err;
    }
  };

  const updateGreenhouseLimits = async (id: string, limits: Greenhouse['limits']) => {
    const validToken = ensureToken(token);
    const raw = await greenhouseService.updateGreenhouseConfig(validToken, id, limits);
    const updated = mapGreenhouse(raw);

    setGreenhouses(prev => prev.map(gh => {
      if (gh.id !== id) return gh;
      return { ...updated, sensors: gh.sensors, history: gh.history };
    }));

    setSelectedGreenhouse(prev => {
      if (prev?.id !== id) return prev;
      return { ...updated, sensors: prev.sensors, history: prev.history };
    });

    return updated;
  };

  const deleteGreenhouse = async (id: string) => {
    const validToken = ensureToken(token);
    await greenhouseService.deleteGreenhouse(validToken, id);
    setGreenhouses(prev => prev.filter(gh => gh.id !== id));
    setSelectedGreenhouse(prev => prev?.id === id ? null : prev);
  };

  return {
    greenhouses,
    setGreenhouses,
    selectedGreenhouse,
    setSelectedGreenhouse,
    loading,
    error,
    realtimeStatus,
    runtimeMetrics,
    addGreenhouse,
    toggleActuator,
    updateGreenhouseLimits,
    deleteGreenhouse,
    refreshSensors,
  };
};
