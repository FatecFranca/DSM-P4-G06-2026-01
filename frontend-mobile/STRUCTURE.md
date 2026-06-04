# Estrutura de Pastas Recomendada para Expansão Futura

```
frontend-mobile/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── layouts/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   └── features/
│   │       ├── GreenhouseCard.tsx
│   │       ├── AlertCard.tsx
│   │       └── SensorGrid.tsx
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── DetailsScreen.tsx
│   │   ├── AlertsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── navigation.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── mqtt.ts
│   │   ├── websocket.ts
│   │   └── storage.ts
│   ├── hooks/
│   │   ├── useGreenhouses.ts
│   │   ├── useAlerts.ts
│   │   ├── useTelemetry.ts
│   │   └── useLogs.ts
│   ├── context/
│   │   ├── AppContext.tsx
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── utils/
│   │   ├── colors.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── types/
│   │   ├── greenhouse.ts
│   │   ├── alert.ts
│   │   └── user.ts
│   └── App.tsx
├── __tests__/
│   ├── components/
│   ├── screens/
│   └── utils/
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── README.md
```

## Próximas Etapas

1. **Integração com Backend**
   - Implementar chamadas de API REST
   - Conectar ao WebSocket real
   - Integração MQTT com broker

2. **Persistência Local**
   - AsyncStorage para cache
   - Realm para dados offline
   - SQLite para queries complexas

3. **Autenticação**
   - Login/Logout
   - JWT token management
   - Deep linking com auth

4. **Notificações Push**
   - Firebase Cloud Messaging
   - Local notifications
   - Badge count

5. **Testes**
   - Unit tests (Jest)
   - Component tests (Testing Library)
   - E2E tests (Detox)

6. **Performance**
   - Code splitting
   - Image optimization
   - Memory profiling

7. **Analytics**
   - Event tracking
   - Crash reporting
   - Performance monitoring

## Recursos Úteis

- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Firebase React Native](https://rnfirebase.io/)
- [Detox E2E Testing](https://wix.github.io/Detox/)
