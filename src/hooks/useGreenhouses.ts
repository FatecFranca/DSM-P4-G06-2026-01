import { useState, useCallback } from 'react';
import { Greenhouse } from '../types';

export const useGreenhouses = (initialData: Greenhouse[]) => {
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>(initialData);

  const toggleActuator = useCallback((ghId: string, actuatorKey: keyof Greenhouse['actuators']) => {
    setGreenhouses(prev =>
      prev.map(gh => {
        if (gh.id === ghId) {
          const nextVal = !gh.actuators[actuatorKey];
          return {
            ...gh,
            actuators: { ...gh.actuators, [actuatorKey]: nextVal }
          };
        }
        return gh;
      })
    );
  }, []);

  const updateLimits = useCallback((ghId: string, newLimits: Partial<Greenhouse['limits']>) => {
    setGreenhouses(prev =>
      prev.map(gh => {
        if (gh.id === ghId) {
          return {
            ...gh,
            limits: { ...gh.limits, ...newLimits }
          };
        }
        return gh;
      })
    );
  }, []);

  const addGreenhouse = useCallback((newGh: Greenhouse) => {
    setGreenhouses(prev => [...prev, newGh]);
  }, []);

  return { greenhouses, toggleActuator, updateLimits, addGreenhouse, setGreenhouses };
};
