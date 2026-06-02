#include "automation.h"
#include "actuators.h"
#include "config.h"
#include <Arduino.h>
#include <time.h>

// ── Helpers ───────────────────────────────────────────────────────
static bool estadoAnterior[3] = { false, false, false };

static bool mudouEstado() {
    bool mudou = false;
    for (int i = 0; i < 3; i++) {
        bool atual = atuadorGetState((Atuador)i).ligado;
        if (atual != estadoAnterior[i]) {
            estadoAnterior[i] = atual;
            mudou = true;
        }
    }
    return mudou;
}

// Compara "HH:MM" strings, retorna -1, 0, ou 1
static int compararHora(const char* a, const char* b) {
    int ha, ma, hb, mb;
    sscanf(a, "%d:%d", &ha, &ma);
    sscanf(b, "%d:%d", &hb, &mb);
    int ta = ha * 60 + ma;
    int tb = hb * 60 + mb;
    return (ta < tb) ? -1 : (ta > tb) ? 1 : 0;
}

String horaAtual() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        // Sem NTP: retorna hora inválida → não ativa fotoperíodo até sincronizar
        return "00:00";
    }
    char buf[6];
    snprintf(buf, sizeof(buf), "%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min);
    return String(buf);
}

// ── RN04 — Controle de irrigação ─────────────────────────────────
static void controlarBomba(const SensorData &d, const Config &cfg) {
    AtuadorState bomba = atuadorGetState(Atuador::BOMBA);

    if (!bomba.ligado) {
        // Ativa se solo abaixo do mínimo
        if (d.umidSolo < cfg.umidSoloMin) {
            Serial.printf("[Auto] Solo %.1f%% < min %.1f%% → liga bomba\n",
                d.umidSolo, cfg.umidSoloMin);
            atuadorComandoAuto(Atuador::BOMBA, true);
        }
    } else {
        // Desativa se solo atingiu máximo
        if (d.umidSolo >= cfg.umidSoloMax) {
            Serial.printf("[Auto] Solo %.1f%% >= max %.1f%% → desliga bomba\n",
                d.umidSolo, cfg.umidSoloMax);
            atuadorComandoAuto(Atuador::BOMBA, false);
        }
    }
}

// ── RN05 — Controle térmico ───────────────────────────────────────
static void controlarClima(const SensorData &d, const Config &cfg) {
    // Exaustor: ativa se temperatura alta
    if (d.temp > cfg.tempMax) {
        Serial.printf("[Auto] T=%.1f > max %.1f → liga exaustor\n", d.temp, cfg.tempMax);
        atuadorComandoAuto(Atuador::EXAUSTOR, true);
    } else if (d.temp <= cfg.tempMax - 1.0f) {
        // Histerese de 1°C para evitar liga/desliga rápido
        atuadorComandoAuto(Atuador::EXAUSTOR, false);
    }

    // Aquecimento (lâmpada de calor): ativa se temperatura baixa
    // Nota: se a lâmpada também é grow light, o fotoperíodo (RN06) tem precedência
    if (d.temp < cfg.tempMin) {
        Serial.printf("[Auto] T=%.1f < min %.1f → aquecimento necessario\n", d.temp, cfg.tempMin);
        // Emite log — a decisão final da lâmpada fica no controlarFotoperiodo
    }
}

// ── RN06 — Gestão de fotoperíodo ─────────────────────────────────
static void controlarFotoperiodo(const SensorData &d, const Config &cfg) {
    String hora = horaAtual();
    if (hora == "00:00") return; // NTP não sincronizado ainda

    // Verifica se está dentro do horário programado
    bool dentroHorario = (compararHora(hora.c_str(), cfg.luzOn)  >= 0) &&
                         (compararHora(hora.c_str(), cfg.luzOff) <  0);

    // Luz artificial só acende se: dentro do horário E luminosidade insuficiente
    // LDR: valor baixo = muito luz, valor alto = escuro
    // Limiar: LDR > 2000 = escuro suficiente para precisar de luz artificial
    bool escuroSuficiente = (d.ldrRaw > 2000);

    if (dentroHorario && escuroSuficiente) {
        Serial.printf("[Auto] Fotoperíodo %s-%s | Hora=%s | LDR=%d → liga luzes\n",
            cfg.luzOn, cfg.luzOff, hora.c_str(), d.ldrRaw);
        atuadorComandoAuto(Atuador::LUZES, true);
    } else {
        atuadorComandoAuto(Atuador::LUZES, false);
    }
}

// ── API pública ───────────────────────────────────────────────────
bool automacaoExecutar(const SensorData &d, const Config &cfg) {
    // RN12: sensores inválidos → não executa automação
    if (!d.valido) {
        Serial.println("[Auto] Sensor inválido — automação suspensa.");
        return false;
    }

    controlarBomba(d, cfg);
    controlarClima(d, cfg);
    controlarFotoperiodo(d, cfg);

    return mudouEstado();
}

// RN04: proteção contra tempo máximo de irrigação (transbordamento)
void automacaoTickIrrigacao(const Config &cfg) {
    AtuadorState bomba = atuadorGetState(Atuador::BOMBA);
    if (!bomba.ligado) return;

    unsigned long tempoLigado = (millis() - bomba.ligadoDesde) / 1000UL;
    if (tempoLigado >= (unsigned long)cfg.regaMaxSecs) {
        Serial.printf("[Auto][SEGURANÇA] Bomba ativa por %lus >= max %ds → desliga\n",
            tempoLigado, cfg.regaMaxSecs);
        atuadorComandoAuto(Atuador::BOMBA, false);
        // O backend receberá o status e disparará alerta de inércia se necessário
    }
}
