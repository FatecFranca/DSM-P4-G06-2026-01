import { useState, useEffect } from 'react';
import { Greenhouse } from '../types';
import * as greenhouseService from '../services/greenhouseService';

export const useGreenhouses = (token: string) => {
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    greenhouseService
      .getGreenhouses(token)
      .then(data => {
        if (mounted) {
          setGreenhouses(data);
          setSelectedGreenhouse(data[0] || null);
          setError(null);
        }
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

  // Add greenhouse (backend)
  const addGreenhouse = async (name: string, sector: string) => {
    if (!token) return;
    const newGh = await greenhouseService.createGreenhouse(token, { name, sector });
    setGreenhouses((prev) => [...prev, newGh]);
    setSelectedGreenhouse(newGh);
    return newGh;
  };

  // Toggle actuator (backend)
  const toggleActuator = async (id: string, actuatorKey: keyof Greenhouse['actuators']) => {
    if (!token) return;
    const updated = await greenhouseService.toggleActuator(token, id, actuatorKey);
    setGreenhouses((prev) => prev.map((gh) => (gh.id === id ? updated : gh)));
    setSelectedGreenhouse((prev) => (prev && prev.id === id ? updated : prev));
    return updated;
  };

  // Update limits (backend)
  const updateGreenhouseLimits = async (id: string, limits: Greenhouse['limits']) => {
    if (!token) return;
    const updated = await greenhouseService.updateLimits(token, id, limits);
    setGreenhouses((prev) => prev.map((gh) => (gh.id === id ? updated : gh)));
    setSelectedGreenhouse((prev) => (prev && prev.id === id ? updated : prev));
    return updated;
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
  };
};
