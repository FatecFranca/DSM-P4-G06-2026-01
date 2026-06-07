#pragma once
#include "sensors.h"
#include "storage.h"

// ════════════════════════════════════════════════════════════════
//  Motor de automação local (RN04, RN05, RN06)
//  Executado a cada leitura de sensor, mesmo offline (RN03).
// ════════════════════════════════════════════════════════════════

// Retorna true se algum atuador mudou de estado (para envio MQTT por evento - RN08)
bool automacaoExecutar(const SensorData &d, const Config &cfg);

// Verifica proteção de timeout da irrigação (RN04 — evita transbordamento)
void automacaoTickIrrigacao(const Config &cfg);

// Formata hora atual como "HH:MM" (usa millis-based clock ou NTP se disponível)
String horaAtual();
