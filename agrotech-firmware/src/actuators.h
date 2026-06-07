#pragma once
#include <Arduino.h>

// ════════════════════════════════════════════════════════════════
//  Controle de atuadores (RN01 — dual mode, RN02 — precedência manual)
// ════════════════════════════════════════════════════════════════
enum class Atuador { BOMBA, EXAUSTOR, LUZES };

struct AtuadorState {
    bool     ligado;
    bool     modoManual;
    unsigned long manualAte;   // millis() até quando ignora automação
    unsigned long ligadoDesde; // millis() de quando foi ligado (para timeout RN04)
};

void atuadoresInit();

// Ativa/desativa via comando manual (RN02 — sobrepõe automação)
void atuadorComandoManual(Atuador a, bool ligar, int timeoutSecs);

// Ativa/desativa via automação (ignorado se em modo manual ativo)
void atuadorComandoAuto(Atuador a, bool ligar);

// Verifica se timeout manual expirou e reverte ao modo automático
void atuadoresTickManualTimeout();

AtuadorState atuadorGetState(Atuador a);

const char* atuadorNome(Atuador a);
