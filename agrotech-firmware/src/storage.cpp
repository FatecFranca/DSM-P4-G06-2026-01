#include "storage.h"
#include "config.h"
#include <Preferences.h>

static Preferences prefs;
static const char* NVS_NS = "agrotech";

void storageLoad(Config &cfg) {
    prefs.begin(NVS_NS, true); // read-only

    cfg.tempMax      = prefs.getFloat("t_max",      DEFAULT_TEMP_MAX);
    cfg.tempMin      = prefs.getFloat("t_min",      DEFAULT_TEMP_MIN);
    cfg.umidSoloMin  = prefs.getFloat("us_min",     DEFAULT_UMID_SOLO_MIN);
    cfg.umidSoloMax  = prefs.getFloat("us_max",     DEFAULT_UMID_SOLO_MAX);
    cfg.regaMaxSecs  = prefs.getInt  ("rega_max",   DEFAULT_REGA_MAX_S);

    String on  = prefs.getString("luz_on",  DEFAULT_LUZ_ON);
    String off = prefs.getString("luz_off", DEFAULT_LUZ_OFF);
    strlcpy(cfg.luzOn,  on.c_str(),  sizeof(cfg.luzOn));
    strlcpy(cfg.luzOff, off.c_str(), sizeof(cfg.luzOff));

    prefs.end();

    Serial.printf("[NVS] Config carregada: t_max=%.1f t_min=%.1f us_min=%.1f us_max=%.1f rega=%ds luz=%s-%s\n",
        cfg.tempMax, cfg.tempMin, cfg.umidSoloMin, cfg.umidSoloMax,
        cfg.regaMaxSecs, cfg.luzOn, cfg.luzOff);
}

void storageSave(const Config &cfg) {
    prefs.begin(NVS_NS, false); // read-write

    prefs.putFloat ("t_max",    cfg.tempMax);
    prefs.putFloat ("t_min",    cfg.tempMin);
    prefs.putFloat ("us_min",   cfg.umidSoloMin);
    prefs.putFloat ("us_max",   cfg.umidSoloMax);
    prefs.putInt   ("rega_max", cfg.regaMaxSecs);
    prefs.putString("luz_on",   cfg.luzOn);
    prefs.putString("luz_off",  cfg.luzOff);

    prefs.end();
    Serial.println("[NVS] Config salva.");
}

void storageReset() {
    prefs.begin(NVS_NS, false);
    prefs.clear();
    prefs.end();
    Serial.println("[NVS] Namespace apagado.");
}
