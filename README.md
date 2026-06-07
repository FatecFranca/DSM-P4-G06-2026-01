
AgroTech e um projeto IoT para monitoramento e automacao de estufas agricolas. O problema abordado e a dificuldade de acompanhar, em tempo real, variaveis importantes do cultivo, como temperatura, umidade do ar, umidade do solo, temperatura do solo e luminosidade, alem de controlar atuadores como bomba d'agua, exaustor e iluminacao.

A solucao foi desenvolvida com uma arquitetura centralizada: o firmware do ESP32 coleta os dados dos sensores e publica no broker MQTT; o backend recebe, valida, armazena e distribui os dados em tempo real; e as aplicacoes web e mobile exibem dashboards, alertas, atuadores e metricas para acompanhamento da estufa.

## Integrantes

- ANDRE CORAL RODRIGUES
- BRUNO JOSE RODRIGUES DA SILVA
- RAUL DE OLIVEIRA GONCALVES
- GUILHERME DE ARAUJO SILVA

## Tecnologias por modulo

### frontend

Aplicacao web responsavel pelo painel administrativo e visualizacao das estufas.

*Tecnologias usadas:*

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Socket.IO via backend
- Lucide React

*Funcionalidades principais:*

- Dashboard web das estufas
- Visualizacao de sensores em tempo real
- Controle de atuadores
- Alertas e status das estufas
- Graficos estatisticos e metricas runtime
- Gerenciamento de usuarios e estufas

### frontend-mobile

Aplicativo mobile para acompanhar as estufas e consultar informacoes principais pelo celular.

*Tecnologias usadas:*

- React Native
- Expo
- TypeScript
- Axios
- AsyncStorage
- Socket.IO Client
- Lucide React Native
- React Native SVG

*Funcionalidades principais:*

- Login com persistencia de sessao
- Dashboard mobile das estufas
- Tela de detalhes da estufa
- Visualizacao de sensores e atuadores
- Alertas
- Atualizacao em tempo real via backend

### backend

API central do sistema, responsavel por integrar MQTT, banco de dados, tempo real e regras de negocio.

*Tecnologias usadas:*

- Node.js
- TypeScript
- Express
- MQTT
- Socket.IO
- Prisma
- PostgreSQL
- InfluxDB
- Redis
- JWT
- Docker
- Zod
- Winston

*Funcionalidades principais:*

- Conexao com broker MQTT
- Recebimento e normalizacao de telemetria
- Persistencia de dados relacionais no PostgreSQL
- Persistencia de series temporais no InfluxDB
- Cache, heartbeat e controle de estado com Redis
- Autenticacao JWT
- Emissao de dados em tempo real para web e mobile
- Controle de estufas, sensores, atuadores, alertas e metricas

### firmware

Firmware embarcado no ESP32, responsavel pela leitura dos sensores e automacao local da estufa.

*Tecnologias usadas:*

- ESP32
- PlatformIO
- Arduino Framework
- PubSubClient
- ArduinoJson
- DHT Sensor Library
- Adafruit Unified Sensor

*Funcionalidades principais:*

- Leitura de temperatura e umidade do ar com DHT11
- Leitura de temperatura do solo com LM35
- Leitura de umidade do solo com sensor P23
- Leitura de luminosidade com LDR
- Publicacao de telemetria via MQTT
- Recebimento de configuracoes e comandos via MQTT
- Controle automatico de bomba, exaustor e luzes
- Envio de heartbeat do dispositivo

## Fluxo principal

txt
Firmware ESP32 -> Broker MQTT -> Backend -> Socket.IO/API -> Frontend Web e Mobile


Web e mobile nao se conectam diretamente ao broker MQTT. Toda comunicacao e centralizada no backend, deixando o sistema mais seguro, organizado e facil de manter.