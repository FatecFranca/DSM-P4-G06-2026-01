# AgroTech — Hardware, Pinagem e Montagem
> ESP32 WROOM-32 / DevKit v1

## Sumário
- [Mapa de Pinos](#mapa-de-pinos)
- [DHT11 — Temperatura e Umidade do Ar](#dht11--temperatura-e-umidade-do-ar)
- [LM35DZ — Temperatura da Terra](#lm35dz--temperatura-da-terra)
- [P23 — Umidade do Solo](#p23--umidade-do-solo)
- [LDR — Luminosidade](#ldr--luminosidade)
- [Módulo de Relé](#módulo-de-relé-3-canais)
- [Diagrama de Conexão](#diagrama-de-conexão)
- [Lista de Componentes](#lista-de-componentes-bom)
- [Configuração do Firmware](#configuração-do-firmware)
- [Payload MQTT](#payload-mqtt)
- [Compilar e Gravar](#compilar-e-gravar)
- [Troubleshooting](#troubleshooting)

---

## Mapa de Pinos

| Componente | Pino ESP32 | Tipo | Constante em `config.h` |
|---|:---:|---|---|
| DHT11 (dados) | GPIO 4 | Digital I | `PIN_DHT11 = 4` |
| LM35DZ (VOUT) | GPIO 32 | ADC1 (I) | `PIN_LM35 = 32` |
| P23 Solo (AOUT) | GPIO 34 | ADC1 (I) | `PIN_SOLO = 34` |
| LDR (saída divisor) | GPIO 35 | ADC1 (I) | `PIN_LDR = 35` |
| Relé Bomba | GPIO 26 | Digital O | `PIN_RELE_BOMBA = 26` |
| Relé Exaustor | GPIO 27 | Digital O | `PIN_RELE_EXAUST = 27` |
| Relé Grow Light | GPIO 14 | Digital O | `PIN_RELE_LUZES = 14` |
| LED Status (onboard) | GPIO 2 | Digital O | `PIN_LED_STATUS = 2` |
| VCC sensores | 3.3V | — | — |
| VCC relés | 5V (VIN) | — | — |
| GND | GND | — | — |

### Pinos a evitar

| GPIO | Motivo |
|---|---|
| 0 | Boot mode |
| 1, 3 | TX/RX UART0 (Serial Monitor) |
| 6–11 | Flash SPI interno |
| 12 | Boot mode se HIGH na inicialização |
| 36, 39 | Input only, sem pull-up interno |

> **ADC seguro com Wi-Fi ativo:** use apenas ADC1 — GPIOs 32, 33, 34, 35, 36, 39.  
> ADC2 (GPIOs 0, 2, 4, 12–15, 25–27) conflita com o Wi-Fi e gera leituras erradas.

---

## DHT11 — Temperatura e Umidade do Ar

| Parâmetro | Valor |
|---|---|
| Tensão | 3.3V – 5.5V |
| Temperatura | 0°C a +50°C (±2°C) |
| Umidade | 20% – 80% UR (±5%) |
| Intervalo mínimo | 1 leitura/segundo |

**Pinout:**

```
VCC  →  3.3V do ESP32
DATA →  GPIO 4  +  resistor pull-up 10kΩ *
NC   →  Não conectar (versão 4 pinos)
GND  →  GND do ESP32
```

> \* Módulos com placa breakout já incluem o resistor pull-up — verifique antes de adicionar outro.

---

## LM35DZ — Temperatura da Terra

| Parâmetro | Valor |
|---|---|
| Tensão | 4V – 30V (usar 3.3V) |
| Faixa | 0°C a +100°C |
| Saída | 10 mV por °C |
| Precisão | ±1°C típico |

**Pinout (TO-92, face plana voltada para você — esquerda para direita):**

```
Pino 1 (VCC)  →  3.3V do ESP32
Pino 2 (VOUT) →  GPIO 32
Pino 3 (GND)  →  GND do ESP32
```

**Fórmula de conversão** (aplicada em `sensors.cpp`):

```
tensão_mV = (ADC / 4095) × 3300
temp_°C   = (tensão_mV / 10) + 10.0   ← offset de calibração
```

O offset `+10.0°C` foi medido empiricamente para compensar a não-linearidade do ADC do ESP32 em tensões baixas (0–400 mV). Para reajustar, edite em `sensors.cpp`:

```cpp
return (tensaoMv / LM35_MV_POR_GRAU) + 10.0f;
```

O firmware coleta `LM35_AMOSTRAS = 10` leituras e usa a média para reduzir ruído.

> **Instalação no solo:** isole os terminais com tubo termo-retrátil ou resina epóxi para evitar curto com a umidade.

---

## P23 — Umidade do Solo

| Parâmetro | Valor |
|---|---|
| Tensão | 3.3V – 5V |
| Tipo | Resistivo (dois eletrodos metálicos) |
| Saída | Analógica (AO) + Digital com threshold (DO) |

**Pinout:**

```
AO  →  GPIO 34
VCC →  3.3V do ESP32
GND →  GND do ESP32
DO  →  não utilizado
```

**Lógica (relação inversa):**

| Condição | Resistência | ADC |
|---|---|---|
| Solo seco | Alta | ~3000 |
| Solo molhado | Baixa | ~500 |

### Calibração

1. **Sensor no ar (seco):** anote o ADC no Serial Monitor → `SOLO_VALOR_SECO`
2. **Sensor na água:** insira em água limpa e anote o ADC → `SOLO_VALOR_MOLHADO`
3. Atualize em `config.h`:

```cpp
#define SOLO_VALOR_SECO    3000
#define SOLO_VALOR_MOLHADO  500
```

O firmware tira média de 5 leituras para estabilizar a saída.

---

## LDR — Luminosidade

Utilizado pela regra **RN06 (fotoperíodo)**: a luz artificial só acende se a luminosidade natural for insuficiente durante o horário programado.

**Pinout (módulo KY-018 ou similar):**

```
AO  →  GPIO 35
VCC →  3.3V
GND →  GND
DO  →  não usar
```

| ADC | Condição |
|---|---|
| ~0 | Muita luz natural |
| ~4095 | Ambiente escuro |

Limiar configurado em `automation.cpp`:

```cpp
bool escuroSuficiente = (d.ldrRaw > 2000);
```

---

## Módulo de Relé (3 canais)

Use módulo 5V com **optoacoplador** (isolação óptica). Nunca conecte o ESP32 diretamente a relés sem isolação.

**Pinout de controle:**

```
IN1  →  GPIO 26  (bomba d'água)
IN2  →  GPIO 27  (exaustor / ventilador)
IN3  →  GPIO 14  (grow light / lâmpada)
VCC  →  5V (VIN do ESP32)
GND  →  GND do ESP32
```

Lógica configurável em `config.h`:

```cpp
#define RELE_ATIVO_LOW  true   // true = ativo em LOW (padrão)
                               // false = ativo em HIGH
```

> ⚠️ **Segurança elétrica:** use caixa isolante para conexões AC, bitola mínima 1.5mm², disjuntor por circuito, e nunca trabalhe com alimentação AC conectada.

---

## Diagrama de Conexão

```
                          ┌─────────────────────────────┐
DHT11 DATA ────────────── │ GPIO 4     ESP32 WROOM-32   │
LM35DZ VOUT ───────────── │ GPIO 32                      │
P23 AO     ────────────── │ GPIO 34                      │
LDR AO     ────────────── │ GPIO 35                      │
                          │                              │
RELE IN1   ────────────── │ GPIO 26    (bomba)           │
RELE IN2   ────────────── │ GPIO 27    (exaustor)        │
RELE IN3   ────────────── │ GPIO 14    (luzes)           │
                          │                              │
LED onboard ───────────── │ GPIO 2     (status)          │
                          │                              │
3.3V ── DHT11, LM35, P23 │ 3V3                          │
5V   ── RELE VCC          │ VIN (5V USB)                 │
GND  ── todos             │ GND                          │
                          └─────────────────────────────┘
```

---

## Lista de Componentes (BOM)

| Qty | Componente | Observação |
|:---:|---|---|
| 1 | ESP32 DevKit v1 (WROOM-32) | 38 pinos, USB-C ou micro-USB |
| 1 | Sensor DHT11 | Temperatura e umidade do ar |
| 1 | Sensor LM35DZ | Temperatura da terra (TO-92) |
| 1 | Sensor P23 | Umidade do solo (resistivo) |
| 1 | Módulo LDR KY-018 | Ou LDR 5mm + resistor 10kΩ |
| 1 | Módulo relé 3 canais 5V | Com optoacoplador |
| 1 | Resistor 10kΩ | Pull-up para DHT11 |
| 1 | Protoboard ou PCB | Para montagem |
| 1 | Fonte 5V/2A | ESP32 + relés |
| — | Cabos jumper | Macho-macho e macho-fêmea |
| — | Tubo termo-retrátil | Isolação do LM35DZ no solo |

---

## Configuração do Firmware

> As credenciais ficam em `src/secrets.h` — **nunca commitar no Git**.

Copie o template e preencha:

```bash

copy src\secrets.example.h src\secrets.h

```

```cpp
// src/secrets.h
#define WIFI_SSID     "nome_da_rede"
#define WIFI_PASSWORD "senha_wifi"
#define MQTT_HOST     "192.168.x.x"   // ipconfig → Wi-Fi IPv4
#define MQTT_USER     "esp32"
#define MQTT_PASSWORD "esp32_secret"
```

Em `src/config.h` ajuste apenas os valores de operação:

```cpp
// Calibração P23
#define SOLO_VALOR_SECO    3000
#define SOLO_VALOR_MOLHADO  500

// Thresholds de automação
#define DEFAULT_TEMP_MAX       30.0f   // °C → liga exaustor
#define DEFAULT_TEMP_MIN       15.0f   // °C → aquecimento
#define DEFAULT_UMID_SOLO_MIN  40.0f   // % → liga irrigação
#define DEFAULT_UMID_SOLO_MAX  80.0f   // % → desliga irrigação
#define DEFAULT_REGA_MAX_S     120     // segundos máximo de rega contínua

// Fotoperíodo
#define DEFAULT_LUZ_ON   "18:00"
#define DEFAULT_LUZ_OFF  "22:00"
```

---

## Payload MQTT

**Tópico:** `agrotech/{GREENHOUSE_ID}/sensores/estado`

```json
{
  "temp":      25.9,
  "umid_ar":   43.0,
  "temp_solo": 22.7,
  "umid_solo": 100.0,
  "luz":       0
}
```

| Campo | Sensor | Unidade |
|---|---|---|
| `temp` | DHT11 | °C — temperatura do ar |
| `umid_ar` | DHT11 | % — umidade relativa do ar |
| `temp_solo` | LM35DZ | °C — temperatura da terra |
| `umid_solo` | P23 | % — umidade do solo |
| `luz` | LDR | ADC bruto (0–4095) |

Campos de sensores com falha são enviados como `null`. O backend persiste apenas os campos não-nulos no InfluxDB.

---

## Compilar e Gravar

**Pré-requisito:** VS Code + extensão PlatformIO IDE.

```bash
# Compilar
pio run

# Compilar e gravar
pio run --target upload

# Monitor serial
pio device monitor --baud 115200
```

**Saída esperada no Serial Monitor:**

```
========== AgroTech ESP32 ==========
[NVS] Config carregada: t_max=30.0 t_min=15.0 ...
[Sensors] DHT11 + LM35DZ + P23 + LDR inicializados.
[Sensors] Pinos: DHT11=4  LM35=32  P23=34  LDR=35
[Atuadores] Reles inicializados (todos OFF).
[WiFi] Conectado! IP: 192.168.x.x  RSSI: -40dBm
[NTP] Hora: 14:32:05
[MQTT] Conectado!
[Sensors] Ar: T=25.9°C Umid=43.0% | Solo: T=22.7°C Umid=45.0% | LDR=0
========== Setup concluído ==========
```

---

## Troubleshooting

| Problema | Causa provável | Solução |
|---|---|---|
| DHT11 retorna NaN | Sem pull-up ou mau contato no pino 4 | Verificar resistor 10kΩ e conexão DATA |
| LM35 leitura errada | Offset não calibrado para o ambiente | Ajustar `+X` em `sensors.cpp` (atual: `+10`) |
| P23 sempre 0% ou 100% | Calibração incorreta | Medir `SOLO_VALOR_SECO` e `SOLO_VALOR_MOLHADO` |
| ADC instável | Wi-Fi interferindo em ADC2 | Confirmar uso de ADC1 (GPIO 32, 34, 35) |
| Relé não aciona | Lógica invertida | Mudar `RELE_ATIVO_LOW` para `false` em `config.h` |
| MQTT não conecta | IP errado após trocar de Wi-Fi | Atualizar `MQTT_HOST` no `secrets.h` |
| Backend não recebe MQTT | `subscribe()` ausente | Verificar `setupMqttHandlers` em `mqtt.handler.ts` |
| Dados não vão ao InfluxDB | Bucket errado no `.env` | `INFLUX_BUCKET` deve bater com o `docker-compose.yml` |
| Fotoperíodo não funciona | NTP sem sincronizar | Verificar acesso à internet (`pool.ntp.org`) |
| ESP32 reinicia sozinho | Watchdog disparou (loop > 30s) | Ver Serial Monitor para identificar o travamento |
