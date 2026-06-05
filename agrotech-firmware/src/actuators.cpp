#include "actuators.h"
#include "config.h"

static AtuadorState estados[3]; // BOMBA=0, EXAUSTOR=1, LUZES=2
static const uint8_t PINOS[3] = { PIN_RELE_BOMBA, PIN_RELE_EXAUST, PIN_RELE_LUZES };

static void setRele(int idx, bool ligar) {
    bool jaEstaNoEstado = (estados[idx].ligado == ligar);
    if (jaEstaNoEstado) return;

    estados[idx].ligado = ligar;
    digitalWrite(PINOS[idx], ligar ? RELE_ON : RELE_OFF);

    if (ligar) {
        estados[idx].ligadoDesde = millis();
    }

    Serial.printf("[Atuador] %s -> %s (%s)\n",
        atuadorNome((Atuador)idx),
        ligar ? "LIGADO" : "DESLIGADO",
        estados[idx].modoManual ? "manual" : "automatico");
}

void atuadoresInit() {
    for (int i = 0; i < 3; i++) {
        pinMode(PINOS[i], OUTPUT);
        digitalWrite(PINOS[i], RELE_OFF);
        estados[i] = { false, false, 0, 0 };
    }
    Serial.println("[Atuadores] Reles inicializados (todos OFF).");
}

void atuadorComandoManual(Atuador a, bool ligar, int timeoutSecs) {
    int idx = (int)a;
    estados[idx].modoManual = true;
    estados[idx].manualAte  = millis() + (unsigned long)timeoutSecs * 1000UL;
    setRele(idx, ligar);
    Serial.printf("[Atuador] Modo manual ativo por %ds\n", timeoutSecs);
}

void atuadorComandoAuto(Atuador a, bool ligar) {
    int idx = (int)a;
    if (estados[idx].modoManual) {
        // RN02: comando automático ignorado enquanto manual ativo
        return;
    }
    setRele(idx, ligar);
}

void atuadoresTickManualTimeout() {
    unsigned long agora = millis();
    for (int i = 0; i < 3; i++) {
        if (estados[i].modoManual && agora >= estados[i].manualAte) {
            estados[i].modoManual = false;
            Serial.printf("[Atuador] Timeout manual expirado: %s -> modo automatico\n",
                atuadorNome((Atuador)i));
        }
    }
}

AtuadorState atuadorGetState(Atuador a) {
    return estados[(int)a];
}

const char* atuadorNome(Atuador a) {
    switch (a) {
        case Atuador::BOMBA:    return "bomba";
        case Atuador::EXAUSTOR: return "exaustor";
        case Atuador::LUZES:    return "lampada";
    }
    return "desconhecido";
}
