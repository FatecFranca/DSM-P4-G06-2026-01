import { useState, useEffect } from 'react';
import { Greenhouse } from '../types';
import { INITIAL_GREENHOUSES } from '../utils/constants';

export const useGreenhouses = () => {
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>(INITIAL_GREENHOUSES);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse>(INITIAL_GREENHOUSES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreenhouses((prevGHs) => {
        const updated = prevGHs.map((gh) => {
          if (!gh.heartbeat) return gh;

          const nextSensors = { ...gh.sensors };
          const nextActuators = { ...gh.actuators };

          if (nextActuators.lampada) {
            nextSensors.temp += Math.random() * 0.1;
            nextSensors.luz = Math.min(800, nextSensors.luz + Math.round(Math.random() * 6));
          } else {
            nextSensors.temp -= Math.random() * 0.08;
            nextSensors.luz = Math.max(20, nextSensors.luz - Math.round(Math.random() * 8));
          }

          if (nextActuators.exaustor) {
            nextSensors.temp -= Math.random() * 0.12;
            nextSensors.umid_ar = Math.max(30, nextSensors.umid_ar - Math.random() * 0.3);
          } else {
            nextSensors.temp += Math.random() * 0.04;
            nextSensors.umid_ar = Math.min(80, nextSensors.umid_ar + Math.random() * 0.1);
          }

          if (nextActuators.bomba) {
            nextSensors.umid_solo = Math.min(95, nextSensors.umid_solo + Math.random() * 2.2);
            if (nextSensors.umid_solo >= 75) {
              nextActuators.bomba = false;
            }
          } else {
            nextSensors.umid_solo = Math.max(15, nextSensors.umid_solo - Math.random() * 0.05);
          }

          nextSensors.temp = parseFloat(Math.max(10, Math.min(45, nextSensors.temp)).toFixed(1));
          nextSensors.umid_ar = parseFloat(Math.max(10, Math.min(100, nextSensors.umid_ar)).toFixed(1));
          nextSensors.umid_solo = parseFloat(Math.max(5, Math.min(100, nextSensors.umid_solo)).toFixed(1));

          let status: 'healthy' | 'warning' | 'offline' = 'healthy';
          if (
            nextSensors.temp < gh.limits.tempMin ||
            nextSensors.temp > gh.limits.tempMax ||
            nextSensors.umid_solo < gh.limits.umidSoloMin ||
            nextSensors.umid_solo > gh.limits.umidSoloMax
          ) {
            status = 'warning';
          }

          return {
            ...gh,
            sensors: nextSensors,
            actuators: nextActuators,
            status,
          };
        });

        const updatedSelected = updated.find((g) => g.id === selectedGreenhouse.id);
        if (updatedSelected) {
          setSelectedGreenhouse(updatedSelected);
        }

        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedGreenhouse.id]);

  const toggleActuator = (ghId: string, actuatorKey: keyof Greenhouse['actuators']) => {
    setGreenhouses((prev) =>
      prev.map((gh) => {
        if (gh.id === ghId) {
          const nextVal = !gh.actuators[actuatorKey];
          const updatedActuators = { ...gh.actuators, [actuatorKey]: nextVal };
          return { ...gh, actuators: updatedActuators };
        }
        return gh;
      })
    );
  };

  const addGreenhouse = (name: string, sector: string) => {
    const newGh: Greenhouse = {
      id: `gh-${Date.now()}`,
      name,
      sector,
      status: 'healthy',
      phase: 'Vegetativo',
      sensors: {
        temp: 24.0,
        umid_ar: 60.0,
        umid_solo: 55.0,
        luz: 300,
      },
      limits: {
        tempMin: 18,
        tempMax: 28,
        umidSoloMin: 45,
        umidSoloMax: 85,
        luzMin: 150,
        luzMax: 700,
      },
      actuators: {
        lampada: false,
        exaustor: false,
        bomba: false,
      },
      history: {
        temp: [22, 23, 24, 24, 24, 24, 24, 24.0],
        umid_ar: [55, 58, 60, 60, 60, 60, 60, 60.0],
        umid_solo: [50, 52, 55, 55, 55, 55, 55, 55.0],
      },
      heartbeat: true,
      lastSeen: 'Online',
    };

    setGreenhouses((prev) => [...prev, newGh]);
    return newGh;
  };

  const updateGreenhouseLimits = (ghId: string, limits: Greenhouse['limits']) => {
    setGreenhouses((prev) =>
      prev.map((gh) => {
        if (gh.id === ghId) {
          return { ...gh, limits };
        }
        return gh;
      })
    );

    if (selectedGreenhouse.id === ghId) {
      setSelectedGreenhouse((prev) => ({ ...prev, limits }));
    }
  };

  return {
    greenhouses,
    selectedGreenhouse,
    setSelectedGreenhouse,
    toggleActuator,
    addGreenhouse,
    updateGreenhouseLimits,
  };
};
