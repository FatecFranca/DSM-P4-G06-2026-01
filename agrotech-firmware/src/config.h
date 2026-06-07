#pragma once
#include "secrets.h"

// ════════════════════════════════════════════════════════════════
//  AgroTech — Configuração central de hardware e comportamento
//  Altere apenas este arquivo para adaptar a outro layout de placa.
// ════════════════════════════════════════════════════════════════

// ── Broker MQTT ──────────────────────────────────────────────────
// MQTT_HOST, MQTT_USER e MQTT_PASSWORD vêm do secrets.h
// WIFI_SSID e WIFI_PASSWORD vêm do secrets.h
#define MQTT_PORT      1883
#define MQTT_CLIENT_ID "esp32_estufa_" GREENHOUSE_ID


// ── Tópicos MQTT (gerados automaticamente a partir do ID) ────────
#define TOPIC_SENSORES   "agrotech/" GREENHOUSE_ID "/sensores/estado"
#define TOPIC_ATUADORES  "agrotech/" GREENHOUSE_ID "/status/atuadores"
#define TOPIC_SISTEMA    "agrotech/" GREENHOUSE_ID "/status/sistema"
#define TOPIC_CONEXAO    "agrotech/" GREENHOUSE_ID "/status/conexao"
#define TOPIC_CMD_BOMBA  "agrotech/" GREENHOUSE_ID "/cmd/bomba"
#define TOPIC_CMD_EXAUST "agrotech/" GREENHOUSE_ID "/cmd/exaustor"
#define TOPIC_CMD_LUZES  "agrotech/" GREENHOUSE_ID "/cmd/lampada"
#define TOPIC_CMD_CONFIG "agrotech/" GREENHOUSE_ID "/cmd/config"

// ── Pinagem ──────────────────────────────────────────────────────
//  Sensores de ar
#define PIN_DHT11       4     // Digital — dados do DHT11 (temp + umidade do ar)

//  Sensor de temperatura da terra
#define PIN_LM35        32    // Analógico (ADC1) — LM35DZ (temp do solo)

//  Sensor de umidade do solo
#define PIN_SOLO        34    // Analógico (ADC1) — P23 sensor de umidade do solo

//  Sensor de luminosidade
#define PIN_LDR         35    // Analógico (ADC1) — fotoresistor LDR

//  Relés (LOW = ativa o relé, HIGH = desativa)
#define PIN_RELE_BOMBA   26   // Digital — relé da bomba d'água
#define PIN_RELE_EXAUST  27   // Digital — relé do exaustor
#define PIN_RELE_LUZES   14   // Digital — relé das grow lights

//  LED de status onboard
#define PIN_LED_STATUS   2    // LED azul interno do ESP32

// ── Constantes de tempo (ms / s) ─────────────────────────────────
#define INTERVALO_LEITURA_MS     30000UL   // RN07: leitura a cada 60s == 60000UL
#define INTERVALO_ENVIO_MS      300000UL   // RN08: envio periódico a cada 5min == 300000UL
#define INTERVALO_HEARTBEAT_MS   30000UL   // heartbeat a cada 30s == 30000UL
#define TIMEOUT_RECONNECT_MS      5000UL   // tentativa de reconexão MQTT
#define TIMEOUT_WIFI_MS          20000UL   // timeout de conexão Wi-Fi

#define TIMEOUT_MANUAL_DEFAULT_S  1800     // RN02: 30 min em modo manual

// ── Limites físicos — DHT11 (RN12: validação de hardware) ────────
//  DHT11: temp 0~50°C, umidade 20~80%
#define TEMP_FISICA_MIN      0.0f
#define TEMP_FISICA_MAX     50.0f
#define UMID_AR_MIN         10.0f   // margem de segurança abaixo do mínimo do sensor
#define UMID_AR_MAX        100.0f

// ── Limites físicos — LM35DZ ──────────────────────────────────────
//  LM35DZ: 0°C a 100°C (variante sem tensão negativa)
#define LM35_TEMP_MIN        0.0f
#define LM35_TEMP_MAX      100.0f

// ── Limites físicos — ADC genérico ───────────────────────────────
#define SOLO_ADC_MIN         0
#define SOLO_ADC_MAX      4095
#define LDR_ADC_MIN          0
#define LDR_ADC_MAX       4095

// ── Calibração do sensor de solo P23 ─────────────────────────────
//  P23 (resistivo): solo seco = resistência alta = ADC alto
//                   solo molhado = resistência baixa = ADC baixo
//  Meça esses valores com o sensor no ar (seco) e na água (molhado)
#define SOLO_ESCALA_INVERTIDA false // 0% = seco, 100% = molhado
#define SOLO_VALOR_SECO       0   // ADC lido fora da agua
#define SOLO_VALOR_MOLHADO 2250   // ADC lido em agua/solo molhado

// ── Calibração do LM35DZ ─────────────────────────────────────────
//  Tensão de referência do ADC: 3300 mV (atenuação 11dB)
//  LM35DZ: 10 mV por °C
//  Fórmula: temp = (adc / 4095.0) * 3300.0 / 10.0
#define LM35_TENSAO_REF_MV  3300.0f
#define LM35_ADC_RESOLUCAO  4095.0f
#define LM35_MV_POR_GRAU      10.0f
#define LM35_AMOSTRAS           10   // média de leituras para reduzir ruído

// ── Thresholds padrão (RN04, RN05, RN06) — sobrescritos pelo NVS ──
#define DEFAULT_TEMP_MAX       30.0f
#define DEFAULT_TEMP_MIN       15.0f
#define DEFAULT_UMID_SOLO_MIN  40.0f
#define DEFAULT_UMID_SOLO_MAX  80.0f
#define DEFAULT_REGA_MAX_S     120
#define DEFAULT_LUZ_ON         "18:00"
#define DEFAULT_LUZ_OFF        "22:00"

// ── Delta para envio por evento (RN08) ────────────────────────────
#define DELTA_TEMP_EVENTO    5.0f   // °C
#define DELTA_UMID_EVENTO   10.0f   // %

// ── Lógica dos relés ─────────────────────────────────────────────
//  true  = módulo de relé ativo em LOW (mais comum)
//  false = módulo de relé ativo em HIGH
#define RELE_ATIVO_LOW  true
#define RELE_ON  (RELE_ATIVO_LOW ? LOW  : HIGH)
#define RELE_OFF (RELE_ATIVO_LOW ? HIGH : LOW)
