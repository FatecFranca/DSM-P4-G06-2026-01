// src/modules/alerts/alerts.service.ts
import nodemailer from 'nodemailer';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export type AlertType =
  | 'TEMP_CRITICAL'
  | 'HUMIDITY_CRITICAL'
  | 'SENSOR_FAILURE'
  | 'IRRIGATION_TIMEOUT'
  | 'RESERVOIR_EMPTY'
  | 'DEVICE_OFFLINE'
  | 'ACTUATOR_STUCK';

const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export class AlertsService {
  /**
   * Creates an alert and sends email for CRITICAL severity (RN10)
   */
  async create(
    greenhouseId: string,
    type: AlertType,
    message: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'WARNING',
    metadata?: Record<string, unknown>
  ) {
    const alert = await prisma.alert.create({
      data: { greenhouseId, type, message, severity, metadata: metadata as any },
      include: { greenhouse: { select: { name: true } } },
    });

    logger.warn('Alert created', { id: alert.id, type, severity, greenhouseId });

    if (severity === 'CRITICAL' && env.ALERT_EMAIL_TO) {
      this.sendEmail((alert as any).greenhouse.name, type, message).catch((err) =>
        logger.error('Email send failed', { err })
      );
    }

    return alert;
  }

  async acknowledge(alertId: string, userId: string) {
    return prisma.alert.update({
      where: { id: alertId },
      data: { status: 'ACKNOWLEDGED', acknowledgedBy: userId, acknowledgedAt: new Date() },
    });
  }

  async resolve(alertId: string) {
    return prisma.alert.update({
      where: { id: alertId },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  async list(greenhouseId?: string, status?: string) {
    return prisma.alert.findMany({
      where: {
        ...(greenhouseId && { greenhouseId }),
        ...(status && { status: status as 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' }),
      },
      include: {
        greenhouse: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Check if an unresolved alert of same type already exists (deduplication)
   */
  async hasPendingAlert(greenhouseId: string, type: AlertType): Promise<boolean> {
    const count = await prisma.alert.count({
      where: { greenhouseId, type, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
    });
    return count > 0;
  }

  private async sendEmail(greenhouseName: string, type: string, message: string) {
    await mailer.sendMail({
      from: env.SMTP_USER,
      to: env.ALERT_EMAIL_TO,
      subject: `[AgroTech CRITICAL] ${type} — ${greenhouseName}`,
      text: `Alert: ${message}\nGreenhouse: ${greenhouseName}\nTime: ${new Date().toISOString()}`,
      html: `
        <h2 style="color:red">⚠️ Critical Alert — ${greenhouseName}</h2>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
    });
    logger.info('Alert email sent', { type, greenhouseName });
  }
}
