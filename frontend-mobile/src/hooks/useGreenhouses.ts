import { useState, useEffect } from 'react';
import { Greenhouse } from '../types/greenhouse';
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
      .getGreenhouses()
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
    return () => { mounted = false; };
  }, [token]);

  const addGreenhouse = async (name: string, sector: string) => {
    const newGh = await greenhouseService.createGreenhouse({ name, sector });
    setGreenhouses(prev => [...prev, newGh]);
    setSelectedGreenhouse(newGh);
    return newGh;
  };

  const toggleActuator = async (id: string, actuatorKey: keyof Greenhouse['actuators']) => {
    const updated = await greenhouseService.toggleActuator(id, actuatorKey);
    setGreenhouses(prev => prev.map(gh => gh.id === id ? updated : gh));
    setSelectedGreenhouse(prev => prev?.id === id ? updated : prev);
    return updated;
  };

  const updateGreenhouseLimits = async (id: string, limits: Greenhouse['limits']) => {
    const updated = await greenhouseService.updateLimits(id, limits);
    setGreenhouses(prev => prev.map(gh => gh.id === id ? updated : gh));
    setSelectedGreenhouse(prev => prev?.id === id ? updated : prev);
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