#include "sensors.h"
#include "config.h"
#include <DHT.h>

static DHT dht(PIN_DHT11, DHT11);

void sensorsInit() {
    dht.begin();
    analogSetAttenuation(ADC_11db);
    Serial.println("[Sensors] DHT11 + LM35DZ + P23 + LDR inicializados.");
    Serial.printf("[Sensors] Pinos: DHT11=%d  LM35=%d  P23=%d  LDR=%d\n",
        PIN_DHT11, PIN_LM35, PIN_SOLO, PIN_LDR);
}

float lm35AdcParaTemp(int adc) {
    float tensaoMv = (adc / LM35_ADC_RESOLUCAO) * LM35_TENSAO_REF_MV;
    return (tensaoMv / LM35_MV_POR_GRAU) + 10.0f; // offset de calibração
}

float soloAdcParaPct(int adc) {
    float pct = map(adc, SOLO_VALOR_SECO, SOLO_VALOR_MOLHADO, 0, 100);
    return constrain(pct, 0.0f, 100.0f);
}

SensorData sensorsRead() {
    SensorData d;
    d.valido     = true;
    d.erroMsg[0] = '\0';
    d.temp       = NAN;
    d.umidAr     = NAN;
    d.tempSolo   = NAN;
    d.umidSolo   = NAN;
    d.ldrRaw     = -1;

    // ── DHT11 ────────────────────────────────────────────────────
    d.temp   = dht.readTemperature();
    d.umidAr = dht.readHumidity();

    if (isnan(d.temp) || isnan(d.umidAr) ||
        d.temp < TEMP_FISICA_MIN || d.temp > TEMP_FISICA_MAX ||
        d.umidAr < UMID_AR_MIN   || d.umidAr > UMID_AR_MAX) {
        snprintf(d.erroMsg, sizeof(d.erroMsg), "DHT11: falha no pino %d", PIN_DHT11);
        Serial.println("[Sensors][ERRO] " + String(d.erroMsg));
        d.temp   = NAN;
        d.umidAr = NAN;
    }

    // ── LM35DZ ───────────────────────────────────────────────────
    long lm35Sum = 0;
    for (int i = 0; i < LM35_AMOSTRAS; i++) { lm35Sum += analogRead(PIN_LM35); delay(5); }
    d.tempSolo = lm35AdcParaTemp(lm35Sum / LM35_AMOSTRAS);

    if (d.tempSolo < LM35_TEMP_MIN || d.tempSolo > LM35_TEMP_MAX) {
        Serial.printf("[Sensors][ERRO] LM35DZ: %.1f°C fora da faixa\n", d.tempSolo);
        d.tempSolo = NAN;
    }

    // ── P23 ───────────────────────────────────────────────────────
    long soloSum = 0;
    for (int i = 0; i < 5; i++) { soloSum += analogRead(PIN_SOLO); delay(10); }
    int soloAdc = soloSum / 5;
    d.umidSolo = soloAdcParaPct(soloAdc);

    // ── LDR ───────────────────────────────────────────────────────
    d.ldrRaw = analogRead(PIN_LDR);

    // valido = true se pelo menos um sensor tem dado real
    d.valido = !isnan(d.tempSolo) || !isnan(d.temp) ||
               d.umidSolo >= 0    || d.ldrRaw >= 0;

    Serial.printf("[Sensors] Ar: T=%.1f°C Umid=%.1f%% | Solo: T=%.1f°C Umid=%.1f%% | LDR=%d\n",
        d.temp, d.umidAr, d.tempSolo, d.umidSolo, d.ldrRaw);

    return d;
}
