#pragma once
#include <Arduino.h>

// ════════════════════════════════════════════════════════════════
//  Estrutura de configuração persistida em NVS (RN03)
//  Sobrevive a reboots e quedas de energia.
// ════════════════════════════════════════════════════════════════
struct Config {
    float  tempMax;
    float  tempMin;
    float  umidSoloMin;
    float  umidSoloMax;
    int    regaMaxSecs;
    char   luzOn[6];   // "HH:MM\0"
    char   luzOff[6];
};

// Carrega config do NVS. Se não existir, usa defaults e salva.
void storageLoad(Config &cfg);

// Persiste a config no NVS.
void storageSave(const Config &cfg);

// Apaga namespace NVS (reset de fábrica).
void storageReset();
