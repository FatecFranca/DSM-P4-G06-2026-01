// src/modules/sensors/sensors.service.test.ts
import { describe, it, expect } from 'vitest';
import { SensorsService } from './sensors.service';

const svc = new SensorsService();

describe('SensorsService.validateReading', () => {
  it('returns null for valid reading', () => {
    expect(svc.validateReading({ temp: 24.5, umid_ar: 62, umid_solo: 38.5, luz: 850 })).toBeNull();
  });

  it('rejects temperature out of physical range', () => {
    expect(svc.validateReading({ temp: 200, umid_ar: 50, umid_solo: 50, luz: 500 })).toMatch(/Temperature/);
    expect(svc.validateReading({ temp: -100, umid_ar: 50, umid_solo: 50, luz: 500 })).toMatch(/Temperature/);
  });

  it('rejects humidity > 100', () => {
    expect(svc.validateReading({ temp: 25, umid_ar: 110, umid_solo: 50, luz: 500 })).toMatch(/Air humidity/);
    expect(svc.validateReading({ temp: 25, umid_ar: 50, umid_solo: 150, luz: 500 })).toMatch(/Soil/);
  });

  it('rejects NaN values', () => {
    expect(svc.validateReading({ temp: NaN, umid_ar: 50, umid_solo: 50, luz: 500 })).toMatch(/NaN/);
  });

  it('rejects LDR out of range', () => {
    expect(svc.validateReading({ temp: 25, umid_ar: 50, umid_solo: 50, luz: 5000 })).toMatch(/LDR/);
  });
});
