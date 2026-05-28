# AgroTech Mobile - React Native

Uma aplicação mobile nativa para monitoramento e controle de estufas inteligentes utilizando React Native.

## 📱 Características

- **Dashboard de Estufa**: Visualize em tempo real sensores (temperatura, umidade, luz)
- **Controle de Atuadores**: Ative/desative lâmpada, exaustor e bomba de água
- **Gerenciamento de Alertas**: Receba notificações quando os parâmetros excedem os limites
- **Configuração de Limites**: Defina limites personalizados para cada métrica
- **Histórico de Métricas**: Acompanhe o histórico das últimas 8 leituras
- **Console em Tempo Real**: Visualize logs de MQTT e WebSocket
- **Controle de Acesso RBAC**: Gerenciamento de usuários e permissões
- **Suporte Offline**: Funcionalidade parcial offline

## 🚀 Começando

### Pré-requisitos

- Node.js 16+
- npm ou yarn
- React Native CLI
- Xcode (para iOS) ou Android Studio (para Android)

### Instalação

1. Instale as dependências:
```bash
npm install
# ou
yarn install
```

2. Inicie o Metro bundler:
```bash
npm start
```

3. Abra em um emulador ou dispositivo:

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

## 📁 Estrutura do Projeto

```
frontend-mobile/
├── src/
│   └── (future: organize code into modules)
├── App.tsx                 # Componente principal
├── index.tsx              # Entry point
├── package.json           # Dependências
├── tsconfig.json          # Configuração TypeScript
├── babel.config.js        # Configuração Babel
└── README.md
```

## 🔧 Configuração

### Conexão com Backend

Edite as URLs de conexão no `App.tsx`:

```typescript
// Exemplo de configuração MQTT
const MQTT_BROKER_URL = 'mqtt://your-broker-url:1883';
const MQTT_TOPIC = 'agrotech/estufa/+/telemetria';
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```
API_URL=http://seu-backend-url
WS_URL=ws://seu-websocket-url
MQTT_BROKER=mqtt://seu-broker-url:1883
```

## 📊 Dados de Exemplo

O app vem com dados iniciais de 3 estufas para demonstração:

- **Estufa Alpha** (Setor Norte): Status Healthy
- **Estufa Beta** (Setor Sul): Status Warning
- **Cúpula Gamma** (Setor Leste): Status Offline

## 🎨 Design

- **Tema**: Dark mode com acentos em verde (Emerald)
- **Responsividade**: Otimizado para dispositivos mobile
- **Ícones**: Lucide React Native
- **Animações**: React Native Animated API

## 📱 Navegação

- **Início**: Dashboard com visão geral das estufas
- **Configurar**: Detalhes e controle de uma estufa específica
- **Alertas**: Lista de anomalias detectadas
- **Ajustes**: Configurações de usuários e banco de dados

## 🔐 Segurança

- Autenticação JWT para WebSocket
- RBAC (Role-Based Access Control)
- Validação de permissões para comandos críticos
- Suporte a MQTT com TLS/SSL

## 🤝 Integração com Backend

A aplicação se integra com:

- **WebSocket**: Comunicação em tempo real
- **MQTT**: Telemetria dos sensores IoT
- **PostgreSQL**: Persistência de dados
- **InfluxDB**: Métricas históricas

## 📦 Dependências Principais

- `react-native`: ^0.73.0
- `react-navigation`: ^6.1.0
- `lucide-react-native`: ^0.263.1
- `mqtt`: ^5.0.0

## 🛠️ Desenvolvimento

### Modo de Debug

```bash
npm start -- --reset-cache
```

### Reload de Assets

- iOS: `cmd + R` no simulador
- Android: `R` duas vezes no terminal

### DevTools

```bash
# Abrir React Native Debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

## 📝 Boas Práticas

- Mantenha componentes pequenos e reutilizáveis
- Use TypeScript para type safety
- Prefira `FlatList` para listas grandes
- Otimize re-renders com `useMemo` e `useCallback`
- Teste em dispositivos reais, não apenas emuladores

## 🚀 Build para Produção

### iOS
```bash
npm run ios -- --configuration Release
```

### Android
```bash
npm run android -- --variant=release
```

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- [Documentação React Native](https://reactnative.dev)
- [React Navigation Docs](https://reactnavigation.org)

## 📄 Licença

Propriedade da FATEC - Projeto de Conclusão (PI)

---

**Última atualização**: Maio 2026
