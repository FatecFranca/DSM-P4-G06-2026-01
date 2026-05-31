// src/modules/analytics/analytics.service.ts
import { influxQuery } from '../../config/database';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

export class AnalyticsService {
  /**
   * KPIs for a greenhouse in a given time range
   */
  async getKpis(greenhouseId: string, start = '-7d') {
    const fluxQuery = `
      from(bucket: "${env.INFLUX_BUCKET}")
        |> range(start: ${start})
        |> filter(fn: (r) => r._measurement == "telemetry" and r.greenhouse_id == "${greenhouseId}")
        |> filter(fn: (r) => r._field == "temp" or r._field == "umid_ar" or r._field == "umid_solo")
        |> group(columns: ["_field"])
        |> reduce(
            identity: {min: 999.0, max: -999.0, sum: 0.0, count: 0},
            fn: (r, accumulator) => ({
              min: if r._value < accumulator.min then r._value else accumulator.min,
              max: if r._value > accumulator.max then r._value else accumulator.max,
              sum: accumulator.sum + r._value,
              count: accumulator.count + 1
            })
          )
        |> map(fn: (r) => ({ r with avg: r.sum / float(v: r.count) }))
    `;

    const rows: Record<string, unknown>[] = [];
    await influxQuery.collectRows(fluxQuery, (row, meta) => {
      rows.push(meta.toObject(row) as Record<string, unknown>);
    });

    // Irrigation time from actuator logs
    const irrigationLogs = await prisma.actuatorLog.findMany({
      where: {
        actuator: { greenhouseId, name: 'bomba' },
        state: true,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    // Uptime from alerts (DEVICE_OFFLINE events)
    const offlineAlerts = await prisma.alert.count({
      where: {
        greenhouseId,
        type: 'DEVICE_OFFLINE',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    return {
      period: start,
      sensors: rows,
      irrigation: {
        activations: irrigationLogs.length,
      },
      connectivity: {
        offlineEvents: offlineAlerts,
      },
    };
  }

  /**
   * Hourly average temperature for dashboard chart (RN09)
   */
  async getTemperatureChart(greenhouseId: string, start = '-24h') {
    const fluxQuery = `
      from(bucket: "${env.INFLUX_BUCKET}")
        |> range(start: ${start})
        |> filter(fn: (r) => r._measurement == "telemetry" and r.greenhouse_id == "${greenhouseId}" and r._field == "temp")
        |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
        |> sort(columns: ["_time"])
    `;

    const rows: unknown[] = [];
    await influxQuery.collectRows(fluxQuery, (row, meta) => {
      rows.push(meta.toObject(row));
    });
    return rows;
  }

  /**
   * Soil moisture trend for irrigation efficiency report
   */
  async getSoilMoistureChart(greenhouseId: string, start = '-7d') {
    const fluxQuery = `
      from(bucket: "${env.INFLUX_BUCKET}")
        |> range(start: ${start})
        |> filter(fn: (r) => r._measurement == "telemetry" and r.greenhouse_id == "${greenhouseId}" and r._field == "umid_solo")
        |> aggregateWindow(every: 30m, fn: mean, createEmpty: false)
        |> sort(columns: ["_time"])
    `;

    const rows: unknown[] = [];
    await influxQuery.collectRows(fluxQuery, (row, meta) => {
      rows.push(meta.toObject(row));
    });
    return rows;
  }
}
