// src/mqtt/mqtt.client.ts
import mqtt, { MqttClient } from 'mqtt';
import { env } from '../config/env';
import { logger } from '../config/logger';

let client: MqttClient | null = null;

export function getMqttClient(): MqttClient {
  if (!client) throw new Error('MQTT client not initialized. Call connectMqtt() first.');
  return client;
}

export function connectMqtt(): MqttClient {
  client = mqtt.connect(env.MQTT_URL, {
    clientId: env.MQTT_CLIENT_ID,
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    // QoS 1 for all subscriptions on commands
    will: {
      topic: 'agrotech/backend/status',
      payload: JSON.stringify({ status: 'OFFLINE' }),
      qos: 1,
      retain: true,
    },
  });

  client.on('connect', () => {
    logger.info('MQTT connected', { broker: env.MQTT_URL });

    client!.publish('agrotech/backend/status', JSON.stringify({ status: 'ONLINE' }), { qos: 1, retain: true });

    // Subscribes aqui dentro para sobreviver a reconexões
    client!.subscribe(
      ['agrotech/+/sensores/#', 'agrotech/+/status/#'],
      { qos: 1 },
      (err, granted) => {
        if (err) logger.error('Subscribe erro', { err });
        else logger.info('Subscribe aceito', { granted });
      }
    );
  });

  client.on('reconnect', () => logger.warn('MQTT reconnecting...'));
  client.on('error', (err) => logger.error('MQTT error', { err }));
  client.on('offline', () => logger.warn('MQTT offline'));

  return client;
}