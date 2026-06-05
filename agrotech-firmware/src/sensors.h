#pragma once
#include <Arduino.h>

// ════════════════════════════════════════════════════════════════
//  Leituras dos sensores com validação de hardware (RN12)
//
//  Sensores utilizados:
//    DHT11   → temperatura e umidade do ar        (GPIO 4,  digital)
//    LM35DZ  → temperatura da terra               (GPIO 32, analógico ADC1)
//    P23     → umidade do solo                    (GPIO 34, analógico ADC1)
//    LDR     → luminosidade ambiente              (GPIO 35, analógico ADC1)
// ════════════════════════════════════════════════════════════════

struct SensorData {
    float temp;        // °C  — temperatura do ar       (DHT11)
    float umidAr;      // %   — umidade relativa do ar  (DHT11)
    float tempSolo;    // °C  — temperatura da terra    (LM35DZ)
    float umidSolo;    // %   — umidade do solo calibrada 0-100 (P23)
    int   ldrRaw;      // ADC — luminosidade bruta 0-4095        (LDR)
    bool  valido;      // false = falha de hardware detectada (RN12)
    char  erroMsg[80]; // descrição do erro se !valido
};

void       sensorsInit();
SensorData sensorsRead();

// Converte ADC bruto do P23 para porcentagem (0-100%)
float soloAdcParaPct(int adc);

// Converte ADC bruto do LM35DZ para temperatura em °C
float lm35AdcParaTemp(int adc);
