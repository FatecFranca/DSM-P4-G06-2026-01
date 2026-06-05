#include "mqtt_manager.h"
#include "config.h"
#include "automation.h"
#include <WiFi.h>
#include <ArduinoJson.h>

// ── Instâncias ────────────────────────────────────────────────────
static WiFiClient   wifiClient;
static PubSubClient mqttClient(wifiClient);
static Config*      cfgPtr = nullptr;
static unsigned long ultimoReconnect = 0;

// ── Callback: mensagens recebidas do backend ──────────────────────
static void onMensagem(char* topic, byte* payload, unsigned int length) {
    Serial.printf("[MQTT] Recebido em %s\n", topic);

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload, length);
    if (err) {
        Serial.printf("[MQTT][ERRO] JSON inválido: %s\n", err.f_str());
        return;
    }

    String topicStr = String(topic);

    // ── Comando manual de atuador (RN01, RN02) ────────────────────
    Atuador alvo;
    bool ehComando = false;

    if (topicStr == TOPIC_CMD_BOMBA)  { alvo = Atuador::BOMBA;    ehComando = true; }
    if (topicStr == TOPIC_CMD_EXAUST) { alvo = Atuador::EXAUSTOR; ehComando = true; }
    if (topicStr == TOPIC_CMD_LUZES)  { alvo = Atuador::LUZES;    ehComando = true; }

    if (ehComando) {
        bool  ligar   = doc["comando"]                 | false;
        int   timeout = doc["tempo_ignorar_sensores"]  | TIMEOUT_MANUAL_DEFAULT_S;
        const char* user = doc["usuario"] | "desconhecido";

        Serial.printf("[MQTT] Comando manual: %s=%s timeout=%ds user=%s\n",
            atuadorNome(alvo), ligar ? "ON" : "OFF", timeout, user);

        atuadorComandoManual(alvo, ligar, timeout);

        // Confirma estado de volta ao backend (RN08 — envio por evento)
        mqttPublicarAtuador(alvo, ligar, true);
        return;
    }

    // ── Atualização de configuração (RN03) ────────────────────────
    if (topicStr == TOPIC_CMD_CONFIG && cfgPtr != nullptr) {
        Serial.println("[MQTT] Nova config recebida.");

        if (doc.containsKey("t_max"))      cfgPtr->tempMax     = doc["t_max"].as<float>();
        if (doc.containsKey("t_min"))      cfgPtr->tempMin     = doc["t_min"].as<float>();
        if (doc.containsKey("u_solo_min")) cfgPtr->umidSoloMin = doc["u_solo_min"].as<float>();
        if (doc.containsKey("u_solo_max")) cfgPtr->umidSoloMax = doc["u_solo_max"].as<float>();
        if (doc.containsKey("t_rega_max")) cfgPtr->regaMaxSecs = doc["t_rega_max"].as<int>();

        if (doc.containsKey("luz_on"))
            strlcpy(cfgPtr->luzOn,  doc["luz_on"].as<const char*>(),  sizeof(cfgPtr->luzOn));
        if (doc.containsKey("luz_off"))
            strlcpy(cfgPtr->luzOff, doc["luz_off"].as<const char*>(), sizeof(cfgPtr->luzOff));

        // Persiste em NVS (RN03 — operação offline)
        storageSave(*cfgPtr);

        Serial.printf("[MQTT] Config aplicada: t_max=%.1f t_min=%.1f us_min=%.1f\n",
            cfgPtr->tempMax, cfgPtr->tempMin, cfgPtr->umidSoloMin);
    }
}

// ── API pública ───────────────────────────────────────────────────
void mqttInit(Config &cfg) {
    cfgPtr = &cfg;
    mqttClient.setServer(MQTT_HOST, MQTT_PORT);
    mqttClient.setCallback(onMensagem);
    mqttClient.setBufferSize(512);
    mqttClient.setKeepAlive(60);
    Serial.println("[MQTT] Cliente configurado.");
}

bool mqttReconnect() {
    if (mqttClient.connected()) return true;

    // LWT — broker publica OFFLINE automaticamente se conexão cair (RN11)
    String lwtPayload = "{\"status\":\"OFFLINE\"}";

    Serial.printf("[MQTT] Conectando em %s:%d...\n", MQTT_HOST, MQTT_PORT);

    bool ok = mqttClient.connect(
        MQTT_CLIENT_ID,
        MQTT_USER,
        MQTT_PASSWORD,
        TOPIC_CONEXAO,     // LWT topic
        1,                 // LWT QoS
        true,              // LWT retain
        lwtPayload.c_str()
    );

    if (ok) {
        Serial.println("[MQTT] Conectado!");

        // Assina tópicos de comando (QoS 1)
        mqttClient.subscribe(TOPIC_CMD_BOMBA,  1);
        mqttClient.subscribe(TOPIC_CMD_EXAUST, 1);
        mqttClient.subscribe(TOPIC_CMD_LUZES,  1);
        mqttClient.subscribe(TOPIC_CMD_CONFIG, 1);

        // Anuncia ONLINE (retain=true para status persistir no broker)
        String onlinePayload = "{\"status\":\"ONLINE\"}";
        mqttClient.publish(TOPIC_CONEXAO, onlinePayload.c_str(), true);

        return true;
    }

    Serial.printf("[MQTT] Falha, rc=%d. Retry em 5s.\n", mqttClient.state());
    return false;
}

void mqttLoop() {
    if (!mqttClient.connected()) {
        unsigned long agora = millis();
        if (agora - ultimoReconnect >= TIMEOUT_RECONNECT_MS) {
            ultimoReconnect = agora;
            mqttReconnect();
        }
    }
    mqttClient.loop();
}

bool mqttConectado() {
    return mqttClient.connected();
}

// ── Publicadores ──────────────────────────────────────────────────

// RN08: telemetria consolidada
// Payload publicado: temp (ar/DHT11), umid_ar (DHT11), temp_solo (LM35DZ),
//                    umid_solo (P23), luz (LDR)
void mqttPublicarSensores(const SensorData &d) {
    JsonDocument doc;

    if (!isnan(d.temp))     doc["temp"]      = serialized(String(d.temp,     1));
    else                    doc["temp"]      = nullptr;

    if (!isnan(d.umidAr))   doc["umid_ar"]   = serialized(String(d.umidAr,   1));
    else                    doc["umid_ar"]   = nullptr;

    if (!isnan(d.tempSolo)) doc["temp_solo"] = serialized(String(d.tempSolo, 1));
    else                    doc["temp_solo"] = nullptr;

    if (d.umidSolo >= 0)    doc["umid_solo"] = serialized(String(d.umidSolo, 1));
    else                    doc["umid_solo"] = nullptr;

    if (d.ldrRaw >= 0)      doc["luz"]       = d.ldrRaw;
    else                    doc["luz"]       = nullptr;

    char buf[256];
    serializeJson(doc, buf);
    mqttClient.publish(TOPIC_SENSORES, buf);
    Serial.printf("[MQTT] Sensores publicados: %s\n", buf);
    }

    void mqttPublicarAtuador(Atuador a, bool estado, bool manual) {
    JsonDocument doc;
    doc["equip"]   = atuadorNome(a);
    doc["estado"]  = estado;
    doc["gatilho"] = manual ? "manual" : "automatico";

    char buf[150];
    serializeJson(doc, buf);
    mqttClient.publish(TOPIC_ATUADORES, buf);
    Serial.printf("[MQTT] Atuador publicado: %s\n", buf);
}

void mqttPublicarHeartbeat(bool online, unsigned long uptimeSecs, int rssi, uint32_t memLivre) {
    JsonDocument doc;
    doc["status"]   = online ? "ONLINE" : "OFFLINE";
    doc["uptime"]   = uptimeSecs;
    doc["wifi_rssi"]= rssi;
    doc["mem_livre"]= memLivre;

    char buf[200];
    serializeJson(doc, buf);
    mqttClient.publish(TOPIC_SISTEMA, buf); // QoS 0
}

// RN12: falha de hardware detectada
void mqttPublicarFalhaSensor(const char* erro) {
    JsonDocument doc;
    doc["tipo"]  = "SENSOR_FAILURE";
    doc["erro"]  = erro;

    char buf[256];
    serializeJson(doc, buf);
    mqttClient.publish(TOPIC_SISTEMA, buf, false);
    Serial.printf("[MQTT] Falha de sensor reportada: %s\n", erro);
}
