import { useState, useEffect } from 'react';
import { Greenhouse } from '../types/greenhouse';
import * as greenhouseService from '../services/greenhouseService';
import * as sensorService from '../services/sensorService';
import * as actuatorService from '../services/actuatorService';
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

export const useGreenhouses = (token: string | null) => {
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    addGreenhouse,
    toggleActuator,
    updateGreenhouseLimits,
    deleteGreenhouse,
    refreshSensors,
  };
};
