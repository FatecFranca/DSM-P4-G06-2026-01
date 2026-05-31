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
    const point = new Point('telemetry').tag('greenhouse_id', greenhouseId);

    if (data.temp      != null) point.floatField('temp',      data.temp);
    if (data.umid_ar   != null) point.floatField('umid_ar',   data.umid_ar);
    if (data.temp_solo != null) point.floatField('temp_solo', data.temp_solo);
    if (data.umid_solo != null) point.floatField('umid_solo', data.umid_solo);
    if (data.luz       != null) point.intField  ('luz',       data.luz);

    point.timestamp(new Date());
    influxWrite.writePoint(point);
    try { await influxWrite.flush(); }
    catch (err) { logger.error('InfluxDB flush error', { err, greenhouseId }); }
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
    return {
      temp:      r.temp      ?? null,
      umid_ar:   r.umid_ar   ?? null,
      temp_solo: r.temp_solo ?? null,
      umid_solo: r.umid_solo ?? null,
      luz:       r.luz       ?? null,
    };
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
  if (data.temp      != null && (data.temp      < 0    || data.temp      > 50))   return 'DHT11: temperatura fora da faixa';
  if (data.umid_ar   != null && (data.umid_ar   < 10   || data.umid_ar   > 100))  return 'DHT11: umidade fora da faixa';
  if (data.temp_solo != null && (data.temp_solo < 0    || data.temp_solo > 100))  return 'LM35DZ: temperatura fora da faixa';
  if (data.umid_solo != null && (data.umid_solo < 0    || data.umid_solo > 100))  return 'P23: umidade fora da faixa';
  if (data.luz       != null && (data.luz       < 0    || data.luz       > 4095)) return 'LDR: valor fora da faixa';

  const todosNulos = data.temp == null && data.temp_solo == null && data.umid_solo == null;
  if (todosNulos) return 'Nenhum sensor retornou dado válido';

  return null;
  }
}
