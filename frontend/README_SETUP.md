# AgroTech Frontend

Frontend React + Vite para o sistema IoT AgroTech, oferecendo painel de controle de estufas com monitoramento de sensores e acionamento de atuadores em tempo real via MQTT.

## 📋 Estrutura do Projeto

```
src/
  ├── pages/              # Páginas principais (Dashboard, Greenhouses, Alerts, Users)
  ├── components/         # Componentes reutilizáveis (Header, Sidebar, Modal, Terminal)
  ├── hooks/              # Custom hooks (useGreenhouses, useAlerts, useTerminalLogs)
  ├── utils/              # Funções utilitárias e dados iniciais
  ├── types/              # Tipos TypeScript compartilhados
  ├── App.tsx             # Componente raiz
  ├── main.tsx            # Entry point
  └── index.css           # Estilos globais com Tailwind
```

## 🚀 Inicialização Rápida

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Instalação

```bash
cd frontend
npm install
```

### Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento iniciará em `http://localhost:3000`

### Build para Produção

```bash
npm run build
npm run preview
```

## 🎯 Funcionalidades

### Páginas Implementadas

1. **Dashboard** - Visão geral de todas as estufas em tempo real
2. **Greenhouses** - Listagem de estufas com configuração de limites
3. **Greenhouse Details** - Painel detalhado com abas:
   - Overview: Sensores e atuadores
   - Limits: Configuração de limiares
   - Metrics: Gráficos InfluxDB (simulado)
4. **Alerts** - Histórico de alertas com resolução
5. **Users** - Gerenciamento de usuários e controle de acesso

### Features

- ✅ Monitoramento em tempo real de sensores (temperatura, umidade ar/solo, luminosidade)
- ✅ Controle de atuadores (lâmpada, exaustor, bomba) via botões
- ✅ Configuração de limiares de operação
- ✅ Sistema de alertas com gravidade (critical, warning, info)
- ✅ Terminal com logs de eventos MQTT/API
- ✅ Suporte a múltiplas estufas
- ✅ Design escuro responsivo com Tailwind CSS
- ✅ Ícones com Lucide React

## 🔌 Integração com Backend

O frontend está configurado para se comunicar com o backend em `http://localhost:5000` via proxy definido em `vite.config.ts`.

### Endpoints esperados

- `GET /api/greenhouses` - Listar estufas
- `POST /api/greenhouses` - Criar estufa
- `GET /api/greenhouses/:id` - Detalhes de estufa
- `PUT /api/greenhouses/:id/config` - Atualizar configuração
- `POST /api/actuators/control` - Controlar atuadores
- `GET /api/alerts` - Listar alertas
- `POST /api/alerts/:id/resolve` - Resolver alerta

## 🎨 Tema e Customização

O projeto usa Tailwind CSS com tema escuro. As cores principais são:
- **Verde Esmeralda**: Status saudável e ações primárias
- **Cinza**: Background e texto secundário
- **Vermelho**: Alertas críticos
- **Amarelo**: Avisos

Para customizar, edite `tailwind.config.js`.

## 📦 Dependências

- **react** - Framework UI
- **react-dom** - Renderização DOM
- **vite** - Build tool rápido
- **tailwindcss** - Framework CSS utilitário
- **lucide-react** - Biblioteca de ícones
- **axios** - Cliente HTTP (para integração futura)

## 🔐 Segurança

- TypeScript para type safety
- CORS configurado para proxy do backend
- Inputs validados em formulários
- Proteção contra XSS com React

## 📝 Notas Desenvolvedor

- O estado global é gerenciado com React Hooks (useState, useContext pronto para implementação)
- Dados iniciais em `src/utils/initialData.ts`
- Simulação de sensores em tempo real implementada em `App.tsx`
- Use `addLog()` para registrar eventos no terminal

## 🐛 Troubleshooting

**Porta 3000 já em uso?**
```bash
npm run dev -- --port 3001
```

**Backend não conecta?**
- Verifique se backend está rodando em `http://localhost:5000`
- Abra DevTools (F12) e veja network requests

**Módulos não encontrados?**
```bash
rm -rf node_modules
npm install
```

---

**Desenvolvido como parte do projeto AgroTech - FATEC 2026**
