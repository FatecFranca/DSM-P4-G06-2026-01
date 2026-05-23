// src/modules/sensors/sensors.service.ts
import { Point } from '@influxdata/influxdb-client';
import { influxWrite, influxQuery } from '../../config/database';
import { SensorPayload } from '../../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class SensorsService {
  /**
   * Persist sensor reading to InfluxDB (RN07, RN08)
   */
  async writeTelemetry(greenhouseId: string, data: SensorPayload): Promise<void> {
    const point = new Point('telemetry')
      .tag('greenhouse_id', greenhouseId)
      .floatField('temp', data.temp)
      .floatField('umid_ar', data.umid_ar)
      .floatField('umid_solo', data.umid_solo)
      .intField('luz', data.luz)
      .timestamp(new Date());

    influxWrite.writePoint(point);

    try {
      await influxWrite.flush();
    } catch (err) {
      logger.error('InfluxDB flush error', { err, greenhouseId });
    }
  }

  /**
   * Get latest reading for a greenhouse (most recent point)
   */
  async getLatest(greenhouseId: string): Promise<SensorPayload | null> {
    const query = `
      from(bucket: "${env.INFLUX_BUCKET}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "telemetry" and r.greenhouse_id == "${greenhouseId}")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const rows: Record<string, number>[] = [];
    await influxQuery.collectRows(query, (row, tableMeta) => {
      rows.push(tableMeta.toObject(row) as Record<string, number>);
    });

    if (!rows.length) return null;
    const r = rows[0];
    return { temp: r.temp, umid_ar: r.umid_ar, umid_solo: r.umid_solo, luz: r.luz };
  }

  /**
   * Historical time-series data with flexible window (RN09: raw 30d, aggregated after)
   */
  async getHistory(greenhouseId: string, start: string, end: string, window: string) {
    const query = `
      from(bucket: "${env.INFLUX_BUCKET}")
        |> range(start: ${start}, stop: ${end})
        |> filter(fn: (r) => r._measurement == "telemetry" and r.greenhouse_id == "${greenhouseId}")
        |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"])
    `;

    const rows: unknown[] = [];
    await influxQuery.collectRows(query, (row, tableMeta) => {
      rows.push(tableMeta.toObject(row));
    });

    return rows;
  }

  /**
   * Downsampling job for data >30 days: aggregate to hourly means (RN09)
   * Should be called by a cron job, not on request.
   */
  async downsampleOldData(greenhouseId: string): Promise<void> {
    const query = `
      from(bucket: "${env.INFLUX_BUCKET}")
        |> range(start: -60d, stop: -30d)
        |> filter(fn: (r) => r._measurement == "telemetry" and r.greenhouse_id == "${greenhouseId}")
        |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
        |> to(bucket: "${env.INFLUX_BUCKET}_aggregated", org: "${env.INFLUX_ORG}")
    `;

    await influxQuery.collectRows(query, () => {});
    logger.info('Downsampling complete', { greenhouseId });
  }

  /**
   * Validate sensor reading for hardware failures (RN12)
   * Returns null if valid, error string if invalid
   */
  validateReading(data: SensorPayload): string | null {
    if (data.temp < -40 || data.temp > 85) return 'Temperature out of physical range';
    if (data.umid_ar < 0 || data.umid_ar > 100) return 'Air humidity out of range';
    if (data.umid_solo < 0 || data.umid_solo > 100) return 'Soil humidity out of range';
    if (data.luz < 0 || data.luz > 4095) return 'LDR value out of range';
    if (isNaN(data.temp) || isNaN(data.umid_ar) || isNaN(data.umid_solo)) return 'NaN sensor value';
    return null;
  }
}
