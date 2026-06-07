# Sistema de Gerenciamento de Estufa Automatizada (ESP32)

Este projeto consiste em um sistema inteligente de monitoramento e controle para estufas, utilizando o microcontrolador ESP32. O objetivo principal é garantir a saúde das plantas, a eficiência no uso de recursos e a segurança do hardware através de automação local e monitoramento remoto via dashboard.

## 📋 Regras de Negócio (RN)

### 1. Modos de Operação e Controle
O sistema foi projetado para equilibrar autonomia local e intervenção do usuário.

*   **RN01 - Dualidade de Operação:** Cada atuador (bomba, exaustor, lâmpada) opera em dois estados:
    *   **Automático:** O ESP32 decide o acionamento com base nos *thresholds* (limiares) configurados.
    *   **Manual:** O usuário força o estado do atuador via dashboard, sobrepondo-se à lógica dos sensores.
*   **RN02 - Precedência de Comando:** Comandos manuais possuem prioridade absoluta sobre a automação. Ao ser ativado manualmente, o sistema entra em um "timeout" configurável (padrão: 30 min) antes de retornar ao modo automático.
*   **RN03 - Operação Offline (Edge Computing):** Em caso de queda de conexão, o ESP32 mantém a execução das regras de automação utilizando os últimos parâmetros salvos em sua memória não volátil (NVS).

### 2. Automação de Clima e Irrigação
Regras específicas para a manutenção do microclima ideal.

*   **RN04 - Controle de Irrigação (Solo):**
    *   Ativação: Se `Umidade_Solo < Limiar_Minimo`.
    *   Desativação: Se `Umidade_Solo >= Limiar_Maximo` **OU** se `Tempo_Ativo > Tempo_Maximo_Rega` (proteção contra transbordamento/vazamentos).
*   **RN05 - Controle Térmico:**
    *   **Exaustão:** Ativa se `Temperatura > Temp_Maxima`.
    *   **Aquecimento:** Ativa se `Temperatura < Temp_Minima`.
*   **RN06 - Gestão de Fotoperíodo:** As *Grow Lights* seguem um cronograma horário pré-definido, condicionado ao sensor LDR. A luz artificial só é acionada se a luminosidade natural for insuficiente durante o horário programado.

### 3. Telemetria e Comunicação
Protocolos para garantir a atualização dos dados e a economia de banda.

*   **RN07 - Ciclo de Coleta (Polling):** O hardware realiza a leitura física dos sensores a cada 60 segundos (ajustável).
*   **RN08 - Sincronização de Dados (Sync):**
    *   **Envio Periódico:** A cada 5 minutos.
    *   **Envio por Evento:** Se houver variação brusca (ex: $\Delta > 5°C$) ou mudança imediata no estado de qualquer atuador.
*   **RN09 - Governança de Dados:** Armazenamento de dados brutos por 30 dias. Dados históricos acima de 30 dias devem ser agregados em médias para otimização do banco de dados.

### 4. Segurança e Failsafe (Proteção de Falhas)
Mecanismos de defesa para integridade da safra e do equipamento.

*   **RN10 - Alertas Críticos:** Notificações imediatas via Push/E-mail se:
    *   Condições ambientais fora da faixa de segurança por $> 15$ min.
    *   Inércia do atuador (ex: Bomba ligada, mas umidade não sobe, indicando reservatório vazio ou falha hidráulica).
*   **RN11 - Monitoramento de Conectividade (Heartbeat):** O dashboard deve sinalizar estado `OFFLINE` e alertar o administrador caso o ESP32 não envie o sinal de *Heartbeat* por mais de 15 minutos.
*   **RN12 - Failsafe de Hardware:** Caso um sensor reporte valores nulos, fora da escala física ou erro de CRC, o ESP32 deve:
    1. Bloquear o atuador correspondente por segurança.
    2. Disparar um alerta de "Falha de Hardware" para manutenção imediata.

### 5. Gestão de Usuários (Dashboard)
Define a hierarquia de controle e segurança de acesso às informações e comandos.

*   **RN13 - Níveis de Acesso:** O sistema deve implementar controle de acesso baseado em funções (RBAC):
    *   **Administrador:** Possui controle total do ecossistema. Pode criar/editar regras, alterar limiares de sensores, adicionar novos módulos ESP32 e realizar acionamentos manuais.
    *   **Visualizador (Monitor):** Possui acesso de *somente leitura*. Pode visualizar o status em tempo real, consultar gráficos e gerar relatórios, mas é impedido de alterar configurações ou atuar sobre o hardware.

---

## 🛠 Tecnologias Sugeridas
*   **Microcontrolador:** ESP32 (WROOM/WROVER)
*   **Protocolo de Comunicação:** MQTT (Preferencial para IoT) ou HTTP/Rest.
*   **Sensores:** DHT22 (Clima), Solo Capacitivo, LDR (Luminosidade).
*   **Armazenamento:** InfluxDB ou PostgreSQL (Time-series optimization).

---
Esta é a atualização do seu documento README. Adicionei uma seção detalhada sobre a **Arquitetura de Comunicação e Protocolo MQTT**, estruturando a hierarquia de tópicos, níveis de serviço (QoS) e mecanismos de confiabilidade como LWT.

---


## 📡 Arquitetura de Comunicação (MQTT)

O sistema utiliza o protocolo **MQTT (Message Queuing Telemetry Transport)** para garantir baixa latência e alta confiabilidade na troca de mensagens entre o hardware e o software.

### 1. Componentes do Ecossistema
*   **Edge (ESP32):** Coleta dados dos sensores e executa comandos nos atuadores.
*   **Broker MQTT:** Centralizador de mensagens (ex: Mosquitto, HiveMQ ou AWS IoT Core).
*   **Back-end/Worker:** Processa regras complexas e persiste dados em banco de dados.
*   **Dashboard:** Interface de usuário que consome a API do back-end ou conecta-se via WebSockets.

### 2. Hierarquia de Tópicos (Topic Tree)
A estrutura segue o padrão: `aplicacao/id_estufa/funcao/subfuncao`.

| Fluxo | Tópico | Conteúdo (Payload) |
| :--- | :--- | :--- |
| **Telemetria** | `agrotech/estufa01/sensores/clima` | JSON: Temp. e Umid. Ar |
| **Telemetria** | `agrotech/estufa01/sensores/solo` | JSON: Umid. Solo |
| **Telemetria** | `agrotech/estufa01/status/atuadores` | Estado real (ON/OFF) dos relés |
| **Telemetria** | `agrotech/estufa01/status/sistema` | Heartbeat, RSSI Wi-Fi, Uptime |
| **Comando** | `agrotech/estufa01/cmd/bomba` | LIGAR / DESLIGAR |
| **Comando** | `agrotech/estufa01/cmd/config` | Novos limiares de operação |

### 3. Qualidade de Serviço (QoS) e Confiabilidade

| Função | Nível QoS | Retain Flag | Descrição |
| :--- | :---: | :---: | :--- |
| **Leitura Sensores** | 0 | False | Entrega "no máximo uma vez". Eficiente para telemetria contínua. |
| **Comandos** | 1 | False | Entrega "pelo menos uma vez". Garante que o ESP32 receba a ordem. |
| **Configurações** | 1 | True | Mantém o último limiar no Broker para quando o ESP32 reconectar. |
| **Status Conexão** | 1 | True | Utiliza **LWT (Last Will and Testament)** para reportar queda inesperada. |

### 4. Recurso LWT (Testamento)
Para evitar falsos positivos de disponibilidade, o ESP32 registra no Broker uma "última vontade": caso a conexão TCP seja interrompida abruptamente, o Broker publica automaticamente a mensagem `OFFLINE` no tópico `agrotech/estufa01/status/conexao`, permitindo o alerta imediato ao usuário.

---

## 🛠 Tecnologias
*   **Microcontrolador:** ESP32
*   **Protocolo:** MQTT v3.1.1
*   **Formato de Dados:** JSON
*   **Segurança:** TLS/SSL (opcional para Broker) + Autenticação por Token/User.

---

Aqui está a nova seção detalhando as estruturas de dados (JSON) para a comunicação do sistema, pronta para ser adicionada ao seu documento:

---

## 📑 4. Dicionário de Payloads JSON

Esta seção define a estrutura das mensagens trocadas via MQTT, garantindo a padronização entre o firmware (ESP32) e o software (Back-end/Dashboard).

### 4.1 Upstream (ESP32 ➜ Back-end)
Pacotes enviados pelo microcontrolador para reportar telemetria e estado operacional.

#### **A. Leitura de Sensores Consolidada**
Enviado periodicamente (conforme RN08) ou por variação brusca. Agrupa os dados para otimizar o consumo de banda.
*   **Tópico:** `agrotech/estufa01/sensores/estado`
```json
{
  "temp": 24.5,
  "umid_ar": 62.0,
  "umid_solo": 38.5,
  "luz": 850
}
```

#### **B. Confirmação de Ação de Atuador**
Publicado sempre que um relé altera seu estado, permitindo atualização em tempo real do dashboard e auditoria no banco de dados.
*   **Tópico:** `agrotech/estufa01/status/atuadores`
```json
{
  "equip": "bomba",
  "estado": true,
  "gatilho": "automatico"
}
```
> **Nota:** O campo `estado` utiliza booleanos (`true`/`false`) para otimizar o processamento e a indexação no banco de dados.

#### **C. Heartbeat e Saúde do Dispositivo**
Informa a integridade do hardware e qualidade da conexão Wi-Fi.
*   **Tópico:** `agrotech/estufa01/status/sistema`
```json
{
  "status": "ONLINE",
  "uptime": 86400,
  "wifi_rssi": -65,
  "mem_livre": 124500
}
```
> **Failsafe:** O recurso **LWT (Last Will)** deve ser configurado para publicar `{"status": "OFFLINE"}` neste tópico em caso de queda de conexão.

---

### 4.2 Downstream (Back-end ➜ ESP32)
Pacotes enviados pelo servidor para controle e parametrização.

#### **A. Comando Manual**
Enviado quando o usuário intervém diretamente nos equipamentos via interface.
*   **Tópico:** `agrotech/estufa01/cmd/bomba` (ou `ventilador`, `luzes`)
```json
{
  "comando": true,
  "tempo_ignorar_sensores": 1800,
  "usuario": "admin_joao"
}
```
*   **Precedência:** Conforme a **RN02**, o ESP32 deve ignorar a automação pelo tempo definido em `tempo_ignorar_sensores` (segundos).

#### **B. Atualização de Limiares (Configuração)**
Enviado quando as Regras de Negócio de clima são alteradas. Este tópico utiliza a **Retain Flag**.
*   **Tópico:** `agrotech/estufa01/cmd/config`
```json
{
  "t_max": 28.0,
  "t_min": 18.0,
  "u_solo_min": 40.0,
  "t_rega_max": 120,
  "luz_on": "18:00",
  "luz_off": "22:00"
}
```
*   **Persistência:** Ao receber este JSON, o ESP32 deve salvar os valores em sua memória não volátil (**NVS/LittleFS**) para garantir a operação offline.

---

Esta é a nova seção técnica para o seu README, focada na implementação do firmware. Melhorei a explicação sobre a gestão de memória e estruturei o código para ser utilizado como um guia de referência rápida para o desenvolvedor.

---

## 💻 5. Implementação Técnica: Manipulação de JSON (ArduinoJson v7)

Para garantir que o ESP32 processe os dados de forma eficiente e segura, utilizamos a biblioteca **ArduinoJson (Versão 7)**. A versão 7 introduz o `JsonDocument`, que gerencia automaticamente a alocação de memória, prevenindo falhas críticas de *stack overflow*.

### 5.1 Estrutura de Memória e Performance
Diferente das versões anteriores, o `JsonDocument` na V7 é inteligente: ele utiliza a pilha (stack) para objetos pequenos e migra automaticamente para o heap caso o payload cresça, otimizando o uso de recursos do ESP32.

### 5.2 Snippets de Implementação (C++)

Abaixo, os métodos recomendados para serialização (envio de telemetria) e desserialização (recebimento de comandos).

```cpp
#include <Arduino.h>
#include <ArduinoJson.h>

// Variáveis globais (Persistidas no firmware)
float tempMax = 28.0, tempMin = 18.0, umidSoloMin = 40.0;
int tempoRegaMax = 120;
String luzOn = "18:00", luzOff = "22:00";

/**
 * @brief Gera o payload de telemetria para envio via MQTT.
 * RN08: Agrupamento de sensores em um único pacote.
 */
String criarPayloadTelemetria(float temp, float umidAr, float umidSolo, int luz) {
    JsonDocument doc; // Gerenciamento automático de memória (V7)

    doc["temp"]      = temp;
    doc["umid_ar"]   = umidAr;
    doc["umid_solo"] = umidSolo;
    doc["luz"]       = luz;

    String payload;
    serializeJson(doc, payload); // Transforma em String compacta
    return payload;
}

/**
 * @brief Processa configurações recebidas do Back-end.
 * RN02 e RN13: Aplicação de novos limiares e controle manual.
 */
void processarConfiguracao(char* jsonRecebido) {
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, jsonRecebido);

    // Failsafe: Aborta se o JSON estiver malformado
    if (error) {
        Serial.printf("Erro de desserialização: %s\n", error.f_str());
        return;
    }

    // Programação Defensiva: Atualiza apenas as chaves presentes no payload
    if (doc.containsKey("t_max"))      tempMax = doc["t_max"];
    if (doc.containsKey("t_min"))      tempMin = doc["t_min"];
    if (doc.containsKey("u_solo_min")) umidSoloMin = doc["u_solo_min"];
    if (doc.containsKey("t_rega_max")) tempoRegaMax = doc["t_rega_max"];
    
    if (doc.containsKey("luz_on"))     luzOn = doc["luz_on"].as<String>();
    if (doc.containsKey("luz_off"))    luzOff = doc["luz_off"].as<String>();

    Serial.println("[INFO] Configurações atualizadas via MQTT.");
    
    // Sugestão: Chamar função para salvar em LittleFS ou NVS aqui.
}
```

### 5.3 Boas Práticas Implementadas

1.  **Uso de `containsKey()`**: Essencial para permitir atualizações parciais. Se o Dashboard enviar apenas o horário das luzes, os limiares de umidade e temperatura permanecem intactos, evitando sobrescritas acidentais com valores nulos.
2.  **Tratamento de Strings**: Ao converter campos JSON para `String` no Arduino, utilizamos explicitamente `.as<String>()` para garantir a conversão correta de tipos e evitar ponteiros inválidos.
3.  **Failsafe de Desserialização**: O check do `DeserializationError` impede que o hardware tente acessar dados de um pacote corrompido, o que poderia causar o travamento (*crash*) do ESP32.

### 5.4 Persistência de Dados (NVS)
Para atender à **RN03 (Operação Offline)**, recomenda-se que, após a execução da função `processarConfiguracao`, os valores sejam salvos na memória não volátil do ESP32 (usando as bibliotecas `Preferences.h` ou `LittleFS`). Isso garante que, em caso de reboot por falta de energia, a estufa retorne operando com os últimos parâmetros definidos pelo usuário.

---
*Este documento é uma especificação técnica para guiar o desenvolvimento de firmware, infraestrutura e interfaces.*