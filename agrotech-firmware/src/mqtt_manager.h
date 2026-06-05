#pragma once
#include <Arduino.h>
#include <PubSubClient.h>
#include "sensors.h"
#include "actuators.h"
#include "storage.h"

// ════════════════════════════════════════════════════════════════
//  Gerenciador MQTT — conexão, reconexão, pub/sub (RN08)
// ════════════════════════════════════════════════════════════════

// Inicializa cliente MQTT e configura callback
void mqttInit(Config &cfg);

// Deve ser chamado no loop() — mantém conexão e processa mensagens
void mqttLoop();

// Reconecta ao broker se necessário (inclui LWT e subscriptions)
bool mqttReconnect();

bool mqttConectado();

// ── Publicadores ─────────────────────────────────────────────────
void mqttPublicarSensores(const SensorData &d);
void mqttPublicarAtuador(Atuador a, bool estado, bool manual);
void mqttPublicarHeartbeat(bool online, unsigned long uptimeSecs, int rssi, uint32_t memLivre);
void mqttPublicarFalhaSensor(const char* erro);
