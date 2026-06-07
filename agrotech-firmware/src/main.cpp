#include <Arduino.h>
#include <WiFi.h>
#include <esp_task_wdt.h>    // Watchdog de hardware
#include <time.h>
#include "config.h"
#include "storage.h"
#include "sensors.h"
#include "actuators.h"
#include "automation.h"
#include "mqtt_manager.h"

// ════════════════════════════════════════════════════════════════
//  AgroTech Firmware — ESP32
//  Controle autônomo de estufa com MQTT e edge computing.
// ════════════════════════════════════════════════════════════════

// ── Estado global ─────────────────────────────────────────────────
static Config       cfg;
static SensorData   ultimaLeitura;
static unsigned long tUltimaLeitura  = 0;
static unsigned long tUltimoEnvio    = 0;
static unsigned long tUltimoHB       = 0;
static unsigned long tBootMs         = 0;
static float        ultimaTemp       = -999.0f;
static float        ultimaSolo       = -999.0f;

// ── Wi-Fi ─────────────────────────────────────────────────────────
static void wifiConectar() {
    Serial.printf("[WiFi] Conectando a %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long inicio = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - inicio > TIMEOUT_WIFI_MS) {
            Serial.println("\n[WiFi] Timeout! Operando offline com config NVS.");
            return;
        }
        delay(500);
        Serial.print(".");
        digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS)); // pisca durante conexão
    }

    Serial.printf("\n[WiFi] Conectado! IP: %s  RSSI: %ddBm\n",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
    digitalWrite(PIN_LED_STATUS, HIGH); // LED fixo = conectado

    // Sincroniza NTP (necessário para fotoperíodo RN06)
    configTime(-3 * 3600, 0, "pool.ntp.org", "time.google.com");
    Serial.println("[NTP] Sincronizando hora...");
    struct tm ti;
    if (getLocalTime(&ti, 5000)) {
        Serial.printf("[NTP] Hora: %02d:%02d:%02d\n", ti.tm_hour, ti.tm_min, ti.tm_sec);
    } else {
        Serial.println("[NTP] Falha na sincronização — fotoperíodo inativo até resolver.");
    }
}

// ── LED de status ─────────────────────────────────────────────────
static void ledStatus() {
    static unsigned long tLed = 0;
    static int cnt = 0;

    if (millis() - tLed < 500) return;
    tLed = millis();

    if (WiFi.status() != WL_CONNECTED) {
        // Sem Wi-Fi: pisca rápido
        digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    } else if (!mqttConectado()) {
        // Wi-Fi ok, MQTT offline: pisca 2x e pausa
        cnt++;
        if (cnt <= 4) digitalWrite(PIN_LED_STATUS, cnt % 2 == 0);
        else if (cnt > 8) cnt = 0;
    } else {
        // Tudo ok: LED fixo
        digitalWrite(PIN_LED_STATUS, HIGH);
    }
}

// ════════════════════════════════════════════════════════════════
//  SETUP
// ════════════════════════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n\n========== AgroTech ESP32 ==========");
    Serial.printf("Firmware build: %s %s\n", __DATE__, __TIME__);

    tBootMs = millis();

    // ── Hardware watchdog (30s) ───────────────────────────────────
    esp_task_wdt_init(30, true); // panic=true → reboot automático
    esp_task_wdt_add(NULL);

    // ── Pinos ─────────────────────────────────────────────────────
    pinMode(PIN_LED_STATUS, OUTPUT);
    digitalWrite(PIN_LED_STATUS, LOW);

    // ── NVS — carrega config salva (RN03) ─────────────────────────
    storageLoad(cfg);

    // ── Sensores e atuadores ──────────────────────────────────────
    sensorsInit();
    atuadoresInit();

    // ── Wi-Fi e NTP ───────────────────────────────────────────────
    wifiConectar();

    // ── MQTT ──────────────────────────────────────────────────────
    mqttInit(cfg);
    mqttReconnect();

    // ── Primeira leitura imediata ─────────────────────────────────
    ultimaLeitura = sensorsRead();

    Serial.println("========== Setup concluído ==========\n");
}

// ════════════════════════════════════════════════════════════════
//  LOOP PRINCIPAL
// ════════════════════════════════════════════════════════════════
void loop() {
    esp_task_wdt_reset(); // keepalive do watchdog

    unsigned long agora = millis();

    // ── 1. Mantém MQTT e processa mensagens recebidas ─────────────
    mqttLoop();

    // ── 2. Verifica timeout do modo manual (RN02) ─────────────────
    atuadoresTickManualTimeout();

    // ── 3. Leitura de sensores (RN07 — a cada 60s) ────────────────
    if (agora - tUltimaLeitura >= INTERVALO_LEITURA_MS) {
        tUltimaLeitura = agora;

        SensorData leitura = sensorsRead();

        if (!leitura.valido) {
            // RN12: falha de hardware → bloqueia atuadores + alerta
            atuadorComandoAuto(Atuador::BOMBA,    false);
            atuadorComandoAuto(Atuador::EXAUSTOR, false);
            atuadorComandoAuto(Atuador::LUZES,    false);

            if (mqttConectado()) {
                mqttPublicarFalhaSensor(leitura.erroMsg);
            }
        } else {
            // Automação local (RN04, RN05, RN06) — funciona offline também
            bool mudou = automacaoExecutar(leitura, cfg);

            // RN08: envio por evento se atuador mudou ou delta grande
            bool deltaTemp = fabsf(leitura.temp    - ultimaTemp) >= DELTA_TEMP_EVENTO;
            bool deltaSolo = fabsf(leitura.umidSolo - ultimaSolo) >= DELTA_UMID_EVENTO;

            if (mqttConectado() && (mudou || deltaTemp || deltaSolo)) {
                Serial.println("[Main] Envio por evento (delta ou mudança de atuador)");
                mqttPublicarSensores(leitura);

                // Publica estado de cada atuador
                for (int i = 0; i < 3; i++) {
                    Atuador a = (Atuador)i;
                    AtuadorState s = atuadorGetState(a);
                    mqttPublicarAtuador(a, s.ligado, s.modoManual);
                }

                ultimaTemp = leitura.temp;
                ultimaSolo = leitura.umidSolo;
            }

            ultimaLeitura = leitura;
        }
    }

    // ── 4. Proteção de timeout da irrigação (RN04) ────────────────
    automacaoTickIrrigacao(cfg);

    // ── 5. Envio periódico (RN08 — a cada 5 min) ─────────────────
    if (agora - tUltimoEnvio >= INTERVALO_ENVIO_MS) {
        tUltimoEnvio = agora;

        if (mqttConectado() && ultimaLeitura.valido) {
            Serial.println("[Main] Envio periódico (5min)");
            mqttPublicarSensores(ultimaLeitura);

            for (int i = 0; i < 3; i++) {
                Atuador a = (Atuador)i;
                AtuadorState s = atuadorGetState(a);
                mqttPublicarAtuador(a, s.ligado, s.modoManual);
            }
        }
    }

    // ── 6. Heartbeat (RN11 — a cada 30s) ─────────────────────────
    if (agora - tUltimoHB >= INTERVALO_HEARTBEAT_MS) {
        tUltimoHB = agora;

        unsigned long uptimeSecs = (agora - tBootMs) / 1000UL;
        int rssi     = (WiFi.status() == WL_CONNECTED) ? WiFi.RSSI() : 0;
        uint32_t mem = esp_get_free_heap_size();

        if (mqttConectado()) {
            mqttPublicarHeartbeat(true, uptimeSecs, rssi, mem);
        }

        // Reconecta Wi-Fi se caiu
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("[WiFi] Conexão perdida, reconectando...");
            wifiConectar();
        }
    }

    // ── 7. LED visual de status ───────────────────────────────────
    ledStatus();

    delay(100); // evita busy-loop, mantém watchdog satisfeito
}
